
"use strict";

/*
 * КОНТУР 2.0 — ежедневные испытания.
 *
 * Зависимости:
 *   js/level-generator.js
 *   js/storage.js
 *
 * Дата испытания определяется по UTC.
 */

window.KonturDaily = (() => {
  const STORAGE = window.KonturStorage;
  const GENERATOR = window.KonturGenerator;

  if (!STORAGE || !GENERATOR) {
    throw new Error(
      "Сначала подключите level-generator.js и storage.js"
    );
  }

  function dateKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function hashString(value) {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function getToday() {
    return dateKey();
  }

  function getChallenge(date = getToday()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Неверный формат даты испытания");
    }

    const seed = hashString("kontur-daily-v2-" + date);

    return {
      date,
      level: GENERATOR.createLevel(1, { seed })
    };
  }

  function getResult(date = getToday()) {
    const data = STORAGE.get();
    return data.daily[date] || null;
  }

  function isCompleted(date = getToday()) {
    const result = getResult(date);
    return Boolean(result && result.completed);
  }

  function complete(stars, moves, date = getToday()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        ok: false,
        reason: "invalid-date"
      };
    }

    stars = Math.max(0, Math.min(3, Math.floor(stars)));
    moves = Math.max(0, Math.floor(moves));

    if (!Number.isFinite(stars) || !Number.isFinite(moves)) {
      return {
        ok: false,
        reason: "invalid-result"
      };
    }

    const previous = getResult(date);

    // Повторное прохождение не должно повторно
    // увеличивать серию ежедневных побед.
    if (previous && previous.completed) {
      const better =
        stars > previous.stars ||
        (stars === previous.stars && moves < previous.moves);

      if (better) {
        STORAGE.saveDaily(date, {
          completed: true,
          stars,
          moves
        });
      }

      return {
        ok: true,
        alreadyCompleted: true,
        improved: better,
        result: getResult(date)
      };
    }

    const data = STORAGE.get();
    const stats = data.stats;
    const yesterday = new Date(date + "T00:00:00.000Z");

    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const previousDate = dateKey(yesterday);
    const lastDate = stats.lastPlayedDate;

    let streak = stats.dailyStreak || 0;

    if (lastDate === previousDate) {
      streak += 1;
    } else if (lastDate !== date) {
      streak = 1;
    }

    const saved = STORAGE.saveDaily(date, {
      completed: true,
      stars,
      moves
    });

    if (!saved) {
      return {
        ok: false,
        reason: "save-failed"
      };
    }

    STORAGE.update(draft => {
      draft.stats.dailyWins += 1;
      draft.stats.dailyStreak = streak;
      draft.stats.bestDailyStreak = Math.max(
        draft.stats.bestDailyStreak,
        streak
      );
      draft.stats.lastPlayedDate = date;
      draft.stats.totalMoves += moves;

      if (stars === 3) {
        draft.stats.perfectWins += 1;
      }
    });

    return {
      ok: true,
      alreadyCompleted: false,
      improved: true,
      result: getResult(date),
      streak
    };
  }

  return Object.freeze({
    getToday,
    getChallenge,
    getResult,
    isCompleted,
    complete
  });
})();
