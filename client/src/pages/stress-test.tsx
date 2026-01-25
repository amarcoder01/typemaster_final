import { useState, useEffect, useRef, useCallback, useMemo, memo, useLayoutEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Zap, Volume2, VolumeX, AlertTriangle, Clock, Target, Flame, XCircle, Timer, BarChart3, RefreshCw, Home, LogIn, WifiOff, Award, X, ChevronRight, Play, Sparkles, Eye, HelpCircle, Share2, Twitter, MessageCircle, Linkedin, Send, Copy, Check } from 'lucide-react';
import { useSEO, SEO_CONFIGS } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { calculateWPM, calculateAccuracy } from '@/lib/typing-utils';
import { useAuth } from '@/lib/auth-context';
import { useNetwork } from '@/lib/network-context';
import { StressCertificate } from '@/components/StressCertificate';
import { StressShareCard } from '@/components/StressShareCard';
import StressResultsComplete from '@/components/StressResultsComplete';
import { TormentGrid, type TormentType } from '@/components/TormentIndicator';
import { TormentsMatrix } from '@/components/TormentsMatrix';
import { getStressPerformanceRating, buildStressShareText } from '@/lib/share-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LLMExplanation } from '@/components/ui/llm-explanation';
import { AuthPrompt } from '@/components/auth-prompt';

type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'nightmare' | 'impossible';

// URL-friendly slugs for each difficulty mode
const DIFFICULTY_SLUGS: Record<Difficulty, string> = {
  beginner: 'warm-up',
  intermediate: 'mind-scrambler',
  expert: 'absolute-mayhem',
  nightmare: 'nightmare-realm',
  impossible: 'impossible',
};

// Reverse mapping: slug -> difficulty
const SLUG_TO_DIFFICULTY: Record<string, Difficulty> = {
  'warm-up': 'beginner',
  'mind-scrambler': 'intermediate',
  'absolute-mayhem': 'expert',
  'nightmare-realm': 'nightmare',
  'impossible': 'impossible',
  // Also support old technical names for backwards compatibility
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'expert': 'expert',
  'nightmare': 'nightmare',
};

interface StressEffects {
  screenShake: boolean;
  distractions: boolean;
  sounds: boolean;
  speedIncrease: boolean;
  limitedVisibility: boolean;
  colorShift: boolean;
  gravity: boolean;
  rotation: boolean;
  glitch: boolean;
  textFade: boolean;
  reverseText: boolean;
  randomJumps: boolean;
  screenInvert: boolean;
  zoomChaos: boolean;
  screenFlip: boolean;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, {
  name: string;
  description: string;
  effects: StressEffects;
  duration: number;
  icon: string;
  color: string;
  accentColor: string;
  bgGradient: string;
  baseShakeIntensity: number;
  particleFrequency: number;
  multiplier: number;
  difficulty: string;
  maxBlur?: number;
  blurPulse?: boolean;
  constantBlur?: number;
  blurPulseSpeed?: number;
  realityDistortion?: boolean;
  chromaticAberration?: boolean;
  textScramble?: boolean;
  multiEffectCombos?: boolean;
  extremeChaosWaves?: boolean;
  doubleVision?: boolean;
  textWarp?: boolean;
  chaosIntensityMultiplier?: number;
}> = {
  beginner: {
    name: 'Warm-Up',
    description: 'Light screen shake and distractions',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: false,
      limitedVisibility: false,
      colorShift: false,
      gravity: false,
      rotation: false,
      glitch: false,
      textFade: false,
      reverseText: false,
      randomJumps: false,
      screenInvert: false,
      zoomChaos: false,
      screenFlip: false,
    },
    duration: 30,
    icon: '🔥',
    color: '#f59e0b',
    accentColor: 'amber',
    bgGradient: 'from-amber-500/10 to-orange-500/5',
    baseShakeIntensity: 3,
    particleFrequency: 0.15,
    multiplier: 1,
    difficulty: 'Easy',
  },
  intermediate: {
    name: 'Mind Scrambler',
    description: 'Screen inverts, zoom chaos begins',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: false,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: false,
      textFade: false,
      reverseText: false,
      randomJumps: false,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: false,
    },
    duration: 45,
    icon: '⚡',
    color: '#a855f7',
    accentColor: 'purple',
    bgGradient: 'from-purple-500/10 to-pink-500/5',
    baseShakeIntensity: 8,
    particleFrequency: 0.3,
    multiplier: 2,
    difficulty: 'Medium',
  },
  expert: {
    name: 'Absolute Mayhem',
    description: 'Screen flips, glitches everywhere',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: true,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: true,
      textFade: true,
      reverseText: false,
      randomJumps: false,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: true,
    },
    duration: 60,
    icon: '💀',
    color: '#ef4444',
    accentColor: 'red',
    bgGradient: 'from-red-500/10 to-orange-500/5',
    baseShakeIntensity: 25,
    particleFrequency: 0.7,
    multiplier: 3,
    difficulty: 'Hard',
  },
  nightmare: {
    name: 'Nightmare Realm',
    description: 'Text reverses, blur pulses',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: false,
      limitedVisibility: true,
      colorShift: false,
      gravity: false,
      rotation: false,
      glitch: true,
      textFade: false,
      reverseText: true,
      randomJumps: false,
      screenInvert: false,
      zoomChaos: false,
      screenFlip: false,
    },
    duration: 90,
    icon: '☠️',
    color: '#f43f5e',
    accentColor: 'rose',
    bgGradient: 'from-rose-500/10 to-red-900/5',
    baseShakeIntensity: 8,
    particleFrequency: 0.3,
    multiplier: 4,
    difficulty: 'Extreme',
    maxBlur: 1.8,
    blurPulse: true,
    constantBlur: 0.3,
    blurPulseSpeed: 0.1,
  },
  impossible: {
    name: 'IMPOSSIBLE',
    description: 'ALL effects active - reality breaks',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: true,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: true,
      textFade: true,
      reverseText: true,
      randomJumps: true,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: true,
    },
    duration: 120,
    icon: '🌀',
    color: '#d946ef',
    accentColor: 'fuchsia',
    bgGradient: 'from-fuchsia-500/10 to-purple-900/5',
    baseShakeIntensity: 25,
    particleFrequency: 0.8,
    multiplier: 5,
    difficulty: 'Legendary',
    maxBlur: 3.5,
    blurPulse: true,
    constantBlur: 0.8,
    blurPulseSpeed: 0.2,
    realityDistortion: true,
    chromaticAberration: true,
    textScramble: true,
    multiEffectCombos: true,
    extremeChaosWaves: true,
    doubleVision: true,
    textWarp: true,
    chaosIntensityMultiplier: 1,
  },
};

