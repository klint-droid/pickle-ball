import type {
  UserProfile,
  PaddleItem,
  DailyRewardDay,
  PromoCodeDef,
  EventPromoDef,
  QuestItem
} from '../types/user';

const STORAGE_KEY = 'pickleball_profile_v1';
const ENERGY_RECHARGE_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes per energy

export const PADDLES_CATALOG: PaddleItem[] = [
  {
    id: 'classic_blue',
    name: 'Classic Cobalt',
    rarity: 'common',
    color: '#38bdf8',
    glowColor: '#0284c7',
    description: 'Standard tournament approved composite paddle with reliable bounce control.',
    perk: 'Standard Control',
    unlockedByDefault: true
  },
  {
    id: 'lime_pro',
    name: 'Pickle Lime Strike',
    rarity: 'common',
    color: '#a3e635',
    glowColor: '#65a30d',
    description: 'High visibility neon core designed for fast-paced kitchen play.',
    perk: '+5% Sweet Spot Visibility',
    costCoins: 500
  },
  {
    id: 'graphite_stealth',
    name: 'Carbon Stealth',
    rarity: 'rare',
    color: '#94a3b8',
    glowColor: '#475569',
    description: 'Ultra-light graphite face for lightning fast dink reactions.',
    perk: 'Featherlight Swing',
    costCoins: 1000
  },
  {
    id: 'sunset_blaze',
    name: 'Sunset Blaze',
    rarity: 'rare',
    color: '#f97316',
    glowColor: '#ea580c',
    description: 'Heated polymer core delivering explosive power on overhead smashes.',
    perk: 'Extra Smash Juice',
    costCoins: 1800
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Vapor',
    rarity: 'epic',
    color: '#ec4899',
    glowColor: '#be185d',
    description: 'Infused with synthwave pulses and sleek aerodynamic rim styling.',
    perk: 'Aero Dynamics Glow',
    costCoins: 3000
  },
  {
    id: 'toxic_surge',
    name: 'Toxic Surge',
    rarity: 'epic',
    color: '#10b981',
    glowColor: '#059669',
    description: 'Experimental polymer honeycomb that rattles the opposing baseline.',
    perk: 'High Vibration Core',
    costGems: 50
  },
  {
    id: 'golden_sovereign',
    name: 'Golden Sovereign',
    rarity: 'legendary',
    color: '#facc15',
    glowColor: '#ca8a04',
    description: 'Handcrafted gilded frame bestowed upon legendary court champions.',
    perk: 'Champion Aura & Gold Sparkles',
    costGems: 150
  },
  {
    id: 'thunder_strike',
    name: 'Thunder Strike',
    rarity: 'legendary',
    color: '#8b5cf6',
    glowColor: '#6d28d9',
    description: 'Crackling electrical conduits for unmatched spin and intimidation.',
    perk: 'Thunderous Impact Glow',
    costGems: 180
  }
];

export const DAILY_REWARDS: DailyRewardDay[] = [
  {
    day: 1,
    coins: 500,
    gems: 0,
    description: '500 Coins Welcome Drop'
  },
  {
    day: 2,
    coins: 0,
    gems: 30,
    description: '30 Premium Gems'
  },
  {
    day: 3,
    coins: 600,
    gems: 0,
    energy: 5,
    description: '5 Energy + 600 Coins'
  },
  {
    day: 4,
    coins: 1200,
    gems: 0,
    description: '1,200 High Stakes Coins'
  },
  {
    day: 5,
    coins: 0,
    gems: 60,
    description: '60 Premium Gems Cache'
  },
  {
    day: 6,
    coins: 2500,
    gems: 50,
    description: '2,500 Coins + 50 Gems Jackpot'
  },
  {
    day: 7,
    coins: 4000,
    gems: 100,
    paddleId: 'golden_sovereign',
    paddleName: 'Golden Sovereign Paddle',
    description: 'Grand Grandmaster Pack: 4,000 Coins, 100 Gems & Golden Sovereign Paddle!'
  }
];

