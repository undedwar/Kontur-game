
"use strict";

/*
 * КОНТУР 2.0 — система достижений.
 * Зависимость: js/storage.js
 */

window.KonturAchievements = (() => {
  const STORAGE = window.KonturStorage;

  if (!STORAGE) {
    throw new Error(
      "Сначала подключите js/storage.js"
    );
  }

  const DEFINITIONS = [
    {
      id: "first_win",
      title: "Первый контур",
      description: "Пройди первый уровень",
      icon: "⚡",
      check: s => s.wins >= 1
    },
    {
      id: "five_levels",
      title: "Начало пути",
      description: "Пройди 5 разных уровней",
      icon: "🔌",
      check: s => s.completedLevels >= 5
    },
    {
      id: "ten_levels",
      title: "Электрик",
      description: "Пройди 10 разных уровней",
      icon: "🔋",
      check: s => s.completedLevels >= 10
    },
    {
      id: "twenty_five_levels",
      title: "Мастер цепей",
      description: "Пройди 25 разных уровней",
      icon: "🏅",
      check: s => s.completedLevels >= 25
    },
    {
      id: "all_levels",
      title: "Повелитель энергии",
      description: "Пройди все 100 уровней",
      icon: "👑",
      check: s => s.completedLevels >= 100
    },
    {
      id: "first_perfect",
      title: "Идеальное соединение",
      description: "Получи 3 звезды за уровень",
      icon: "🌟",
      check: s => s.perfectLevels >= 1
    },
    {
      id: "ten_perfect",
      title: "Безупречный мастер",
      description: "Получи 3 звезды на 10 разных уровнях",
      icon: "✨",
      check: s => s.perfectLevels >= 10
    },
    {
      id: "hundred_stars",
      title: "Коллекционер",
      description: "Собери 100 звёзд кампании",
      icon: "💎",
      check: s => s.totalStars >= 100
    },
    {
      id: "hundred_wins",
      title: "Неудержимый",
      description: "Победи 100 раз",
      icon: "🏆",
      check: s => s.wins >= 100
    },
    {
      id: "daily_first",
      title: "Каждый день",
      description: "Заверши ежедневное испытание",
      icon: "📅",
      check: s => s.dailyWins >= 1
    },
    {
      id: "streak_three",
      title: "Три дня подряд",
      description: "Заверши испытания 3 дня подряд",
      icon: "🔥",
      check: s => s.bestDailyStreak >= 3
    },
    {
      id: "streak_seven",
      title: "Неделя энергии",
      description: "Заверши испытания 7 дней подряд",
      icon: "⚡",
      check: s => s.bestDailyStreak >= 7
    },
    {
      id: "streak_thirty",
      title: "Энергия без границ",
      description: "Заверши испытания 30 дней подряд",
      icon: "🌈",
      check: s => s.bestDailyStreak >= 30
    }
  ];

  function getProgress() {
    const data = STORAGE.get();
    const records = Object.values(data.records);

    return {
      wins: data.stats.wins || 0,
      dailyWins: data.stats.dailyWins || 0,
      bestDailyStreak: data.stats.bestDailyStreak || 0,

      completedLevels: records.length,

      perfectLevels: records.filter(
        record => record.stars === 3
      ).length,

      totalStars: records.reduce(
        (sum, record) => sum + (record.stars || 0),
        0
      )
    };
  }

  function evaluate() {
    const progress = getProgress();
    const data = STORAGE.get();
    const newlyUnlocked = [];

    for (const achievement of DEFINITIONS) {
      if (data.achievements[achievement.id]) {
        continue;
      }

      if (achievement.check(progress)) {
        const saved = STORAGE.unlockAchievement(
          achievement.id
        );

        if (saved) {
          newlyUnlocked.push({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon
          });
        }
      }
    }

    return newlyUnlocked;
  }

  function getAll() {
    const data = STORAGE.get();
    const progress = getProgress();

    return DEFINITIONS.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      unlocked: Boolean(
        data.achievements[achievement.id]
      ),
      unlockedAt:
        data.achievements[achievement.id]?.unlockedAt || null,
      progress: getAchievementProgress(
        achievement.id,
        progress
      )
    }));
  }

  function getAchievementProgress(id, progress) {
    const values = {
      first_win: [progress.wins, 1],
      five_levels: [progress.completedLevels, 5],
      ten_levels: [progress.completedLevels, 10],
      twenty_five_levels: [progress.completedLevels, 25],
      all_levels: [progress.completedLevels, 100],
      first_perfect: [progress.perfectLevels, 1],
      ten_perfect: [progress.perfectLevels, 10],
      hundred_stars: [progress.totalStars, 100],
      hundred_wins: [progress.wins, 100],
      daily_first: [progress.dailyWins, 1],
      streak_three: [progress.bestDailyStreak, 3],
      streak_seven: [progress.bestDailyStreak, 7],
      streak_thirty: [progress.bestDailyStreak, 30]
    };

    const [current, target] = values[id] || [0, 1];

    return {
      current: Math.min(current, target),
      target,
      percent: Math.min(
        100,
        Math.floor(current / target * 100)
      )
    };
  }

  return Object.freeze({
    evaluate,
    getAll,
    getProgress
  });
})();
