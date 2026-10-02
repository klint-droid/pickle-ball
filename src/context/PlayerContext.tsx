import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, DailyRewardDay } from '../types/user';
import {
  loadProfileFromStorage,
  saveProfileToStorage,
  clearProfileFromStorage,
  createDefaultProfile,
  recalculateEnergy,
  calculateLevelFromXp,
  PADDLES_CATALOG,
  DAILY_REWARDS,
  PROMO_CODES,
  EVENT_PROMOS
} from '../services/playerStore';
import { sound } from '../game/Audio';

export type ActiveModal =
  | 'none'
  | 'daily'
  | 'promos'
  | 'locker'
  | 'quests'
  | 'profile'
  | 'settings'
  | 'guestLogin'
  | 'energyRefill';

export interface MatchRewardSummary {
  won: boolean;
  coinsEarned: number;
  xpEarned: number;
  gemsEarned: number;
  trophiesEarned: number;
  leveledUp: boolean;
  newLevel: number;
}

interface PlayerContextValue {
  profile: UserProfile | null;
  isLoggedIn: boolean;
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
  loginAsGuest: (customName?: string, avatar?: string) => void;
  logout: () => void;
  updateProfile: (username: string, avatar: string) => void;
  claimDailyReward: (day: number) => { success: boolean; message: string; reward?: Partial<DailyRewardDay> };
  isDailyRewardAvailable: boolean;
  redeemPromoCode: (code: string) => { success: boolean; message: string; details?: string };
  claimEventPromo: (promoId: string) => { success: boolean; message: string };
  equipPaddle: (paddleId: string) => void;
  buyPaddle: (paddleId: string) => { success: boolean; message: string };
  claimQuestReward: (questId: string) => { success: boolean; message: string };
  consumeEnergyForMatch: () => boolean;
  refillEnergyWithGems: () => boolean;
  recordMatchEnd: (won: boolean, maxRally: number, scoringMode: string) => MatchRewardSummary;
  hasUnclaimedDailyReward: boolean;
  hasUnclaimedEvents: boolean;
  hasUnclaimedQuests: boolean;
  resetPlayerData: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfileFromStorage());
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  // Background energy recovery ticker every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setProfile((prev) => {
        if (!prev) return prev;
        const updated = recalculateEnergy(prev);
        if (updated.energy !== prev.energy) {
          saveProfileToStorage(updated);
          return updated;
        }
        return prev;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const saveAndSetProfile = useCallback((newProfile: UserProfile) => {
    setProfile(newProfile);
    saveProfileToStorage(newProfile);
  }, []);

  // Guest login
  const loginAsGuest = useCallback((customName?: string, avatar?: string) => {
    const existing = loadProfileFromStorage();
    if (existing) {
      const updated = {
        ...existing,
        username: customName || existing.username,
        avatar: avatar || existing.avatar
      };
      saveAndSetProfile(updated);
    } else {
      const fresh = createDefaultProfile(customName, avatar);
      saveAndSetProfile(fresh);
    }
    sound.playClaimReward();
    setActiveModal('none');
  }, [saveAndSetProfile]);

  // Logout / Switch
  const logout = useCallback(() => {
    sound.playButtonClick();
    setActiveModal('guestLogin');
  }, []);

  // Update profile
  const updateProfile = useCallback((username: string, avatar: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, username: username.trim() || prev.username, avatar };
      saveProfileToStorage(updated);
      sound.playButtonClick();
      return updated;
    });
  }, []);

  // Check if daily reward can be claimed today
  const hasUnclaimedDailyReward = useMemo(() => {
    if (!profile) return false;
    const { lastClaimTimestamp, claimedDays } = profile.dailyRewards;
    if (claimedDays.length >= 7) return false;
    if (!lastClaimTimestamp) return true;

    // Check if at least 18 hours or next calendar date
    const now = new Date();
    const last = new Date(lastClaimTimestamp);
    const isDifferentDay =
      now.getFullYear() !== last.getFullYear() ||
      now.getMonth() !== last.getMonth() ||
      now.getDate() !== last.getDate();

    return isDifferentDay;
  }, [profile]);

  const isDailyRewardAvailable = hasUnclaimedDailyReward;

  // Claim Daily Reward
  const claimDailyReward = useCallback((day: number) => {
    if (!profile) return { success: false, message: 'Please login first' };
    const reward = DAILY_REWARDS.find((r) => r.day === day);
    if (!reward) return { success: false, message: 'Invalid reward day' };

    const { claimedDays } = profile.dailyRewards;
    if (claimedDays.includes(day)) {
      return { success: false, message: 'Already claimed today\'s reward!' };
    }

    if (day !== profile.dailyRewards.currentDay) {
      return { success: false, message: `Please claim Day ${profile.dailyRewards.currentDay} first!` };
    }

    let updatedPaddles = [...profile.unlockedPaddles];
    if (reward.paddleId && !updatedPaddles.includes(reward.paddleId)) {
      updatedPaddles.push(reward.paddleId);
    }

    const nextCurrentDay = Math.min(7, day + 1);
    const nextClaimedDays = [...claimedDays, day];

    const updatedProfile: UserProfile = {
      ...profile,
      coins: profile.coins + reward.coins,
      gems: profile.gems + reward.gems,
      energy: Math.min(profile.maxEnergy, profile.energy + (reward.energy || 0)),
      unlockedPaddles: updatedPaddles,
      dailyRewards: {
        lastClaimTimestamp: Date.now(),
        currentDay: nextCurrentDay,
        claimedDays: nextClaimedDays
      }
    };

    saveAndSetProfile(updatedProfile);
    sound.playClaimReward();
    return {
      success: true,
      message: `Claimed Day ${day} Reward!`,
      reward
    };
  }, [profile, saveAndSetProfile]);

  // Check unclaimed events
  const hasUnclaimedEvents = useMemo(() => {
    if (!profile) return false;
    return EVENT_PROMOS.some((event) => !profile.claimedEvents.includes(event.id));
  }, [profile]);

  // Check unclaimed quests
  const hasUnclaimedQuests = useMemo(() => {
    if (!profile) return false;
    return profile.quests.some((q) => q.completed && !q.claimed);
  }, [profile]);

  // Redeem Promo Code
  const redeemPromoCode = useCallback((rawCode: string) => {
    if (!profile) return { success: false, message: 'Please login first' };
    const clean = rawCode.trim().toUpperCase();
    if (!clean) return { success: false, message: 'Please enter a promo code' };

    if (profile.redeemedPromos.includes(clean)) {
      sound.playErrorSound();
      return { success: false, message: 'Promo code already redeemed!' };
    }

    const promoDef = PROMO_CODES.find((p) => p.code === clean);
    if (!promoDef) {
      sound.playErrorSound();
      return { success: false, message: 'Invalid or expired promo code!' };
    }

    let updatedPaddles = [...profile.unlockedPaddles];
    if (promoDef.paddleId && !updatedPaddles.includes(promoDef.paddleId)) {
      updatedPaddles.push(promoDef.paddleId);
    }

    const updated: UserProfile = {
      ...profile,
      coins: profile.coins + promoDef.coins,
      gems: profile.gems + promoDef.gems,
      energy: Math.min(profile.maxEnergy, profile.energy + (promoDef.energy || 0)),
      unlockedPaddles: updatedPaddles,
      redeemedPromos: [...profile.redeemedPromos, clean]
    };

    saveAndSetProfile(updated);
    sound.playClaimReward();
    return {
      success: true,
      message: `Success! Code "${clean}" redeemed!`,
      details: promoDef.description
    };
  }, [profile, saveAndSetProfile]);

  // Claim Event Promo
  const claimEventPromo = useCallback((promoId: string) => {
    if (!profile) return { success: false, message: 'Please login first' };
    if (profile.claimedEvents.includes(promoId)) {
      return { success: false, message: 'Event reward already claimed!' };
    }

    const event = EVENT_PROMOS.find((e) => e.id === promoId);
    if (!event) return { success: false, message: 'Event not found' };

    const updated: UserProfile = {
      ...profile,
      coins: profile.coins + event.coins,
      gems: profile.gems + event.gems,
      energy: Math.min(profile.maxEnergy, profile.energy + (event.energy || 0)),
      claimedEvents: [...profile.claimedEvents, promoId]
    };

    saveAndSetProfile(updated);
    sound.playClaimReward();
    return { success: true, message: `Claimed ${event.title} reward!` };
  }, [profile, saveAndSetProfile]);

  // Equip Paddle
  const equipPaddle = useCallback((paddleId: string) => {
    if (!profile) return;
    if (!profile.unlockedPaddles.includes(paddleId)) return;

    const updated = { ...profile, equippedPaddle: paddleId };
    saveAndSetProfile(updated);
    sound.playCoinChime();
  }, [profile, saveAndSetProfile]);

  // Buy Paddle
  const buyPaddle = useCallback((paddleId: string) => {
    if (!profile) return { success: false, message: 'Please login first' };
    const item = PADDLES_CATALOG.find((p) => p.id === paddleId);
    if (!item) return { success: false, message: 'Paddle not found' };
    if (profile.unlockedPaddles.includes(paddleId)) {
      return { success: false, message: 'Paddle already unlocked' };
    }

    if (item.costCoins && profile.coins < item.costCoins) {
      sound.playErrorSound();
      return { success: false, message: `Need ${item.costCoins} Coins (You have ${profile.coins})` };
    }

    if (item.costGems && profile.gems < item.costGems) {
      sound.playErrorSound();
      return { success: false, message: `Need ${item.costGems} Gems (You have ${profile.gems})` };
    }

    const updated: UserProfile = {
      ...profile,
      coins: profile.coins - (item.costCoins || 0),
      gems: profile.gems - (item.costGems || 0),
      unlockedPaddles: [...profile.unlockedPaddles, paddleId],
      equippedPaddle: paddleId
    };

    saveAndSetProfile(updated);
    sound.playClaimReward();
    return { success: true, message: `Unlocked ${item.name}!` };
  }, [profile, saveAndSetProfile]);

  // Claim Quest Reward
  const claimQuestReward = useCallback((questId: string) => {
    if (!profile) return { success: false, message: 'Please login first' };
    const quest = profile.quests.find((q) => q.id === questId);
    if (!quest) return { success: false, message: 'Quest not found' };
    if (!quest.completed || quest.claimed) {
      return { success: false, message: 'Quest cannot be claimed' };
    }

    const nextQuests = profile.quests.map((q) =>
      q.id === questId ? { ...q, claimed: true } : q
    );

    const { level, xp, xpToNextLevel, leveledUp } = calculateLevelFromXp(
      profile.xp + quest.rewardXp,
      profile.level
    );

    const updated: UserProfile = {
      ...profile,
      coins: profile.coins + quest.rewardCoins,
      gems: profile.gems + (quest.rewardGems || 0),
      level,
      xp,
      xpToNextLevel,
      quests: nextQuests
    };

    saveAndSetProfile(updated);
    if (leveledUp) {
      sound.playLevelUp();
    } else {
      sound.playCoinChime();
    }
    return { success: true, message: `Claimed ${quest.rewardCoins} Coins!` };
  }, [profile, saveAndSetProfile]);

  // Consume 1 Energy to start match
  const consumeEnergyForMatch = useCallback((): boolean => {
    if (!profile) return false;
    if (profile.energy < 1) {
      setActiveModal('energyRefill');
      sound.playErrorSound();
      return false;
    }

    const updated: UserProfile = {
      ...profile,
      energy: profile.energy - 1,
      lastEnergyRechargeTime: profile.energy === profile.maxEnergy ? Date.now() : profile.lastEnergyRechargeTime
    };

    saveAndSetProfile(updated);
    return true;
  }, [profile, saveAndSetProfile]);

  // Refill Energy with Gems
  const refillEnergyWithGems = useCallback((): boolean => {
    if (!profile) return false;
    const costGems = 20;
    if (profile.gems < costGems) {
      sound.playErrorSound();
      return false;
    }

    const updated: UserProfile = {
      ...profile,
      gems: profile.gems - costGems,
      energy: profile.maxEnergy,
      lastEnergyRechargeTime: Date.now()
    };

    saveAndSetProfile(updated);
    sound.playClaimReward();
    setActiveModal('none');
    return true;
  }, [profile, saveAndSetProfile]);

  // Post match record
  const recordMatchEnd = useCallback((won: boolean, maxRally: number, scoringMode: string): MatchRewardSummary => {
    if (!profile) {
      return {
        won,
        coinsEarned: won ? 200 : 60,
        xpEarned: won ? 100 : 30,
        gemsEarned: won ? 5 : 0,
        trophiesEarned: won ? 25 : 5,
        leveledUp: false,
        newLevel: 1
      };
    }

    const coinsEarned = won ? 250 : 70;
    const xpEarned = won ? 120 : 35;
    const gemsEarned = won ? 5 : 0;
    const trophiesEarned = won ? 30 : 5;

    const { level, xp, xpToNextLevel, leveledUp } = calculateLevelFromXp(
      profile.xp + xpEarned,
      profile.level
    );

    // Update quest progression
    const updatedQuests = profile.quests.map((q) => {
      let progress = q.progress;
      if (q.id === 'quest_play_1' || q.id === 'quest_play_3') {
        progress += 1;
      }
      if (won && q.id === 'quest_win_1') {
        progress += 1;
      }
      if (maxRally >= 5 && q.id === 'quest_rally_5') {
        progress = Math.max(progress, 1);
      }
      if (won && scoringMode === 'side-out' && q.id === 'quest_sideout_win') {
        progress = Math.max(progress, 1);
      }

      const completed = progress >= q.target;
      return { ...q, progress: Math.min(progress, q.target), completed };
    });

    const updatedStats = {
      matchesPlayed: profile.stats.matchesPlayed + 1,
      wins: profile.stats.wins + (won ? 1 : 0),
      losses: profile.stats.losses + (won ? 0 : 1),
      highestRally: Math.max(profile.stats.highestRally, maxRally)
    };

    const updatedProfile: UserProfile = {
      ...profile,
      coins: profile.coins + coinsEarned,
      gems: profile.gems + gemsEarned,
      trophies: profile.trophies + trophiesEarned,
      level,
      xp,
      xpToNextLevel,
      stats: updatedStats,
      quests: updatedQuests
    };

    saveAndSetProfile(updatedProfile);

    if (leveledUp) {
      sound.playLevelUp();
    } else if (won) {
      sound.playVictory();
    }

    return {
      won,
      coinsEarned,
      xpEarned,
      gemsEarned,
      trophiesEarned,
      leveledUp,
      newLevel: level
    };
  }, [profile, saveAndSetProfile]);

  // Reset player data
  const resetPlayerData = useCallback(() => {
    clearProfileFromStorage();
    const fresh = createDefaultProfile();
    saveAndSetProfile(fresh);
    sound.playButtonClick();
  }, [saveAndSetProfile]);

  const value = useMemo(
    () => ({
      profile,
      isLoggedIn: !!profile,
      activeModal,
      setActiveModal,
      loginAsGuest,
      logout,
      updateProfile,
      claimDailyReward,
      isDailyRewardAvailable,
      redeemPromoCode,
      claimEventPromo,
      equipPaddle,
      buyPaddle,
      claimQuestReward,
      consumeEnergyForMatch,
      refillEnergyWithGems,
      recordMatchEnd,
      hasUnclaimedDailyReward,
      hasUnclaimedEvents,
      hasUnclaimedQuests,
      resetPlayerData
    }),
    [
      profile,
      activeModal,
      loginAsGuest,
      logout,
      updateProfile,
      claimDailyReward,
      isDailyRewardAvailable,
      redeemPromoCode,
      claimEventPromo,
      equipPaddle,
      buyPaddle,
      claimQuestReward,
      consumeEnergyForMatch,
      refillEnergyWithGems,
      recordMatchEnd,
      hasUnclaimedDailyReward,
      hasUnclaimedEvents,
      hasUnclaimedQuests,
      resetPlayerData
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return ctx;
};
