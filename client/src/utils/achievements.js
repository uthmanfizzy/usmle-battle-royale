// Shared achievement definitions + evaluator (Phase E).
// Extracted from StatsPage.jsx's ACHIEVEMENT_DEFS/buildAchievements so the
// unified profile page (ProgressPage) can evaluate the same achievements
// from its public endpoints (mastery + game-stats) instead of /auth/me's
// embedded shape. StatsPage keeps its own private copy for now — swapping
// it over was not a zero-risk one-liner, so it was deliberately left alone.

export const ACHIEVEMENT_CATS = ['Battle', 'Knowledge', 'Tower', 'Social'];

export const ACHIEVEMENT_DEFS = [
  // Battle
  { id: 'first_blood',   cat: 'Battle',    icon: '🎮', name: 'First Blood',          desc: 'Play your first game',                check: s => s.gamesPlayed >= 1         },
  { id: 'survivor',      cat: 'Battle',    icon: '⚔️', name: 'Survivor',              desc: 'Win your first Battle Royale',        check: s => s.gamesWon >= 1            },
  { id: 'unstoppable',   cat: 'Battle',    icon: '💀', name: 'Unstoppable',           desc: 'Win 10 Battle Royales',               check: s => s.gamesWon >= 10           },
  { id: 'apex_predator', cat: 'Battle',    icon: '👑', name: 'Apex Predator',         desc: 'Win 50 Battle Royales',               check: s => s.gamesWon >= 50           },
  { id: 'speed_demon',   cat: 'Battle',    icon: '⚡', name: 'Speed Demon',           desc: 'Win a Speed Race',                    check: s => s.gamesWon >= 3            },
  { id: 'trivia_master', cat: 'Battle',    icon: '🎯', name: 'Trivia Master',         desc: 'Win a Trivia Pursuit game',           check: s => s.gamesWon >= 5            },
  // Knowledge
  { id: 'quick_learner', cat: 'Knowledge', icon: '🧠', name: 'Quick Learner',         desc: 'Answer 100 questions correctly',      check: s => s.totalCorrect >= 100      },
  { id: 'scholar',       cat: 'Knowledge', icon: '📚', name: 'Scholar',               desc: 'Answer 500 questions correctly',      check: s => s.totalCorrect >= 500      },
  { id: 'encyclopaedia', cat: 'Knowledge', icon: '🎓', name: 'Encyclopaedia',         desc: 'Answer 1000 questions correctly',     check: s => s.totalCorrect >= 1000     },
  { id: 'cardio_cert',   cat: 'Knowledge', icon: '❤️', name: 'Cardiology Certified', desc: 'Reach 80% mastery in Cardiology',     check: s => s.getMastery('cardiology') >= 80    },
  { id: 'pharma_pro',    cat: 'Knowledge', icon: '💊', name: 'Pharma Pro',            desc: 'Reach 80% mastery in Pharmacology',   check: s => s.getMastery('pharmacology') >= 80  },
  { id: 'bug_expert',    cat: 'Knowledge', icon: '🦠', name: 'Bug Expert',            desc: 'Reach 80% mastery in Microbiology',   check: s => s.getMastery('microbiology') >= 80  },
  // Tower
  { id: 'tower_rookie',  cat: 'Tower',     icon: '🏰', name: 'Tower Rookie',          desc: 'Complete floor 10',                   check: s => s.towerFloor >= 10         },
  { id: 'halfway_hero',  cat: 'Tower',     icon: '🗡️', name: 'Halfway Hero',          desc: 'Complete floor 50',                   check: s => s.towerFloor >= 50         },
  { id: 'tower_master',  cat: 'Tower',     icon: '👑', name: 'Tower Master',          desc: 'Complete all 100 floors',             check: s => s.towerFloor >= 100        },
  // Social
  { id: 'team_player',   cat: 'Social',    icon: '👥', name: 'Team Player',           desc: 'Join a clan',                         check: s => !!s.hasClan                },
  { id: 'on_fire',       cat: 'Social',    icon: '🔥', name: 'On Fire',               desc: 'Get a 10-answer streak',              check: s => s.streak >= 10             },
  { id: 'dedicated',     cat: 'Social',    icon: '📅', name: 'Dedicated',             desc: '7 day login streak',                  check: s => s.streak >= 7              },
  { id: 'veteran',       cat: 'Social',    icon: '💎', name: 'Veteran',               desc: '30 day login streak',                 check: s => s.streak >= 30             },
];

// Level milestones (mirrors StatsPage's private MILESTONES list — duplicated
// here so ProgressPage's own-stats section can render the same journey map
// without modifying StatsPage).
export const LEVEL_MILESTONES = [
  { level: 1,   title: 'Medical Rookie 🩺',      reward: '🎮 Access Granted'  },
  { level: 5,   title: 'Resident Scholar 📚',     reward: '⚡ Speed Booster'   },
  { level: 10,  title: 'Clinical Explorer 🔬',    reward: '🛡️ Clan Access'    },
  { level: 20,  title: 'Diagnostic Expert 🧠',    reward: '👑 Elite Frame'     },
  { level: 30,  title: 'Board Crusher ⚔️',        reward: '🔥 Fire Badge'      },
  { level: 40,  title: 'Chief Resident 🏥',       reward: '💎 Diamond Rank'    },
  { level: 50,  title: 'Attending Physician 👨‍⚕️', reward: '🌟 Gold Aura'      },
  { level: 75,  title: 'Medical Legend 🌟',       reward: '⭐ Legend Title'    },
  { level: 100, title: 'Med Royale Master 👑',    reward: '👑 Master Crown'    },
];

/**
 * Evaluate all achievements against a generic stats bundle.
 *
 * @param {object} bundle
 * @param {number}  bundle.gamesPlayed   total games (game-stats total_games, or users.games_played)
 * @param {number}  bundle.gamesWon      wins (game-stats wins, or users.games_won)
 * @param {number}  bundle.totalCorrect  lifetime correct answers (game-stats total_correct_answers,
 *                                       or summed from mastery rows like StatsPage does)
 * @param {Array}   bundle.mastery       subject_mastery rows [{ subject, mastery_percent, ... }]
 * @param {number}  bundle.towerFloor    tower floor (own /auth/me only; pass 0 when unknown)
 * @param {number}  bundle.streak        streak (own current_streak, or study-stats streak_days)
 * @param {boolean} bundle.hasClan       clan membership (clan_id or clan_tag presence)
 * @returns {Array} ACHIEVEMENT_DEFS with an `unlocked` boolean on each
 */
export function evaluateAchievements({
  gamesPlayed = 0,
  gamesWon = 0,
  totalCorrect = 0,
  mastery = [],
  towerFloor = 0,
  streak = 0,
  hasClan = false,
} = {}) {
  const getMastery = id => mastery.find(m => m.subject === id)?.mastery_percent || 0;
  const stats = { gamesPlayed, gamesWon, totalCorrect, towerFloor, streak, hasClan, getMastery };
  return ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: a.check(stats) }));
}
