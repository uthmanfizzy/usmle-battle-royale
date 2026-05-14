/**
 * Game Settings Service
 *
 * Fetches and caches game settings from the backend.
 * Settings are refreshed every 5 minutes.
 */

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches game settings from the backend
 * @returns {Promise<Object>} Game settings object
 */
export async function fetchGameSettings() {
  try {
    const response = await fetch(`${SERVER_URL}/api/game-settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');

    const settings = await response.json();

    // Normalize keys for backwards compatibility
    if (settings.hard_mode_timer !== undefined && settings.hardModeTimer === undefined) {
      settings.hardModeTimer = settings.hard_mode_timer;
    }
    if (settings.hard_mode_explanation_time !== undefined && settings.hardModeExplanationTime === undefined) {
      settings.hardModeExplanationTime = settings.hard_mode_explanation_time;
    }

    cachedSettings = settings;
    lastFetchTime = Date.now();

    return settings;
  } catch (error) {
    console.error('Failed to fetch game settings:', error);
    // Return cached settings if available, otherwise return defaults
    return cachedSettings || getDefaultSettings();
  }
}

/**
 * Gets a game setting value
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if setting not found
 * @returns {*} Setting value
 */
export function getGameSetting(key, defaultValue = null) {
  // Refresh cache if expired
  const cacheExpired = Date.now() - lastFetchTime > CACHE_DURATION;
  if (cacheExpired && cachedSettings) {
    // Refresh in background
    fetchGameSettings().catch(() => {});
  }

  return cachedSettings?.[key] ?? defaultValue;
}

/**
 * Gets all game settings
 * @returns {Promise<Object>} All game settings
 */
export async function getAllSettings() {
  // Return cached if still valid
  const cacheValid = cachedSettings && (Date.now() - lastFetchTime < CACHE_DURATION);
  if (cacheValid) {
    return cachedSettings;
  }

  // Fetch fresh settings
  return await fetchGameSettings();
}

/**
 * Forces a refresh of settings
 * @returns {Promise<Object>} Fresh game settings
 */
export async function refreshSettings() {
  return await fetchGameSettings();
}

/**
 * Default settings (fallback)
 */
function getDefaultSettings() {
  return {
    // Hard Mode settings
    hardModeEnabled: false,
    hardModeTimer: 10,
    hardModeExplanationTime: 5,
    hardModeHideExplanations: false,
    hardModeDescription: 'For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.',
    hardModeLabel: 'Hard Mode',
    // Question settings
    timerDefault: 20,
    timerSpeedRace: 10,
    timerTriviaPursuit: 25,
    timerScanMaster: 25,
    explanationTime: 5,
    speedRaceQuestions: 20,
    battleRoyaleMaxQ: 0,
    minQuestionsPerCategory: 5,
    // Lives & difficulty
    battleRoyaleLives: 3,
    suddenDeathTrigger: 2,
    suddenDeathTimer: 5,
    towerFloorLives: 3,
    bossTolerance: 0,
    // XP & Progression
    xpFirst: 100,
    xpSecond: 70,
    xpThird: 50,
    xpOther: 25,
    xpPerCorrect: 5,
    xpDailyChallenge: 50,
    xpPerLevel: 500,
    streakBonusMultiplier: 2,
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: '',
  };
}

// Initialize settings on module load
fetchGameSettings();