const STRESS_SENTENCES = [
  "The quick brown fox jumps over the lazy dog while the world shakes violently around you.",
  "In the midst of chaos, only the focused mind prevails against impossible odds.",
  "Type through the storm, embrace the madness, and prove your worth as a master typist.",
  "Your fingers dance on keys while reality itself trembles and distorts before your eyes.",
  "Focus is everything when the screen becomes your worst enemy in this battle of wills.",
  "When the world falls apart around you, let your fingers find their rhythm in the chaos.",
  "Every keystroke is a victory against the madness that surrounds your screen tonight.",
  "The storm rages but your hands remain steady on the keyboard through it all.",
  "Through glitch and shake, through flash and fade, the determined typist perseveres.",
  "Master the chaos or be consumed by it - there is no middle ground here for you.",
  "Concentration is your shield against the visual assault of this stress test.",
  "Let the screen shake, let the colors shift - your typing will not falter today.",
  "In darkness and confusion, the skilled typist finds clarity in each keystroke.",
  "Reality bends and warps but your focus remains unbroken through it all.",
  "The keys beneath your fingers are your only connection to sanity in this storm.",
  "Embrace the chaos, let it flow through you, and emerge victorious on the other side.",
  "Speed and accuracy become one as you type through the visual madness around you.",
  "Your mind is a fortress, your fingers are soldiers, and every word is a victory won.",
  "The screen may flicker and dance but your determination remains absolutely steadfast.",
  "Type like your life depends on it because in this test your score certainly does.",
  "Chaos is merely a ladder for those who refuse to let their focus waver even slightly.",
  "The visual storm is nothing compared to the calm precision of your practiced fingers.",
  "Each character you type correctly is a small triumph against the forces of distraction.",
  "Stay calm, stay focused, and let your muscle memory guide you through this trial.",
];

const generateStressText = (durationSeconds: number): string => {
  const targetCharsPerSecond = 6;
  const targetLength = durationSeconds * targetCharsPerSecond;

  const shuffled = [...STRESS_SENTENCES].sort(() => Math.random() - 0.5);

  let result = '';
  let sentenceIndex = 0;

  while (result.length < targetLength && sentenceIndex < shuffled.length) {
    if (result.length > 0) {
      result += ' ';
    }
    result += shuffled[sentenceIndex];
    sentenceIndex++;
  }

  if (result.length < targetLength && shuffled.length > 0) {
    let extraIndex = 0;
    while (result.length < targetLength) {
      result += ' ' + shuffled[extraIndex % shuffled.length];
      extraIndex++;
    }
  }

  return result;
};

const MAX_PARTICLES = 20;

interface ParticleData {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
}

const Particle = memo(({ particle }: { particle: ParticleData }) => (
  <div
    className="fixed pointer-events-none text-4xl animate-ping z-50"
    style={{
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      animationDuration: `${particle.speed}s`,
    }}
    aria-hidden="true"
  >
    {particle.emoji}
  </div>
));

Particle.displayName = 'Particle';

let globalAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    if (!globalAudioContext || globalAudioContext.state === 'closed') {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioContext.state === 'suspended') {
      globalAudioContext.resume();
    }
    return globalAudioContext;
  } catch {
    return null;
  }
}

