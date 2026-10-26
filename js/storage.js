
"use strict";

/*
 * КОНТУР 2.0 — система сохранений.
 * Совместима со старым форматом contour_v5.
 */

window.KonturStorage = (() => {
  const KEY = "contour_v2";
  const OLD_KEYS = [
    "contour_v5",
    "contour_v4",
    "contour_v3"
  ];

  const TOTAL_LEVELS = 100;

  function defaultData() {
    return {
      version: 2,
      unlocked: 1,
      records: {},
      daily: {},
      achievements: {},
      stats: {
        wins: 0,
        perfectWins: 0,
        totalMoves: 0,
        dailyWins: 0,
        lastPlayedDate: null,
        dailyStreak: 0,
        bestDailyStreak: 0
      },
      settings: {
        sound: true,
        music: false,
        vibration: true,
        theme: "mint"
      }
    };
  }

  function safeInteger(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) return fallback;

    return Math.max(min, Math.min(max, Math.floor(number)));
  }

  function cleanRecords(records) {
    const result = {};

    if (!records || typeof records !== "object") {
      return result;
    }

    for (const [key, value] of Object.entries(records)) {
      const level = Number(key);

      if (
        !Number.isInteger(level) ||
        level < 1 ||
        level > TOTAL_LEVELS ||
        !value ||
        typeof value !== "object"
      ) {
        continue;
      }

      result[String(level)] = {
        stars: safeInteger(value.stars, 0, 3, 0),
        moves: safeInteger(value.moves, 0, 1000000, 0)
      };
    }

    return result;
  }

  function normalize(raw) {
    const data = defaultData();

    if (!raw || typeof raw !== "object") {
      return data;
    }

    data.unlocked = safeInteger(
      raw.unlocked, 1, TOTAL_LEVELS, 1
    );

    data.records = cleanRecords(raw.records);

    if (raw.daily && typeof raw.daily === "object") {
      data.daily = raw.daily;
    }

    if (
      raw.achievements &&
      typeof raw.achievements === "object"
    ) {
      data.achievements = raw.achievements;
    }

    if (raw.stats && typeof raw.stats === "object") {
      for (const key of Object.keys(data.stats)) {
        if (key in raw.stats) {
          data.stats[key] = raw.stats[key];
        }
      }

      data.stats.wins = safeInteger(
        data.stats.wins, 0, 10000000, 0
      );

      data.stats.perfectWins = safeInteger(
        data.stats.perfectWins, 0, 10000000, 0
      );

      data.stats.totalMoves = safeInteger(
        data.stats.totalMoves, 0, 1000000000, 0
      );

      data.stats.dailyWins = safeInteger(
        data.stats.dailyWins, 0, 10000000, 0
      );

      data.stats.dailyStreak = safeInteger(
        data.stats.dailyStreak, 0, 10000000, 0
      );

      data.stats.bestDailyStreak = safeInteger(
        data.stats.bestDailyStreak, 0, 10000000, 0
      );
    }

    if (raw.settings && typeof raw.settings === "object") {
      data.settings.sound = raw.settings.sound !== false;
      data.settings.music = raw.settings.music === true;
      data.settings.vibration =
        raw.settings.vibration !== false;

      if (
        ["mint", "blue", "violet", "amber", "pink"]
          .includes(raw.settings.theme)
      ) {
        data.settings.theme = raw.settings.theme;
      }
    }

    data.version = 2;

    return data;
  }

  function readJSON(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn("Не удалось сохранить прогресс:", error);
      return false;
    }
  }

  function load() {
    const current = readJSON(KEY);

    if (current) {
      return normalize(current);
    }

    // Ищем старые сохранения по очереди.
    for (const oldKey of OLD_KEYS) {
      const old = readJSON(oldKey);

      if (old) {
        const migrated = normalize(old);
        write(migrated);
        return migrated;
      }
    }

    return defaultData();
  }

  let data = load();

  function get() {
    // Возвращаем копию, чтобы внешние изменения
    // не затрагивали внутреннее состояние напрямую.
    return JSON.parse(JSON.stringify(data));
  }

  function update(callback) {
    const draft = get();
    callback(draft);
    data = normalize(draft);
    return write(data);
  }

  function saveLevel(level, stars, moves) {
    level = safeInteger(level, 1, TOTAL_LEVELS, 1);
    stars = safeInteger(stars, 0, 3, 0);
    moves = safeInteger(moves, 0, 1000000, 0);

    return update(draft => {
      const key = String(level);
      const previous = draft.records[key];

      if (
        !previous ||
        stars > previous.stars ||
        (stars === previous.stars && moves < previous.moves)
      ) {
        draft.records[key] = { stars, moves };
      }

      draft.unlocked = Math.max(
        draft.unlocked,
        Math.min(TOTAL_LEVELS, level + 1)
      );

      draft.stats.wins += 1;
      draft.stats.totalMoves += moves;

      if (stars === 3) {
        draft.stats.perfectWins += 1;
      }
    });
  }

  function unlockAchievement(id) {
    if (typeof id !== "string" || !id.trim()) {
      return false;
    }

    if (data.achievements[id]) return true;

    return update(draft => {
      draft.achievements[id] = {
        unlockedAt: new Date().toISOString()
      };
    });
  }

  function saveDaily(date, result) {
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return false;
    }

    return update(draft => {
      draft.daily[date] = {
        completed: result.completed === true,
        stars: safeInteger(result.stars, 0, 3, 0),
        moves: safeInteger(result.moves, 0, 1000000, 0),
        completedAt: result.completed
          ? new Date().toISOString()
          : null
      };
    });
  }

  function updateSettings(settings) {
    return update(draft => {
      draft.settings = {
        ...draft.settings,
        ...settings
      };
    });
  }

  return Object.freeze({
    get,
    update,
    saveLevel,
    unlockAchievement,
    saveDaily,
    updateSettings
  });
})();
