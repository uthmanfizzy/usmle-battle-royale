import { createContext, useContext, useEffect, useState } from 'react';

const GameSettingsContext = createContext({});

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export function GameSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    // Defaults while loading
    hardModeEnabled: false,
    hardModeTimer: 30,  // HARDCODED: 30 seconds for hard mode
    hardModeExplanationTime: 20,  // HARDCODED: 20 seconds explanation time
    hardModeHideExplanations: false,
    hardModeLabel: 'Hard Mode',
    hardModeDescription: 'For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.',
    timerDefault: 20,
    timerSpeedRace: 10,
    timerTriviaPursuit: 25,
    timerScanMaster: 25,
    explanationTime: 5,
    speedRaceQuestions: 20,
    battleRoyaleLives: 3,
    suddenDeathTrigger: 2,
    suddenDeathTimer: 5,
    xpFirst: 100,
    xpSecond: 70,
    xpThird: 50,
    xpOther: 25,
    xpPerCorrect: 5,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[GameSettings] Fetching settings from server...');
    fetch(`${SERVER_URL}/api/game-settings`)
      .then(r => r.json())
      .then(data => {
        console.log('[GameSettings] Settings loaded:', data);

        // Normalize keys for backwards compatibility
        const normalized = { ...data };
        if (data.hard_mode_timer !== undefined && data.hardModeTimer === undefined) {
          normalized.hardModeTimer = data.hard_mode_timer;
        }
        if (data.hard_mode_explanation_time !== undefined && data.hardModeExplanationTime === undefined) {
          normalized.hardModeExplanationTime = data.hard_mode_explanation_time;
        }

        console.log('[GameSettings] Normalized hard mode settings:', {
          hardModeTimer: normalized.hardModeTimer,
          hardModeExplanationTime: normalized.hardModeExplanationTime
        });

        setSettings(prevSettings => ({ ...prevSettings, ...normalized }));
        setLoading(false);
      })
      .catch(e => {
        console.error('[GameSettings] Failed to load settings:', e);
        setLoading(false);
      });
  }, []);

  return (
    <GameSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export const useGameSettings = () => useContext(GameSettingsContext);
