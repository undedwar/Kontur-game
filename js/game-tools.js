
"use strict";

/*
 * КОНТУР 2.0 — инструменты игрового процесса.
 * Отмена хода, подсказки и история изменений.
 */

window.KonturGameTools = (() => {
  const history = [];
  const MAX_HISTORY = 100;

  function recordMove(index, previousMask, nextMask) {
    if (
      !Number.isInteger(index) ||
      !Number.isInteger(previousMask) ||
      !Number.isInteger(nextMask)
    ) {
      return false;
    }

    history.push({
      index,
      previousMask,
      nextMask
    });

    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    return true;
  }

  function undo() {
    return history.pop() || null;
  }

  function clearHistory() {
    history.length = 0;
  }

  function historyLength() {
    return history.length;
  }

  /*
   * Находит проводник, который отличается от решения.
   * solutionMasks — массив правильных масок проводников.
   * currentMasks — массив текущих масок.
   * fixedIndices — индексы источника и цели.
   */
  function getSmartHint(
    currentMasks,
    solutionMasks,
    fixedIndices = []
  ) {
    if (
      !Array.isArray(currentMasks) ||
      !Array.isArray(solutionMasks) ||
      currentMasks.length !== solutionMasks.length
    ) {
      return null;
    }

    const fixed = new Set(fixedIndices);

    const candidates = [];

    for (let i = 0; i < currentMasks.length; i++) {
      if (fixed.has(i)) continue;

      const current = currentMasks[i];
      const solution = solutionMasks[i];

      if (!current || !solution || current === solution) {
        continue;
      }

      candidates.push({
        index: i,
        currentMask: current,
        solutionMask: solution
      });
    }

    if (!candidates.length) return null;

    // Предпочитаем проводники с меньшим числом
    // оставшихся поворотов до решения.
    const rotationDistance = (current, target) => {
      let mask = current;

      for (let turns = 0; turns < 8; turns++) {
        if (mask === target) return turns;
        mask = ((mask << 1) & 255) | ((mask >> 7) & 1);
      }

      return 8;
    };

    candidates.sort((a, b) =>
      rotationDistance(a.currentMask, a.solutionMask) -
      rotationDistance(b.currentMask, b.solutionMask)
    );

    return candidates[0];
  }

  return Object.freeze({
    recordMove,
    undo,
    clearHistory,
    historyLength,
    getSmartHint
  });
})();
