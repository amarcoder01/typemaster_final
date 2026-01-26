import type { RaceParticipant } from "@shared/schema";
import { botService } from "./bot-service";

export interface BotRetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export interface BotCreationResult {
  success: boolean;
  bot?: RaceParticipant;
  error?: Error;
  attempts: number;
}

export interface BatchResult {
  successful: RaceParticipant[];
  failed: Array<{ username: string; error: Error; attempts: number }>;
  totalRequested: number;
  totalSucceeded: number;
  totalFailed: number;
}

const DEFAULT_RETRY_CONFIG: Required<BotRetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

const RETRYABLE_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "EPIPE",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "40P01", // Postgres deadlock detected
  "40001", // serialization_failure
  "53300", // too_many_connections
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
]);

const NON_RETRYABLE_ERROR_MARKERS = [
  "race not found",
  "race_full",
  "race full",
  "invalid",
  "duplicate key",
  "violates",
  "validation",
];

const RETRYABLE_ERROR_MARKERS = [
  "timeout",
  "temporarily",
  "deadlock",
  "connection",
  "could not connect",
  "terminating connection",
  "too many clients",
];

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error(typeof value === "string" ? value : "BOT_CREATE_FAILED");
}

function normalizeConfig(config: BotRetryConfig): Required<BotRetryConfig> {
  const maxRetries = Number.isFinite(config.maxRetries)
    ? Math.max(0, Math.min(10, Math.floor(config.maxRetries as number)))
    : DEFAULT_RETRY_CONFIG.maxRetries;
  const initialDelayMs = Number.isFinite(config.initialDelayMs)
    ? Math.max(10, Math.floor(config.initialDelayMs as number))
    : DEFAULT_RETRY_CONFIG.initialDelayMs;
  const maxDelayMs = Number.isFinite(config.maxDelayMs)
    ? Math.max(initialDelayMs, Math.floor(config.maxDelayMs as number))
    : DEFAULT_RETRY_CONFIG.maxDelayMs;
  const backoffMultiplier = Number.isFinite(config.backoffMultiplier)
    ? Math.max(1, Math.floor(config.backoffMultiplier as number))
    : DEFAULT_RETRY_CONFIG.backoffMultiplier;

  return {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
  };
}

function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { code?: string; message?: string };
  const code = err.code || "";
  const message = String(err.message || "").toLowerCase();

  if (NON_RETRYABLE_ERROR_MARKERS.some(marker => message.includes(marker))) {
    return false;
  }

  if (RETRYABLE_ERROR_CODES.has(code)) {
    return true;
  }

  if (RETRYABLE_ERROR_MARKERS.some(marker => message.includes(marker))) {
    return true;
  }

  return false;
}

async function delayWithBackoff(attempt: number, config: Required<BotRetryConfig>): Promise<void> {
  const baseDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs,
  );
  const jitter = Math.random() * 0.3 * baseDelay;
  const finalDelay = baseDelay + jitter;
  await new Promise(resolve => setTimeout(resolve, finalDelay));
}

async function createBotWithRetry(
  raceId: number,
  config: Required<BotRetryConfig>,
  label: string,
): Promise<BotCreationResult> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const created = await botService.addBotsToRace(raceId, 1);
      const bot = created[0];
      if (!bot) {
        throw new Error("BOT_CREATE_FAILED");
      }
      if (created.length > 1) {
        console.warn(`[Bot Retry] Created ${created.length} bots for ${label} in race ${raceId}, expected 1`);
      }
      return { success: true, bot, attempts: attempt + 1 };
    } catch (error) {
      lastError = toError(error);
      const retryable = isRetryableError(error);
      console.warn(
        `[Bot Retry] Attempt ${attempt + 1} failed for ${label} in race ${raceId} (${retryable ? "retryable" : "non-retryable"}):`,
        lastError.message,
      );
      if (!retryable || attempt === config.maxRetries) {
        break;
      }
      await delayWithBackoff(attempt, config);
    }
  }

  return {
    success: false,
    error: lastError || new Error("BOT_CREATE_FAILED"),
    attempts: config.maxRetries + 1,
  };
}

class BotRetryService {
  async addBotsToRaceWithRetry(
    raceId: number,
    botCount: number,
    config: BotRetryConfig = {},
  ): Promise<BatchResult> {
    const finalConfig = normalizeConfig(config);
    const safeCount = Number.isFinite(botCount) ? Math.max(0, Math.floor(botCount)) : 0;

    if (!Number.isFinite(raceId) || raceId <= 0) {
      return {
        successful: [],
        failed: [
          {
            username: "unknown",
            error: new Error("INVALID_RACE_ID"),
            attempts: 0,
          },
        ],
        totalRequested: safeCount,
        totalSucceeded: 0,
        totalFailed: safeCount > 0 ? 1 : 0,
      };
    }

    if (safeCount === 0) {
      return {
        successful: [],
        failed: [],
        totalRequested: 0,
        totalSucceeded: 0,
        totalFailed: 0,
      };
    }

    const successful: RaceParticipant[] = [];
    const failed: Array<{ username: string; error: Error; attempts: number }> = [];

    for (let i = 0; i < safeCount; i++) {
      const label = `bot-${i + 1}`;
      const result = await createBotWithRetry(raceId, finalConfig, label);
      if (result.success && result.bot) {
        successful.push(result.bot);
      } else if (result.error) {
        failed.push({
          username: label,
          error: result.error,
          attempts: result.attempts,
        });
      }
    }

    return {
      successful,
      failed,
      totalRequested: safeCount,
      totalSucceeded: successful.length,
      totalFailed: failed.length,
    };
  }
}

export const botRetryService = new BotRetryService();
