/**
 * Competitive Racing (Rating) Mode Generator
 * Generates realistic racing ratings using ELO system
 */

import type { SeedUser } from '../factories/user-factory';
import {
  assignSkillLevel,
  assignActivityLevel,
  generateWPM,
  generateTestCount
} from '../utils/distribution';

const STARTING_RATING = 1000;

// Tier thresholds
const TIERS = {
  bronze: { min: 0, max: 999 },
  silver: { min: 1000, max: 1399 },
  gold: { min: 1400, max: 1799 },
  platinum: { min: 1800, max: 2199 },
  diamond: { min: 2200, max: Infinity }
} as const;

/**
 * Calculate final rating based on skill level
 */
function calculateFinalRating(skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'elite', baseWpm: number): number {
  // Map skill level to rating range
  const ratingRanges = {
    beginner: { min: 800, max: 1100 },
    intermediate: { min: 1100, max: 1400 },
    advanced: { min: 1400, max: 1750 },
    expert: { min: 1750, max: 2100 },
    elite: { min: 2100, max: 2500 }
  };
  
  const range = ratingRanges[skillLevel];
  
  // Add some randomness within the range
  const rating = range.min + Math.random() * (range.max - range.min);
  
  return Math.round(rating);
}

/**
 * Determine tier from rating
 */
function getTier(rating: number): string {
  if (rating >= TIERS.diamond.min) return 'diamond';
  if (rating >= TIERS.platinum.min) return 'platinum';
  if (rating >= TIERS.gold.min) return 'gold';
  if (rating >= TIERS.silver.min) return 'silver';
  return 'bronze';
}

/**
 * Generate rating data for a single user
 */
export function generateUserRating(user: SeedUser): { rating: any; matchHistory: any[] } {
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  const raceCount = Math.floor(generateTestCount(activityLevel) * 1.5); // More races
  
  // Base WPM
  const baseWpm = generateWPM(skillLevel);
  
  // Calculate final rating based on skill
  const rating = calculateFinalRating(skillLevel, baseWpm);
  const tier = getTier(rating);
  
  // Win rate correlates with skill (better players win more)
  const baseWinRate = 0.3 + (rating - 800) / 1700 * 0.4; // 30% to 70%
  const winRate = Math.min(0.80, Math.max(0.20, baseWinRate + (Math.random() - 0.5) * 0.15));
  
  const wins = Math.round(raceCount * winRate);
  const losses = raceCount - wins;
  
  // Generate fake match history entries (3-8 matches per user for WPM data)
  const matchCount = Math.min(raceCount, Math.floor(3 + Math.random() * 6));
  const matchHistory: any[] = [];
  
  for (let i = 0; i < matchCount; i++) {
    // WPM varies around the base WPM
    const wpmVariation = baseWpm + Math.floor((Math.random() - 0.5) * 20);
    const accuracy = 85 + Math.random() * 14; // 85-99%
    
    matchHistory.push({
      raceId: 1, // Will be set later with dummy race
      participantId: 1, // Will be set later
      userId: user.id,
      finishPosition: Math.random() < winRate ? 1 : Math.floor(2 + Math.random() * 3),
      wpm: Math.max(20, Math.min(200, wpmVariation)),
      accuracy: Math.round(accuracy * 10) / 10,
      ratingBefore: Math.round(rating - Math.random() * 50),
      ratingAfter: Math.round(rating),
      ratingChange: Math.round(Math.random() * 30 - 10),
      opponentCount: Math.floor(2 + Math.random() * 3),
      avgOpponentRating: Math.round(rating + (Math.random() - 0.5) * 200),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
    });
  }
  
  return {
    rating: {
      userId: user.id,
      rating: Math.round(rating),
      tier,
      wins,
      losses,
      totalRaces: raceCount,
      winRate: Math.round(winRate * 100),
      peakRating: Math.round(rating * (1 + Math.random() * 0.1)), // Peak is slightly higher
      createdAt: user.createdAt,
      updatedAt: new Date()
    },
    matchHistory
  };
}

/**
 * Generate ratings for multiple users
 */
export function generateRatings(users: SeedUser[]): { ratings: any[]; matchHistory: any[] } {
  const allRatings: any[] = [];
  const allMatchHistory: any[] = [];
  
  console.log(`Generating competitive racing ratings for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const { rating, matchHistory } = generateUserRating(user);
    allRatings.push(rating);
    allMatchHistory.push(...matchHistory);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated ratings for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total ratings generated: ${allRatings.length}`);
  console.log(`Total match history entries: ${allMatchHistory.length}`);
  
  return { ratings: allRatings, matchHistory: allMatchHistory };
}

