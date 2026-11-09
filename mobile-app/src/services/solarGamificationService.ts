import { SafeStorage } from '../api/client';
import { haptics } from '../utils/haptics';

export type GamificationAction =
  | 'LEAD_CAPTURED'
  | 'PROPOSAL_SENT'
  | 'CLIENT_ONBOARDED'
  | 'MODULES_SCANNED'
  | 'QA_CERTIFIED'
  | 'STAGE_ADVANCED'
  | 'PROJECT_COMPLETED';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface UserCareerStats {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  prevLevelXp: number;
  progressPct: number;
  streakDays: number;
  lastActionDate?: string;
  projectsCompleted: number;
  totalKwEnergized: number;
  co2SavedTons: number;
  treesPlanted: number;
  badges: AchievementBadge[];
  recentEvents: Array<{
    id: string;
    action: GamificationAction;
    title: string;
    xpGained: number;
    timestamp: string;
  }>;
}

const STORAGE_KEY = '@solar_career_gamification_v1';

const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Solar Scout', minXp: 0, maxXp: 250 },
  { level: 2, title: 'Rooftop Pioneer', minXp: 250, maxXp: 750 },
  { level: 3, title: 'Clean Energy Master', minXp: 750, maxXp: 1800 },
  { level: 4, title: 'Solar Titan', minXp: 1800, maxXp: 5000 },
  { level: 5, title: 'Gigawatt Legend', minXp: 5000, maxXp: 15000 },
];

const ACTION_REWARDS: Record<GamificationAction, { xp: number; title: string }> = {
  LEAD_CAPTURED: { xp: 25, title: 'Prospect Captured' },
  PROPOSAL_SENT: { xp: 75, title: 'Smart Proposal Delivered' },
  CLIENT_ONBOARDED: { xp: 150, title: 'Deal Won & Project Provisioned' },
  MODULES_SCANNED: { xp: 50, title: 'DCR Hardware Barcodes Scanned' },
  QA_CERTIFIED: { xp: 100, title: 'Statutory Electrical QA Passed' },
  STAGE_ADVANCED: { xp: 50, title: 'Milestone Stage Advanced' },
  PROJECT_COMPLETED: { xp: 300, title: 'Grid Sync & Project Handover Complete' },
};

const INITIAL_BADGES: AchievementBadge[] = [
  { id: 'FIRST_SPARK', title: 'First Spark', description: 'Captured your first solar lead inquiry', icon: 'zap' },
  { id: 'SPEED_QUOTER', title: 'Speed Quoter', description: 'Dispatched custom proposal to client in seconds', icon: 'send' },
  { id: 'DEAL_CLOSER', title: 'Deal Closer', description: 'Onboarded customer and provisioned active project', icon: 'award' },
  { id: 'ZERO_DEFECT_QA', title: 'Zero Defect Hero', description: 'Certified CEA earthing & anti-islanding test', icon: 'shield-check' },
  { id: 'GRID_MASTER', title: 'Grid Master', description: 'Achieved 100% net-meter sync and client handover', icon: 'sun' },
  { id: 'CENTURY_KW', title: 'Century kWp', description: 'Energized cumulative 25+ kWp clean rooftop capacity', icon: 'leaf' },
];

class SolarGamificationService {
  private stats: UserCareerStats = {
    xp: 120, // Initial kickstart boost for the user
    level: 1,
    levelTitle: 'Solar Scout',
    nextLevelXp: 250,
    prevLevelXp: 0,
    progressPct: 48,
    streakDays: 1,
    projectsCompleted: 0,
    totalKwEnergized: 0,
    co2SavedTons: 0,
    treesPlanted: 0,
    badges: INITIAL_BADGES,
    recentEvents: [],
  };

  private listeners: Array<(stats: UserCareerStats) => void> = [];
  private isLoaded = false;

  constructor() {
    this.loadStats();
  }

  private async loadStats(): Promise<void> {
    try {
      const raw = await SafeStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.stats = {
          ...this.stats,
          ...parsed,
          badges: INITIAL_BADGES.map((b) => {
            const saved = (parsed.badges || []).find((sb: any) => sb.id === b.id);
            return saved ? { ...b, unlockedAt: saved.unlockedAt } : b;
          }),
        };
        this.recalculateLevel();
      } else {
        this.recalculateLevel();
        this.saveStats();
      }
    } catch (e) {
      this.recalculateLevel();
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await SafeStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (_) {}
  }