export const PROMO_CODES: PromoCodeDef[] = [
  {
    code: 'WELCOME2026',
    name: 'Season Kickoff Gift',
    coins: 1000,
    gems: 50,
    energy: 5,
    description: '1,000 Coins, 50 Gems & +5 Energy'
  },
  {
    code: 'PICKLEKING',
    name: 'Court Royalty Bounty',
    coins: 2500,
    gems: 40,
    description: '2,500 Coins & 40 Gems'
  },
  {
    code: 'FREEGEMS',
    name: 'Diamond Stash',
    coins: 0,
    gems: 100,
    description: '100 Shiny Gems'
  },
  {
    code: 'THUNDER',
    name: 'Lightning Special Bundle',
    coins: 800,
    gems: 0,
    paddleId: 'thunder_strike',
    paddleName: 'Thunder Strike Paddle',
    description: '800 Coins + Legendary Thunder Strike Paddle!'
  },
  {
    code: 'GUESTVIP',
    name: 'Guest Appreciation Bundle',
    coins: 600,
    gems: 25,
    description: '600 Coins & 25 Gems'
  }
];

export const EVENT_PROMOS: EventPromoDef[] = [
  {
    id: 'event_grand_open',
    title: 'Grand Opening Festival',
    badge: 'FREE GIFT',
    coins: 800,
    gems: 25,
    description: 'Celebrate the world launch of Pickleball Tournament Pro! Claim your kickoff resources.',
    icon: '🎁'
  },
  {
    id: 'event_weekend_rush',
    title: 'Supercharge Energy Drop',
    badge: 'WEEKEND SURGE',
    coins: 0,
    gems: 0,
    energy: 10,
    description: 'Recharge straight to 10 full Energy so you can dominate back-to-back matches.',
    icon: '⚡'
  },
  {
    id: 'event_community',
    title: 'Community 100k Rally Milestone',
    badge: 'COMMUNITY GOAL',
    coins: 1500,
    gems: 35,
    description: 'The global community crossed 100,000 pickleball rallies! Here is your share of the bounty.',
    icon: '🏆'
  }
];

export const INITIAL_QUESTS: QuestItem[] = [
  {
    id: 'quest_play_1',
    title: 'First Serve',
    description: 'Play 1 complete tournament match on the court.',
    category: 'daily',
    progress: 0,
    target: 1,
    rewardCoins: 250,
    rewardXp: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_win_1',
    title: 'Victory Lap',
    description: 'Win a match against the AI opponent.',
    category: 'daily',
    progress: 0,
    target: 1,
    rewardCoins: 500,
    rewardXp: 100,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_rally_5',
    title: 'Rally Machine',
    description: 'Maintain a continuous rally of 5 or more shots in a point.',
    category: 'daily',
    progress: 0,
    target: 1,
    rewardCoins: 350,
    rewardXp: 75,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_play_3',
    title: 'Court Veteran',
    description: 'Play 3 tournament matches.',
    category: 'achievement',
    progress: 0,
    target: 3,
    rewardCoins: 800,
    rewardXp: 150,
    rewardGems: 20,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_sideout_win',
    title: 'Traditional Master',
    description: 'Win a match under Official Side-Out scoring rules.',
    category: 'achievement',
    progress: 0,
    target: 1,
    rewardCoins: 1000,
    rewardXp: 200,
    rewardGems: 30,
    completed: false,
    claimed: false
  }
];

export const AVATAR_LIST = [
  { id: 'pickle_champ', label: 'Pickle Champ', emoji: '🥒', color: '#84cc16' },
  { id: 'smash_flame', label: 'Flame Striker', emoji: '🔥', color: '#f97316' },
  { id: 'cyber_dink', label: 'Cyber Dynamo', emoji: '⚡', color: '#06b6d4' },
  { id: 'golden_trophy', label: 'Trophy Master', emoji: '🏆', color: '#eab308' },
  { id: 'ninja_volley', label: 'Shadow Dink', emoji: '🥷', color: '#a855f7' },
  { id: 'paddle_pro', label: 'Paddle Prodigy', emoji: '🏓', color: '#3b82f6' },
  { id: 'cosmic_star', label: 'Cosmic Ace', emoji: '💫', color: '#ec4899' },
  { id: 'bullseye', label: 'Precision Pro', emoji: '🎯', color: '#ef4444' }
];

