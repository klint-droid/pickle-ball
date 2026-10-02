export interface UserStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  highestRally: number;
}

export type PaddleRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PaddleItem {
  id: string;
  name: string;
  rarity: PaddleRarity;
  color: string;
  glowColor: string;
  description: string;
  perk: string;
  costCoins?: number;
  costGems?: number;
  unlockedByDefault?: boolean;
}

export interface DailyRewardDay {
  day: number;
  coins: number;
  gems: number;
  energy?: number;
  paddleId?: string;
  paddleName?: string;
  description: string;
}

export interface PromoCodeDef {
  code: string;
  name: string;
  coins: number;
  gems: number;
  energy?: number;
  paddleId?: string;
  paddleName?: string;
  description: string;
}

export interface EventPromoDef {
  id: string;
  title: string;
  badge: string;
  coins: number;
  gems: number;
  energy?: number;
  description: string;
  icon: string;
}

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'achievement';
  progress: number;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  rewardGems?: number;
  completed: boolean;
  claimed: boolean;
}

export interface UserProfile {
  id: string;
  isGuest: boolean;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  lastEnergyRechargeTime: number; // timestamp in ms
  trophies: number;
  stats: UserStats;
  equippedPaddle: string;
  unlockedPaddles: string[];
  dailyRewards: {
    lastClaimTimestamp: number | null;
    currentDay: number; // 1 to 7
    claimedDays: number[];
  };
  redeemedPromos: string[];
  claimedEvents: string[];
  quests: QuestItem[];
  createdAt: number;
}