  private recalculateLevel(): void {
    const xp = this.stats.xp;
    let currentTier = LEVEL_THRESHOLDS[0];
    for (const tier of LEVEL_THRESHOLDS) {
      if (xp >= tier.minXp) {
        currentTier = tier;
      }
    }

    const range = currentTier.maxXp - currentTier.minXp;
    const offset = Math.max(0, xp - currentTier.minXp);
    const progress = Math.min(100, Math.round((offset / range) * 100));

    this.stats.level = currentTier.level;
    this.stats.levelTitle = currentTier.title;
    this.stats.prevLevelXp = currentTier.minXp;
    this.stats.nextLevelXp = currentTier.maxXp;
    this.stats.progressPct = progress;
  }

  private updateStreak(): void {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = this.stats.lastActionDate;

    if (!lastDate) {
      this.stats.streakDays = 1;
      this.stats.lastActionDate = today;
      return;
    }

    if (lastDate === today) return; // Already logged today

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastDate === yesterday) {
      this.stats.streakDays += 1;
    } else {
      this.stats.streakDays = 1;
    }
    this.stats.lastActionDate = today;
  }

  public getStats(): UserCareerStats {
    return { ...this.stats };
  }

  public subscribe(fn: (stats: UserCareerStats) => void): () => void {
    this.listeners.push(fn);
    fn({ ...this.stats });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    const snapshot = { ...this.stats };
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (_) {}
    });
  }

  /**
   * Primary action invocation when user completes a step in the solar project lifecycle
   */
  public async recordAction(
    action: GamificationAction,
    metadata?: {
      capacityKw?: number;
      customerName?: string;
      projectName?: string;
    }
  ): Promise<{
    xpGained: number;
    newTotalXp: number;
    newLevelUnlocked: boolean;
    levelTitle: string;
    unlockedBadge?: AchievementBadge;
  }> {
    const prevLevel = this.stats.level;
    const reward = ACTION_REWARDS[action] || { xp: 30, title: 'Solar Milestone' };

    this.stats.xp += reward.xp;
    this.updateStreak();

    // Additional capacity calculations
    if (metadata?.capacityKw && metadata.capacityKw > 0) {
      if (action === 'PROJECT_COMPLETED' || action === 'CLIENT_ONBOARDED') {
        this.stats.totalKwEnergized = Number((this.stats.totalKwEnergized + metadata.capacityKw).toFixed(1));
        // 1 kWp saves ~1.2 tons CO2/year and equals ~18 trees
        this.stats.co2SavedTons = Number((this.stats.totalKwEnergized * 1.25).toFixed(1));
        this.stats.treesPlanted = Math.round(this.stats.totalKwEnergized * 18);
      }
    }

    if (action === 'PROJECT_COMPLETED') {
      this.stats.projectsCompleted += 1;
    }

    this.recalculateLevel();
    const newLevelUnlocked = this.stats.level > prevLevel;

    // Check Badge Unlocks
    let unlockedBadge: AchievementBadge | undefined;
    const nowIso = new Date().toISOString();

    const unlockBadge = (id: string) => {
      const b = this.stats.badges.find((item) => item.id === id);
      if (b && !b.unlockedAt) {
        b.unlockedAt = nowIso;
        unlockedBadge = b;
      }
    };

    if (action === 'LEAD_CAPTURED') unlockBadge('FIRST_SPARK');
    if (action === 'PROPOSAL_SENT') unlockBadge('SPEED_QUOTER');
    if (action === 'CLIENT_ONBOARDED') unlockBadge('DEAL_CLOSER');
    if (action === 'QA_CERTIFIED') unlockBadge('ZERO_DEFECT_QA');
    if (action === 'PROJECT_COMPLETED') unlockBadge('GRID_MASTER');
    if (this.stats.totalKwEnergized >= 25) unlockBadge('CENTURY_KW');

    // Record Event
    this.stats.recentEvents.unshift({
      id: `evt_${Date.now()}`,
      action,
      title: reward.title,
      xpGained: reward.xp,
      timestamp: nowIso,
    });
    if (this.stats.recentEvents.length > 20) {
      this.stats.recentEvents = this.stats.recentEvents.slice(0, 20);
    }

    await this.saveStats();
    this.notify();

    haptics.notificationSuccess();

    return {
      xpGained: reward.xp,
      newTotalXp: this.stats.xp,
      newLevelUnlocked,
      levelTitle: this.stats.levelTitle,
      unlockedBadge,
    };
  }
}

export const solarGamificationService = new SolarGamificationService();