export function generateRandomGuestName(): string {
  const prefixes = ['Pickle', 'Dink', 'Smash', 'Volley', 'Kitchen', 'TopSpin', 'Ace', 'NetMaster', 'Rally', 'CrossCourt'];
  const suffixes = ['Pro', 'King', 'Champ', 'Striker', 'Wizard', 'Ninja', 'Hero', 'Legend', 'Master', 'Star'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${p}${s}#${num}`;
}

export function createDefaultProfile(username?: string, avatar?: string): UserProfile {
  return {
    id: `guest_${Math.random().toString(36).substring(2, 9)}`,
    isGuest: true,
    username: username || generateRandomGuestName(),
    avatar: avatar || 'pickle_champ',
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    coins: 1500, // Generous starter welcome bonus
    gems: 60,
    energy: 10,
    maxEnergy: 10,
    lastEnergyRechargeTime: Date.now(),
    trophies: 120, // Starts in Bronze II
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      highestRally: 0
    },
    equippedPaddle: 'classic_blue',
    unlockedPaddles: ['classic_blue'],
    dailyRewards: {
      lastClaimTimestamp: null,
      currentDay: 1,
      claimedDays: []
    },
    redeemedPromos: [],
    claimedEvents: [],
    quests: [...INITIAL_QUESTS],
    createdAt: Date.now()
  };
}

export function loadProfileFromStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as UserProfile;
    return recalculateEnergy(profile);
  } catch (err) {
    console.error('Failed to load player profile from storage:', err);
    return null;
  }
}

export function saveProfileToStorage(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save player profile to storage:', err);
  }
}

export function clearProfileFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear player profile from storage:', err);
  }
}

export function recalculateEnergy(profile: UserProfile): UserProfile {
  if (profile.energy >= profile.maxEnergy) {
    return {
      ...profile,
      lastEnergyRechargeTime: Date.now()
    };
  }

  const now = Date.now();
  const elapsed = now - profile.lastEnergyRechargeTime;
  const energyGained = Math.floor(elapsed / ENERGY_RECHARGE_INTERVAL_MS);

  if (energyGained > 0) {
    const newEnergy = Math.min(profile.maxEnergy, profile.energy + energyGained);
    const remainderTime = elapsed % ENERGY_RECHARGE_INTERVAL_MS;
    return {
      ...profile,
      energy: newEnergy,
      lastEnergyRechargeTime: now - remainderTime
    };
  }

  return profile;
}

export function calculateLevelFromXp(totalXp: number, currentLevel: number): { level: number; xp: number; xpToNextLevel: number; leveledUp: boolean } {
  let level = currentLevel;
  let xp = totalXp;
  let xpNeeded = level * 200;
  let leveledUp = false;

  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level += 1;
    xpNeeded = level * 200;
    leveledUp = true;
  }

  return { level, xp, xpToNextLevel: xpNeeded, leveledUp };
}

export function getRankTier(trophies: number): { name: string; icon: string; color: string } {
  if (trophies >= 2000) return { name: 'Grandmaster Champion', icon: '👑', color: '#f43f5e' };
  if (trophies >= 1200) return { name: 'Tournament Diamond', icon: '💎', color: '#06b6d4' };
  if (trophies >= 700) return { name: 'Gold Tier I', icon: '🏆', color: '#eab308' };
  if (trophies >= 350) return { name: 'Silver Tier II', icon: '🥈', color: '#94a3b8' };
  return { name: 'Bronze Tier III', icon: '🥉', color: '#d97706' };
}