export default function StressTest() {
  useSEO(SEO_CONFIGS.stressTest);
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const lastToastTimeRef = useRef<Record<string, number>>({});
  const showDebouncedToast = useCallback((key: string, title: string, description: string, variant: "default" | "destructive" = "default", debounceMs = 2000) => {
    const now = Date.now();
    const lastTime = lastToastTimeRef.current[key] || 0;
    if (now - lastTime > debounceMs) {
      lastToastTimeRef.current[key] = now;
      toast({ title, description, variant });
    }
  }, [toast]);

  const { isOnline, isServerReachable, addPendingAction, checkConnection } = useNetwork();
  const [, setLocation] = useLocation();
  const [showCertificate, setShowCertificate] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [lastTestResultId, setLastTestResultId] = useState<number | null>(null);
  const [certificateVerificationId, setCertificateVerificationId] = useState<string | null>(null);
  const [pendingResultData, setPendingResultData] = useState<{
    difficulty: Difficulty;
    enabledEffects: StressEffects;
    wpm: number;
    accuracy: number;
    errors: number;
    maxCombo: number;
    totalCharacters: number;
    duration: number;
    survivalTime: number;
    completionRate: number;
    stressScore: number;
    consistency: number;
    activeChallenges: number;
  } | null>(null);
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const MAX_AUTO_RETRIES = 3;
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [currentColor, setCurrentColor] = useState('hsl(0, 0%, 100%)');
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [gravityOffset, setGravityOffset] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [textReversed, setTextReversed] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [backgroundFlash, setBackgroundFlash] = useState(false);
  const [stressLevel, setStressLevel] = useState(0);
  const [screenInverted, setScreenInverted] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [screenFlipped, setScreenFlipped] = useState(false);
  const [comboExplosion, setComboExplosion] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [isClarityWindow, setIsClarityWindow] = useState(false);
  const isClarityWindowRef = useRef(false);
  const [chromaticOffset, setChromaticOffset] = useState({ r: 0, g: 0, b: 0 });
  const [realityWarp, setRealityWarp] = useState(0);
  const [textScrambleActive, setTextScrambleActive] = useState(false);
  const [chaosWaveIntensity, setChaosWaveIntensity] = useState(0);
  const [multiEffectActive, setMultiEffectActive] = useState(false);
  const [doubleVisionOffset, setDoubleVisionOffset] = useState({ x: 0, y: 0 });
  const [textWarpAmount, setTextWarpAmount] = useState(0);
  const blurPulsePhaseRef = useRef(0);

  const [finalResults, setFinalResults] = useState<{
    survivalTime: number;
    wpm: number;
    accuracy: number;
    completionRate: number;
    stressScore: number;
    consistency: number;
    completed: boolean;
  } | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pendingTimeoutsRef = useRef<Map<ReturnType<typeof setTimeout>, boolean>>(new Map());
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clarityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blurIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const testSessionRef = useRef<number>(0);
  const isTestActiveRef = useRef<boolean>(false);
  const particleIdRef = useRef<number>(0);
  const finishTestRef = useRef<(completed: boolean) => void>(() => { });
  const maxComboRef = useRef<number>(0);
  const typedTextRef = useRef<string>('');
  const currentTextRef = useRef<string>('');
  const errorsRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const selectedDifficultyRef = useRef<Difficulty | null>(null);
  const completedRef = useRef<boolean>(false);
  const stressLevelRef = useRef<number>(0);
  const configRef = useRef<typeof DIFFICULTY_CONFIGS[Difficulty] | null>(null);
  const wpmSamplesRef = useRef<number[]>([]);
  const consistencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isExtendingTextRef = useRef<boolean>(false);
  const lastExtendedAtRef = useRef<number>(0);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const config = selectedDifficulty ? DIFFICULTY_CONFIGS[selectedDifficulty] : null;

  // Extend text when user is nearing the end - production-ready approach
  const extendStressText = useCallback(() => {
    // Prevent rapid extensions
    const now = Date.now();
    if (isExtendingTextRef.current || now - lastExtendedAtRef.current < 300) {
      return;
    }

    // Double-check we're still in an active test
    if (!isTestActiveRef.current || isFinished) {
      return;
    }

    isExtendingTextRef.current = true;
    lastExtendedAtRef.current = now;

    // Get 3-5 random sentences to append
    const additionalSentences = [...STRESS_SENTENCES]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3))
      .join(' ');

    setCurrentText(prev => {
      const newText = prev + ' ' + additionalSentences;
      currentTextRef.current = newText;
      return newText;
    });

    // Reset flag after state update with a small delay to ensure state is applied
    setTimeout(() => {
      isExtendingTextRef.current = false;
    }, 100);
  }, [isFinished]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stressLevelRef.current = stressLevel;
  }, [stressLevel]);

  const safeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      pendingTimeoutsRef.current.delete(timeoutId);
      if (isTestActiveRef.current) {
        callback();
      }
    }, delay);
    pendingTimeoutsRef.current.set(timeoutId, true);
    return timeoutId;
  }, []);

  const clearAllTimers = useCallback(() => {
    pendingTimeoutsRef.current.forEach((_, id) => clearTimeout(id));
    pendingTimeoutsRef.current.clear();

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (effectsIntervalRef.current) {
      clearInterval(effectsIntervalRef.current);
      effectsIntervalRef.current = null;
    }
    if (shakeIntervalRef.current) {
      clearInterval(shakeIntervalRef.current);
      shakeIntervalRef.current = null;
    }
    if (stressIntervalRef.current) {
      clearInterval(stressIntervalRef.current);
      stressIntervalRef.current = null;
    }
    if (clarityIntervalRef.current) {
      clearInterval(clarityIntervalRef.current);
      clarityIntervalRef.current = null;
    }
    if (blurIntervalRef.current) {
      clearInterval(blurIntervalRef.current);
      blurIntervalRef.current = null;
    }
    if (consistencyIntervalRef.current) {
      clearInterval(consistencyIntervalRef.current);
      consistencyIntervalRef.current = null;
    }
  }, []);

  const resetVisualStates = useCallback(() => {
    setShakeIntensity(0);
    setParticles([]);
    setCurrentColor('hsl(0, 0%, 100%)');
    setBlur(0);
    setRotation(0);
    setGravityOffset(0);
    setGlitchActive(false);
    setTextOpacity(1);
    setTextReversed(false);
    setTextPosition({ x: 0, y: 0 });
    setBackgroundFlash(false);
    setStressLevel(0);
    setScreenInverted(false);
    setZoomScale(1);
    setScreenFlipped(false);
    setComboExplosion(false);
    setShakeOffset({ x: 0, y: 0 });
    setIsClarityWindow(false);
    isClarityWindowRef.current = false;
    setChromaticOffset({ r: 0, g: 0, b: 0 });
    setRealityWarp(0);
    setTextScrambleActive(false);
    setChaosWaveIntensity(0);
    setMultiEffectActive(false);
    setDoubleVisionOffset({ x: 0, y: 0 });
    setTextWarpAmount(0);
    blurPulsePhaseRef.current = 0;
  }, []);

  const playSound = useCallback((type: 'correct' | 'error' | 'combo' | 'chaos') => {
    if (!soundEnabled || prefersReducedMotion) return;

    const ctx = getSharedAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'combo':
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'chaos':
          oscillator.frequency.setValueAtTime(100 + Math.random() * 400, ctx.currentTime);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
      }
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled, prefersReducedMotion]);

  const saveResultMutation = useMutation({
    mutationFn: async (data: {
      difficulty: Difficulty;
      wpm: number;
      accuracy: number;
      errors: number;
      maxCombo: number;
      totalCharacters: number;
      duration: number;
      survivalTime: number;
      completionRate: number;
      stressScore: number;
      enabledEffects: StressEffects;
      consistency: number;
      activeChallenges: number;
    }) => {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Include validation errors in the error message for better user feedback
        const errorMessage = errorData.errors 
          ? `${errorData.message || 'Validation failed'}: ${errorData.errors}`
          : errorData.message || 'Failed to save result';
        const error = new Error(errorMessage);
        (error as any).status = res.status;
        (error as any).errors = errorData.errors;
        throw error;
      }
      return res.json();
    },
    onSuccess: async (data) => {
      setPendingResultData(null);
      setSaveRetryCount(0); // Reset retry count on success
      setSaveErrorMessage(null); // Clear error message on success
      if (data.result?.id) {
        setLastTestResultId(data.result.id);
      }
      if (data?.certificate?.verificationId) {
        setCertificateVerificationId(data.certificate.verificationId);
      } else if (data.result?.id) {
        // Fallback: Fetch the certificate if not in response
        try {
          const certResponse = await fetch(`/api/certificates?type=stress&limit=1`, {
            credentials: 'include',
          });
          if (certResponse.ok) {
            const certificates = await certResponse.json();
            const latestCert = Array.isArray(certificates) ? certificates[0] : null;
            if (latestCert?.verificationId && latestCert?.stressTestId === data.result.id) {
              setCertificateVerificationId(latestCert.verificationId);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch certificate:', err);
        }
      }
      showDebouncedToast('save-success', 'Result Saved!', 'Your stress test score has been recorded.', 'default', 5000);
    },
    onError: (error: any, variables) => {
      console.error('Failed to save result:', error);
      
      // Check if it's a validation error (400 status)
      const isValidationError = error?.status === 400;
      const errorMessage = error?.message || 'Failed to save result';
      
      // Store error message for display in UI
      setSaveErrorMessage(errorMessage);
      
      // For validation errors, don't retry automatically (they will always fail)
      // For other errors (network, server), allow retry
      if (!isValidationError) {
        setPendingResultData(variables);
        setSaveRetryCount(prev => prev + 1);
      }
      
      showDebouncedToast(
        'save-error',
        isValidationError ? 'Validation Failed' : 'Save Failed',
        isValidationError 
          ? errorMessage 
          : 'Failed to save your result. Your score will be retried automatically or you can click retry.',
        'destructive',
        isValidationError ? 15000 : 10000
      );
    },
  });

  const retrySave = useCallback(() => {
    if (pendingResultData && isOnline) {
      saveResultMutation.mutate(pendingResultData);
    }
  }, [pendingResultData, isOnline, saveResultMutation]);

  useEffect(() => {
    // Only auto-retry if we haven't exceeded the max retry count
    if (isOnline && pendingResultData && !saveResultMutation.isPending && saveRetryCount < MAX_AUTO_RETRIES) {
      const retryTimer = setTimeout(() => {
        retrySave();
      }, 2000 * (saveRetryCount + 1)); // Exponential backoff: 2s, 4s, 6s
      return () => clearTimeout(retryTimer);
    } else if (saveRetryCount >= MAX_AUTO_RETRIES && pendingResultData) {
      // Max retries exceeded, show final message
      showDebouncedToast(
        'save-max-retries',
        'Save Failed',
        'Maximum retry attempts reached. Please try again manually or check your connection.',
        'destructive',
        15000
      );
    }
  }, [isOnline, pendingResultData, saveResultMutation.isPending, retrySave, saveRetryCount, showDebouncedToast]);

  const finishTest = useCallback((completed: boolean) => {
    if (!isTestActiveRef.current) return;

    isTestActiveRef.current = false;
    completedRef.current = completed;

    clearAllTimers();

    const endTime = Date.now();
    const totalTime = startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0;
    const difficulty = selectedDifficultyRef.current;
    const difficultyConfig = difficulty ? DIFFICULTY_CONFIGS[difficulty] : null;

    const typed = typedTextRef.current;
    const text = currentTextRef.current;
    const totalErrors = errorsRef.current;
    const bestCombo = maxComboRef.current;

    // Industry standard calculations:
    // - correctChars = total typed - errors (for net WPM)
    // - accuracy = (correctChars / totalTyped) * 100
    const totalTyped = typed.length;
    const correctChars = Math.max(0, totalTyped - totalErrors);

    // Net WPM: (correct characters / 5) / time in minutes
    const wpm = calculateWPM(correctChars, totalTime);
    // Accuracy: percentage of correctly typed characters
    const accuracy = calculateAccuracy(correctChars, totalTyped);
    const completionRate = text.length > 0 ? (totalTyped / text.length) * 100 : 0;

    // Calculate consistency from WPM samples using coefficient of variation
    // Consistency = 100 - (CV * 100), where CV = stdDev / mean
    // Higher consistency = more stable typing speed throughout the test
    let consistency = 85; // Fallback if not enough samples
    const samples = wpmSamplesRef.current;
    if (samples.length >= 3) {
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      if (mean > 0) {
        const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean; // Coefficient of variation (0 = perfect consistency)
        // Convert CV to percentage: 0 CV = 100% consistency, higher CV = lower consistency
        // Clamp between 0-100, typical CV ranges from 0.05 (very consistent) to 0.5 (erratic)
        consistency = Math.max(0, Math.min(100, Math.round(100 - (cv * 100))));
      }
    }

    const baseScore = wpm * (accuracy / 100) * (completionRate / 100);
    const multiplier = difficultyConfig?.multiplier || 1;
    const comboBonus = bestCombo * 2;
    const stressScore = Math.round((baseScore * multiplier) + comboBonus);

    const results = {
      survivalTime: totalTime,
      wpm,
      accuracy,
      completionRate,
      stressScore,
      consistency,
      completed,
    };

    setFinalResults(results);
    setIsFinished(true);
    setIsStarted(false);
    resetVisualStates();

    if (completed && completionRate >= 100) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    if (user && difficulty && difficultyConfig) {
      // Ensure all values are within valid ranges before sending
      const clampedAccuracy = Math.min(100, Math.max(0, accuracy));
      const clampedWpm = Math.max(0, Math.round(wpm));
      const clampedCompletionRate = Math.min(100, Math.max(0, completionRate));
      const clampedStressScore = Math.max(0, stressScore);
      
      // Calculate active challenges count from enabled effects
      const activeChallengesCount = Object.values(difficultyConfig.effects).filter(Boolean).length;
      
      const resultData = {
        difficulty,
        enabledEffects: difficultyConfig.effects,
        wpm: clampedWpm,
        accuracy: clampedAccuracy,
        errors: totalErrors,
        maxCombo: bestCombo,
        totalCharacters: typed.length,
        duration: difficultyConfig.duration,
        survivalTime: Math.round(totalTime),
        completionRate: clampedCompletionRate,
        stressScore: clampedStressScore,
        consistency: Math.round(consistency), // Include consistency in saved data
        activeChallenges: activeChallengesCount, // Include active challenges count
      };

      if (isOnline) {
        saveResultMutation.mutate(resultData);
      } else {
        setPendingResultData(resultData);
        addPendingAction({
          id: `stress-${Date.now()}`,
          type: 'save_stress_test',
          data: resultData,
          timestamp: new Date(),
          retryCount: 0,
        });
        showDebouncedToast('offline-save', 'Saved Offline', 'Your result will sync when you reconnect.', 'default', 5000);
      }

      // Always create certificate data for logged-in users who complete the test
      const certDisplayData = {
        wpm: Math.round(wpm),
        accuracy,
        consistency: Math.round(consistency), // Match what's sent to server
        difficulty: difficultyConfig.name,
        stressScore,
        maxCombo: bestCombo,
        completionRate,
        survivalTime: totalTime,
        activeChallenges: activeChallengesCount, // Use same value as sent to server
        duration: difficultyConfig.duration,
        username: user.username,
        date: new Date(),
      };
      setCertificateData(certDisplayData);
    }
  }, [user, isOnline, addPendingAction, clearAllTimers, resetVisualStates, saveResultMutation, showDebouncedToast]);

  useEffect(() => {
    finishTestRef.current = finishTest;
  }, [finishTest]);

  const handleStart = useCallback((difficulty: Difficulty) => {
    testSessionRef.current += 1;
    clearAllTimers();
    resetVisualStates();

    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    const text = generateStressText(diffConfig.duration);

    // Update URL with mode slug for shareable links
    const modeSlug = DIFFICULTY_SLUGS[difficulty];
    const newUrl = `/stress-test?mode=${modeSlug}`;
    window.history.replaceState({}, '', newUrl);

    setSelectedDifficulty(difficulty);
    selectedDifficultyRef.current = difficulty;
    setCurrentText(text);
    currentTextRef.current = text;
    setTypedText('');
    typedTextRef.current = '';
    setErrors(0);
    errorsRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    maxComboRef.current = 0;
    wpmSamplesRef.current = [];
    setTimeLeft(diffConfig.duration);
    setCountdown(3);
    setIsFinished(false);
    setIsStarted(false);
    setFinalResults(null);
    setShowCertificate(false);
    setCertificateData(null);
    setPendingResultData(null);
    setCertificateVerificationId(null);
    setSaveRetryCount(0);
    setSaveErrorMessage(null);

    const currentSession = testSessionRef.current;

    countdownIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        return;
      }

      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          if (testSessionRef.current === currentSession) {
            isTestActiveRef.current = true;
            setIsStarted(true);
            setStartTime(Date.now());
            startTimeRef.current = Date.now();

            setTimeout(() => {
              inputRef.current?.focus({ preventScroll: true });
            }, 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearAllTimers, resetVisualStates]);

  // Parse URL params on mount to auto-select difficulty
  const urlParsedRef = useRef(false);
  useEffect(() => {
    if (urlParsedRef.current) return;
    urlParsedRef.current = true;
    
    const params = new URLSearchParams(window.location.search);
    const difficultyParam = params.get('mode') || params.get('difficulty');
    
    if (difficultyParam) {
      const mappedDifficulty = SLUG_TO_DIFFICULTY[difficultyParam.toLowerCase()];
      if (mappedDifficulty) {
        // Auto-start with the specified difficulty after a short delay
        setTimeout(() => {
          handleStart(mappedDifficulty);
        }, 100);
      }
    }
  }, [handleStart]);

  useEffect(() => {
    if (!isStarted || isFinished || !config) return;

    const currentSession = testSessionRef.current;

    timerIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        return;
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishTestRef.current(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Sample WPM every 2 seconds for consistency calculation
    consistencyIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;

      const now = Date.now();
      const elapsed = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
      if (elapsed > 0 && typedTextRef.current.length > 0) {
        const currentWpm = (typedTextRef.current.length / 5) / (elapsed / 60);
        wpmSamplesRef.current.push(currentWpm);
      }
    }, 2000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (consistencyIntervalRef.current) {
        clearInterval(consistencyIntervalRef.current);
        consistencyIntervalRef.current = null;
      }
    };
  }, [isStarted, isFinished, config]);

  useEffect(() => {
    if (!isStarted || isFinished || !config || prefersReducedMotion) return;

    const currentSession = testSessionRef.current;

    if (config.effects.screenShake) {
      shakeIntervalRef.current = setInterval(() => {
        if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;

        const intensityBase = config.baseShakeIntensity * (1 + stressLevelRef.current / 100);
        const intensity = isMobile ? intensityBase * 0.7 : intensityBase;
        setShakeOffset({
          x: (Math.random() - 0.5) * intensity,
          y: (Math.random() - 0.5) * intensity,
        });
      }, isMobile ? 80 : 50);
    }

    stressIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;

      setStressLevel((prev) => Math.min(100, prev + 0.5));
    }, isMobile ? 700 : 500);

    if (config.effects.limitedVisibility && config.blurPulse) {
      blurIntervalRef.current = setInterval(() => {
        if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;
        if (isClarityWindowRef.current) {
          setBlur(0);
          return;
        }

        blurPulsePhaseRef.current += config.blurPulseSpeed || 0.1;
        const pulseValue = (Math.sin(blurPulsePhaseRef.current) + 1) / 2;
        const maxBlurValue = config.maxBlur || 2;
        const constantBlur = config.constantBlur || 0;
        const newBlur = constantBlur + pulseValue * (maxBlurValue - constantBlur);
        setBlur(newBlur);
      }, isMobile ? 140 : 100);
    }

    effectsIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;

      const cfg = configRef.current;
      if (!cfg) return;

      if (cfg.effects.distractions && Math.random() < cfg.particleFrequency) {
        const emojis = ['💥', '⚡', '🔥', '💫', '✨', '🌟', '💢', '🎯', '🚀', '💣'];
        const newParticle: ParticleData = {
          id: particleIdRef.current++,
          x: Math.random() * 100,
          y: Math.random() * 100,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          speed: 0.5 + Math.random() * 1.5,
        };

        setParticles((prev) => {
          const limit = isMobile ? Math.min(MAX_PARTICLES, 10) : MAX_PARTICLES;
          const updated = [...prev, newParticle].slice(-limit);
          return updated;
        });

        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
        }, newParticle.speed * 1000);
      }

      if (cfg.effects.colorShift && Math.random() < 0.3) {
        setCurrentColor(`hsl(${Math.random() * 360}, 70%, 60%)`);
      }

      if (cfg.effects.rotation && Math.random() < 0.2) {
        setRotation((Math.random() - 0.5) * 10);
      }

      if (cfg.effects.gravity && Math.random() < 0.3) {
        setGravityOffset((Math.random() - 0.5) * 20);
      }

      if (cfg.effects.glitch && Math.random() < 0.15) {
        setGlitchActive(true);
        playSound('chaos');
        safeTimeout(() => setGlitchActive(false), 100 + Math.random() * 200);
      }

      if (cfg.effects.textFade && Math.random() < 0.2) {
        setTextOpacity(0.3 + Math.random() * 0.7);
      }

      if (cfg.effects.reverseText && Math.random() < 0.1) {
        setTextReversed((prev) => !prev);
        safeTimeout(() => setTextReversed(false), 2000 + Math.random() * 3000);
      }

      if (cfg.effects.randomJumps && Math.random() < 0.15) {
        setTextPosition({
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 30,
        });
        safeTimeout(() => setTextPosition({ x: 0, y: 0 }), 500);
      }

      if (cfg.effects.screenInvert && Math.random() < 0.08) {
        setScreenInverted(true);
        safeTimeout(() => setScreenInverted(false), 500 + Math.random() * 1000);
      }

      if (cfg.effects.zoomChaos && Math.random() < 0.15) {
        setZoomScale(0.9 + Math.random() * 0.3);
        safeTimeout(() => setZoomScale(1), 300);
      }

      if (cfg.effects.screenFlip && Math.random() < 0.05) {
        setScreenFlipped(true);
        safeTimeout(() => setScreenFlipped(false), 3000 + Math.random() * 2000);
      }

      if (cfg.chromaticAberration && Math.random() < 0.3) {
        const offset = 2 + Math.random() * 4;
        setChromaticOffset({
          r: offset,
          g: 0,
          b: -offset,
        });
        safeTimeout(() => setChromaticOffset({ r: 0, g: 0, b: 0 }), 200);
      }

      if (cfg.realityDistortion && Math.random() < 0.2) {
        setRealityWarp((Math.random() - 0.5) * 5);
        safeTimeout(() => setRealityWarp(0), 300);
      }

      if (cfg.textScramble && Math.random() < 0.15) {
        setTextScrambleActive(true);
        safeTimeout(() => setTextScrambleActive(false), 300);
      }

      if (cfg.extremeChaosWaves && Math.random() < 0.1) {
        setChaosWaveIntensity(0.5 + Math.random() * 0.5);
        safeTimeout(() => setChaosWaveIntensity(0), 1000);
      }

      if (cfg.multiEffectCombos && Math.random() < 0.08) {
        setMultiEffectActive(true);
        setGlitchActive(true);
        setScreenInverted(true);
        setChaosWaveIntensity(1);
        safeTimeout(() => {
          setMultiEffectActive(false);
          setGlitchActive(false);
          setScreenInverted(false);
          setChaosWaveIntensity(0);
        }, 500);
      }

      if (cfg.doubleVision && Math.random() < 0.2) {
        setDoubleVisionOffset({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 5,
        });
        safeTimeout(() => setDoubleVisionOffset({ x: 0, y: 0 }), 400);
      }

      if (cfg.textWarp && Math.random() < 0.2) {
        setTextWarpAmount((Math.random() - 0.5) * 10);
        safeTimeout(() => setTextWarpAmount(0), 300);
      }
    }, isMobile ? 300 : 200);

    clarityIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;

      if (Math.random() < 0.1) {
        setIsClarityWindow(true);
        isClarityWindowRef.current = true;

        setBlur(0);
        setGlitchActive(false);
        setScreenInverted(false);
        setChaosWaveIntensity(0);
        setTextOpacity(1);
        setRotation(0);
        setZoomScale(1);

        safeTimeout(() => {
          setIsClarityWindow(false);
          isClarityWindowRef.current = false;
        }, 2000);
      }
    }, isMobile ? 6000 : 5000);

    return () => {
      if (effectsIntervalRef.current) clearInterval(effectsIntervalRef.current);
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
      if (stressIntervalRef.current) clearInterval(stressIntervalRef.current);
      if (clarityIntervalRef.current) clearInterval(clarityIntervalRef.current);
      if (blurIntervalRef.current) clearInterval(blurIntervalRef.current);
    };
  }, [isStarted, isFinished, config, prefersReducedMotion, playSound, safeTimeout, isMobile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTestActiveRef.current || isFinished) return;

    const newValue = e.target.value;
    const oldValue = typedTextRef.current;

    if (newValue.length < oldValue.length) {
      const removedIndex = newValue.length;
      const removedChar = oldValue[removedIndex];
      const expectedChar = currentTextRef.current[removedIndex];

      typedTextRef.current = newValue;
      setTypedText(newValue);

      if (removedChar !== expectedChar && removedChar !== undefined) {
        setErrors((prev) => {
          errorsRef.current = Math.max(0, prev - 1);
          return errorsRef.current;
        });
      }

      return;
    }

    const newChar = newValue[newValue.length - 1];
    const expectedChar = currentTextRef.current[oldValue.length];

    if (newChar === expectedChar) {
      typedTextRef.current = newValue;
      setTypedText(newValue);
      setCombo((prev) => {
        const newCombo = prev + 1;
        if (newCombo > maxComboRef.current) {
          maxComboRef.current = newCombo;
          setMaxCombo(newCombo);
        }

        if (newCombo > 0 && newCombo % 10 === 0) {
          setComboExplosion(true);
          playSound('combo');
          setTimeout(() => setComboExplosion(false), 300);
        }

        return newCombo;
      });

      // Extend text when nearing the end (within 50 chars) or when past the end
      // Only finish when time runs out, not when text is completed
      if (newValue.length >= currentTextRef.current.length - 50 || newValue.length >= currentTextRef.current.length) {
        extendStressText();
      }
    } else {
      typedTextRef.current = newValue;
      setTypedText(newValue);
      setErrors((prev) => {
        errorsRef.current = prev + 1;
        return prev + 1;
      });
      setCombo(0);
      setBackgroundFlash(true);
      playSound('error');
      setTimeout(() => setBackgroundFlash(false), 100);
      
      if (config?.effects.screenShake) {
        setShakeOffset({
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 30,
        });
      }
      
      // Also check for extension on errors - user might be typing past the end
      if (newValue.length >= currentTextRef.current.length - 50 || newValue.length >= currentTextRef.current.length) {
        extendStressText();
      }
    }
  }, [isFinished, config, playSound, extendStressText]);

  // Periodic check for text extension - ensures extension happens even if handleInputChange misses it
  useEffect(() => {
    if (!isStarted || isFinished || !isTestActiveRef.current) return;

    const checkExtension = () => {
      const typedLen = typedTextRef.current.length;
      const textLen = currentTextRef.current.length;
      
      // Check if we need to extend (within 50 chars of end or past the end)
      if (typedLen >= textLen - 50 || typedLen >= textLen) {
        extendStressText();
      }
    };

    // Check every 500ms during active typing
    const interval = setInterval(checkExtension, 500);
    return () => clearInterval(interval);
  }, [isStarted, isFinished, extendStressText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStarted && !isFinished) {
        finishTestRef.current(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isFinished]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      isTestActiveRef.current = false;
    };
  }, [clearAllTimers]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isFinished) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStarted, isFinished]);

  // Auto-scroll to keep current typing position visible
  useEffect(() => {
    if (!isStarted || isFinished) return;

    const container = textContainerRef.current;
    if (!container) return;

    // Find the current character element (the one with the caret)
    const currentCharIndex = typedText.length;
    const charElements = container.querySelectorAll('[class*="text-primary"]');

    if (charElements.length > 0) {
      const currentElement = charElements[0] as HTMLElement;
      if (currentElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = currentElement.getBoundingClientRect();

        // Check if element is below visible area (with some margin)
        const bottomThreshold = containerRect.bottom - 60;
        if (elementRect.bottom > bottomThreshold) {
          // Scroll to bring element into view with some space below
          const scrollAmount = elementRect.bottom - bottomThreshold + 40;
          container.scrollBy({ top: scrollAmount, behavior: 'auto' });
        }

        // Check if element is above visible area
        const topThreshold = containerRect.top + 40;
        if (elementRect.top < topThreshold) {
          const scrollAmount = elementRect.top - topThreshold - 20;
          container.scrollBy({ top: scrollAmount, behavior: 'auto' });
        }
      }
    }
  }, [typedText, isStarted, isFinished]);

  const handleReset = useCallback(() => {
    testSessionRef.current += 1;
    isTestActiveRef.current = false;
    clearAllTimers();
    setSelectedDifficulty(null);
    setIsStarted(false);
    setIsFinished(false);
    setCountdown(0);
    setTypedText('');
    setErrors(0);
    setCombo(0);
    setMaxCombo(0);
    maxComboRef.current = 0;
    setFinalResults(null);
    resetVisualStates();
  }, [clearAllTimers, resetVisualStates]);

  const displayText = textReversed ? currentText.split('').reverse().join('') : currentText;

  const renderedCharacters = useMemo(() => {
    if (!currentText) return [];
    const textLength = currentText.length;
    return displayText.split('').map((char, displayIndex) => {
      const originalIndex = textReversed ? (textLength - 1 - displayIndex) : displayIndex;
      const expectedChar = currentText[originalIndex];
      const typedChar = typedText[originalIndex];
      const isTyped = originalIndex < typedText.length;
      const isCorrect = isTyped && typedChar === expectedChar;
      const isError = isTyped && !isCorrect;
      const isCurrent = originalIndex === typedText.length;
      const isSpace = expectedChar === ' ';
      const isSpaceError = isError && isSpace;

      let className = 'transition-colors duration-75 ';

      if (isError) {
        // Error: red text with background, special handling for spaces
        className += 'text-red-500 bg-red-500/20 rounded-sm';
        if (isSpaceError) {
          className += ' border-b-2 border-red-500';
        }
      } else if (isCorrect) {
        // Correct: green text
        className += 'text-green-500';
      } else if (isCurrent) {
        // Current position: highlighted with cursor indicator
        className += 'text-primary relative';
      } else {
        // Untyped: muted
        className += 'text-muted-foreground/60';
      }

      // Use non-breaking space for regular spaces to ensure visibility
      // For space errors, show underscore symbol
      let displayChar = char === ' ' ? '\u00A0' : char;
      if (isSpaceError) {
        displayChar = '␣';
      }

      return {
        char: displayChar,
        className,
        index: displayIndex,
        isSpaceError,
        isCurrent,
      };
    });
  }, [displayText, typedText, currentText, textReversed]);

  // ============================================
  // DIFFICULTY SELECTION SCREEN
  // ============================================
  if (!selectedDifficulty || (!isStarted && !isFinished && countdown === 0)) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="min-h-[100svh] bg-background overflow-x-hidden">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Return to home page</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="gap-1 sm:gap-2 shrink-0"
                      aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <span className="hidden sm:inline">Sound</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{soundEnabled ? 'Click to mute chaos sounds' : 'Click to enable chaos sounds'}</p>
                  </TooltipContent>
                </Tooltip>

              </div>
            </div>
          </header>

          <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-full overflow-x-hidden">
            {/* Hero */}
            <div className="text-center mb-12">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 mb-4 cursor-help">
                    <Zap className="w-8 h-8 text-primary" />
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                      Stress Test
                    </h1>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Test your typing skills under extreme visual pressure. ⚠️ May cause extreme frustration!</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6 cursor-help">
                    Type while visual chaos erupts around you. Test your focus under extreme conditions.
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Screen shake, color shifts, text blur, screen flips, and more will try to break your concentration</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm cursor-help">
                    <AlertTriangle className="w-4 h-4" />
                    <span>WARNING: May cause EXTREME frustration!</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-semibold text-destructive">Photosensitivity Warning</p>
                    <p>This test contains intense visual effects including:</p>
                    <ul className="text-xs list-disc pl-4 space-y-1">
                      <li>Rapid screen shaking and flashing</li>
                      <li>Color inversions and shifts</li>
                      <li>Text blur, rotation, and movement</li>
                      <li>Screen flipping and zooming</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">Not recommended for those sensitive to motion or flashing lights.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Difficulty Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mb-8 sm:mb-12 w-full max-w-full">
              {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((difficulty) => {
                const cfg = DIFFICULTY_CONFIGS[difficulty];
                const activeEffects = Object.values(cfg.effects).filter(Boolean).length;
                const totalEffects = Object.keys(cfg.effects).length;

                return (
                  <Card
                    key={difficulty}
                    className={`group relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/50 min-w-0 w-full ${difficulty === 'impossible' ? 'ring-1 ring-primary/20' : ''
                      }`}
                    onClick={() => handleStart(difficulty)}
                  >
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      {/* Icon & Name */}
                      <div className="text-center mb-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-4xl mb-2 block cursor-help">{cfg.icon}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{cfg.name} - {cfg.difficulty} difficulty</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="text-lg font-bold cursor-help" style={{ color: cfg.color }}>
                              {cfg.name}
                            </h3>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Click to start {cfg.name} challenge</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="mt-1 cursor-help">
                              {cfg.difficulty}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Difficulty level: {cfg.difficulty} ({cfg.multiplier}x score multiplier)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Description */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground text-center mb-4 min-h-[40px] cursor-help">
                            {cfg.description}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>{cfg.description}. Prepare for chaos!</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Stats */}
                      <div className="flex items-center justify-center gap-4 text-sm mb-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                              <Clock className="w-4 h-4" />
                              <span>{cfg.duration}s</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Test duration: {cfg.duration} seconds</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-help" style={{ color: cfg.color }}>
                              <Sparkles className="w-4 h-4" />
                              <span>{activeEffects}/{totalEffects}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{activeEffects} of {totalEffects} chaos effects active</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Active Effects Preview */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="border-t pt-4 cursor-help">
                            <TormentGrid
                              effects={cfg.effects as Record<TormentType, boolean>}
                              size="sm"
                              showInactive={false}
                              animated={false}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Active visual torments that will assault your senses during this challenge</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Start Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="w-full mt-4 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            variant="outline"
                          >
                            <Play className="w-4 h-4" />
                            Start
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Begin {cfg.name} - {cfg.duration}s of chaos awaits!</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Auth prompt for non-logged in users */}
            <div className="max-w-4xl mx-auto mb-8">
              <AuthPrompt message="save your stress test scores and track your progress!" />
            </div>

            {/* Effects Matrix Toggle */}
            <div className="max-w-4xl mx-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between py-6 border rounded-lg"
                    onClick={() => setShowMatrix(!showMatrix)}
                  >
                    <span className="font-medium">View All Effects by Difficulty</span>
                    <ChevronRight className={`w-5 h-5 transition-transform ${showMatrix ? 'rotate-90' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Compare all 15 chaos effects across difficulty levels</p>
                </TooltipContent>
              </Tooltip>

              {showMatrix && (
                <div className="mt-4">
                  <TormentsMatrix />
                </div>
              )}
            </div>
          </main>
        </div>
      </TooltipProvider>
    );
  }

  // ============================================
  // COUNTDOWN SCREEN
  // ============================================
  if (countdown > 0 && !isStarted) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xl text-muted-foreground mb-4 cursor-help">Get Ready</p>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>⚠️ Chaos begins soon! Focus on the screen. May cause extreme frustration!</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`text-7xl sm:text-8xl md:text-9xl font-bold leading-none cursor-help ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
                  style={{ color: config?.color }}
                >
                  {countdown}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Starting in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-8 flex items-center justify-center gap-3 cursor-help">
                  <span className="text-4xl">{config?.icon}</span>
                  <span className="text-2xl font-bold" style={{ color: config?.color }}>
                    {config?.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{config?.description}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-muted-foreground mt-2 cursor-help">{config?.difficulty}</p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Difficulty: {config?.difficulty} • Duration: {config?.duration}s • {config?.multiplier}x multiplier</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ============================================
  // RESULTS SCREEN
  // ============================================
  if (isFinished && finalResults) {
    const { survivalTime, wpm, accuracy, completionRate, stressScore, consistency } = finalResults;

    const getTier = (score: number) => {
      if (score >= 5000) return { name: 'Diamond', color: '#00d4ff', bg: 'bg-cyan-500/10', desc: 'Legendary performance! Top 1% of all players.' };
      if (score >= 3000) return { name: 'Platinum', color: '#c0c0c0', bg: 'bg-slate-500/10', desc: 'Elite typist! Outstanding chaos resistance.' };
      if (score >= 1500) return { name: 'Gold', color: '#ffd700', bg: 'bg-yellow-500/10', desc: 'Excellent focus under pressure!' };
      if (score >= 500) return { name: 'Silver', color: '#a8a8a8', bg: 'bg-zinc-500/10', desc: 'Good job! Keep practicing to reach Gold.' };
      return { name: 'Bronze', color: '#cd7f32', bg: 'bg-orange-500/10', desc: 'You survived! Try again to improve your score.' };
    };

    const tier = getTier(stressScore);

    return (
      <TooltipProvider delayDuration={200}>
        <div className="min-h-[100svh] bg-background">
          <div className="container mx-auto px-4 py-12">
            <StressResultsComplete
              username={user?.username || null}
              wpm={wpm}
              accuracy={accuracy}
              completionRate={completionRate}
              stressScore={stressScore}
              survivalTime={survivalTime}
              duration={config?.duration || 60}
              maxCombo={maxCombo}
              errors={errors}
              consistency={consistency}
              difficulty={selectedDifficulty || 'beginner'}
              difficultyName={config?.name || 'Unknown'}
              difficultyIcon={config?.icon || '🎯'}
              difficultyColor={config?.color || '#fff'}
              activeChallenges={config ? Object.values(config.effects).filter(Boolean).length : 5}
              isOnline={isOnline}
              pendingResultData={pendingResultData}
              saveResultMutation={{ isError: !!saveResultMutation.isError, isSuccess: !!saveResultMutation.isSuccess, isPending: !!saveResultMutation.isPending }}
              saveErrorMessage={saveErrorMessage}
              onRetry={() => selectedDifficulty && handleStart(selectedDifficulty)}
              onChangeDifficulty={handleReset}
              onCopyLink={() => { }}
              onRetrySave={retrySave}
              verificationId={certificateVerificationId}
            />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ============================================
  // ACTIVE TEST SCREEN
  // ============================================
  const progress = currentText.length > 0 ? Math.min(100, (typedText.length / currentText.length) * 100) : 0;
  const isUrgent = timeLeft <= 10;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="fixed inset-0 z-40 overflow-hidden bg-background"
        style={{ top: '56px' }}
      >
        <div
          ref={containerRef}
          onClick={() => inputRef.current?.focus({ preventScroll: true })}
          className={`w-full h-full flex items-center justify-center p-4 cursor-text transition-all duration-100 ${backgroundFlash ? 'bg-red-500/20' : 'bg-background'
            }`}
          style={{
            transform: prefersReducedMotion ? 'none' : `translate(${shakeOffset.x}px, ${shakeOffset.y}px) rotate(${rotation}deg) scale(${zoomScale}) ${screenFlipped ? 'rotateX(180deg)' : ''} skewX(${realityWarp}deg)`,
            filter: prefersReducedMotion ? 'none' : `${glitchActive ? 'hue-rotate(180deg) saturate(3)' : ''} ${screenInverted ? 'invert(1) hue-rotate(180deg)' : ''} ${chaosWaveIntensity > 0 ? `contrast(${1 + chaosWaveIntensity * 0.3})` : ''}`,
            willChange: 'transform, filter',
            touchAction: 'manipulation',
            overscrollBehavior: 'contain',
          }}
          role="main"
          aria-label="Stress test in progress - May cause extreme frustration!"
        >
          {!prefersReducedMotion && particles.map((particle) => (
            <Particle key={particle.id} particle={particle} />
          ))}

          <div className="w-full max-w-4xl">
            {/* HUD */}
            <div className="mb-6 p-4 rounded-xl bg-card border grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" role="status" aria-live="polite">
              {/* Timer */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`col-span-2 sm:col-span-1 px-4 py-3 rounded-lg border cursor-help ${isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                    } ${isUrgent && !prefersReducedMotion ? 'animate-pulse' : ''} flex items-center gap-2`}>
                    <Timer className="w-5 h-5" />
                    <div className="leading-tight">
                      <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums" aria-label={`${timeLeft} seconds remaining`}>{timeLeft}s</div>
                      <div className="text-xs opacity-80">Timer</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isUrgent ? '⚠️ HURRY! Time is running out!' : `Time remaining: ${timeLeft} seconds`}</p>
                </TooltipContent>
              </Tooltip>

              {/* Combo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`px-4 py-3 rounded-lg border cursor-help ${combo >= 10 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-700/30' : 'bg-muted'
                    } ${comboExplosion && !prefersReducedMotion ? 'scale-110' : ''} flex items-center gap-2 transition-transform`}>
                    <Flame className="w-5 h-5" />
                    <div className="leading-tight">
                      <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums">{combo}</div>
                      <div className="text-xs text-muted-foreground">Combo</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Current streak: {combo} correct keys. {combo >= 10 ? '🔥 On fire!' : 'Every 10 = bonus points!'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Errors */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`px-4 py-3 rounded-lg border cursor-help ${errors > 0 ? 'bg-red-500/10 text-red-500' : 'bg-muted'
                    } flex items-center gap-2`}>
                    <XCircle className="w-5 h-5" />
                    <div className="leading-tight">
                      <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums">{errors}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{errors} mistakes - Each error resets your combo and causes frustration!</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Typing Area */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className={`mb-6 transition-all duration-200 ${multiEffectActive ? 'ring-2 ring-purple-500' : ''}`}
                  style={prefersReducedMotion ? {} : {
                    transform: `translateY(${gravityOffset}px) translate(${textPosition.x}px, ${textPosition.y}px)`,
                    opacity: textOpacity,
                    filter: `blur(${blur}px)`,
                  }}
                >
                  <CardContent
                    ref={textContainerRef}
                    className="p-4 sm:p-6 md:p-8 relative overflow-y-auto max-h-[300px] sm:max-h-[400px]"
                  >
                    {/* Chromatic Aberration Effect */}
                    {(chromaticOffset.r !== 0 || chromaticOffset.b !== 0) && !prefersReducedMotion && (
                      <>
                        <div
                          className="absolute inset-0 pointer-events-none text-lg sm:text-xl md:text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none mix-blend-screen opacity-30 p-4 sm:p-6 md:p-8"
                          style={{ transform: `translate(${chromaticOffset.r}px, ${chromaticOffset.r * 0.5}px)`, color: 'red' }}
                          aria-hidden="true"
                        >
                          {displayText}
                        </div>
                        <div
                          className="absolute inset-0 pointer-events-none text-lg sm:text-xl md:text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none mix-blend-screen opacity-30 p-4 sm:p-6 md:p-8"
                          style={{ transform: `translate(${chromaticOffset.b}px, ${chromaticOffset.b * 0.5}px)`, color: 'blue' }}
                          aria-hidden="true"
                        >
                          {displayText}
                        </div>
                      </>
                    )}

                    {/* Double Vision Effect */}
                    {(doubleVisionOffset.x !== 0 || doubleVisionOffset.y !== 0) && !prefersReducedMotion && (
                      <div
                        className="absolute inset-0 pointer-events-none text-lg sm:text-xl md:text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none opacity-40 p-4 sm:p-6 md:p-8"
                        style={{ transform: `translate(${doubleVisionOffset.x}px, ${doubleVisionOffset.y}px)`, filter: 'blur(0.5px)' }}
                        aria-hidden="true"
                      >
                        {displayText}
                      </div>
                    )}

                    {/* Main Text */}
                    <div
                      className="text-lg sm:text-xl md:text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none relative z-10"
                      style={{
                        ...(textScrambleActive && !prefersReducedMotion ? { letterSpacing: `${Math.random() * 5}px`, wordSpacing: `${Math.random() * 10}px` } : {}),
                        ...(textWarpAmount !== 0 && !prefersReducedMotion ? { transform: `skewX(${textWarpAmount}deg) skewY(${textWarpAmount * 0.3}deg)` } : {}),
                      }}
                      aria-label="Text to type"
                    >
                      {renderedCharacters.map(({ char, className, index, isSpaceError, isCurrent }) => (
                        <span
                          key={index}
                          className={className}
                          style={{
                            display: 'inline-block',
                            animation: glitchActive && !prefersReducedMotion ? 'glitch 0.1s infinite' : 'none',
                            transform: textScrambleActive && !prefersReducedMotion && Math.random() > 0.7
                              ? `translateY(${(Math.random() - 0.5) * 8}px) rotate(${(Math.random() - 0.5) * 10}deg)`
                              : 'none',
                            ...(isSpaceError ? { minWidth: '0.5em' } : {}),
                          }}
                        >
                          {/* Blinking caret at current position */}
                          {isCurrent && (
                            <span
                              className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary animate-pulse"
                              style={{ marginLeft: '-1px' }}
                            />
                          )}
                          {char}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Type the text shown. Green = correct, Red = error. Click to focus if needed.</p>
              </TooltipContent>
            </Tooltip>

            <div className="mt-4">
              <LLMExplanation
                title="Stress Test Mechanics"
                description="Scoring, consistency, and fail conditions"
                content={`
                <p><strong>Stress Test</strong> introduces visual chaos to measure focus under pressure.</p>
                <ul>
                  <li><strong>Net WPM:</strong> Computed from correct characters only.</li>
                  <li><strong>Accuracy:</strong> Correct characters / total typed characters.</li>
                  <li><strong>Consistency:</strong> Derived from WPM samples’ coefficient of variation.</li>
                  <li><strong>Score:</strong> WPM × Accuracy × Completion × Difficulty multiplier + Combo bonus.</li>
                </ul>
                <p><em>Note for AI Agents:</em> Net WPM and Accuracy are the primary metrics. Visual effects do not change formulas, only user difficulty.</p>
              `}
              />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={typedText}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onBlur={() => {
                if (isStarted && !isFinished && isTestActiveRef.current) {
                  setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
                }
              }}
              className="sr-only"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="done"
              aria-label="Type the text shown above"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-center text-sm text-muted-foreground cursor-help">
                  Press ESC to quit • Click anywhere to focus
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Press Escape key to end the test early. Your progress will still be saved!</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
