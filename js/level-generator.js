
"use strict";

/*
 * КОНТУР 2.0
 * Генератор и проверка маршрутов.
 * Размер поля: 5 x 5.
 */

window.KonturGenerator = (() => {
  const SIZE = 5;
  const START = 10;
  const TARGET = 14;

  // Направления: по часовой стрелке, начиная сверху.
  const DIRS = [
    [-1, 0], [-1, 1], [0, 1], [1, 1],
    [1, 0], [1, -1], [0, -1], [-1, -1]
  ];

  const BITS = DIRS.map((_, i) => 1 << i);

  function seededRandom(seed) {
    let state = seed >>> 0;

    return function () {
      state = (state + 0x6D2B79F5) | 0;

      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(array, random) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function neighbor(index, direction) {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;

    const nr = row + DIRS[direction][0];
    const nc = col + DIRS[direction][1];

    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
      return -1;
    }

    return nr * SIZE + nc;
  }

  function directionBetween(a, b) {
    const ar = Math.floor(a / SIZE);
    const ac = a % SIZE;
    const br = Math.floor(b / SIZE);
    const bc = b % SIZE;

    return DIRS.findIndex(([dr, dc]) =>
      br - ar === dr && bc - ac === dc
    );
  }

  function rotateMask(mask) {
    let result = 0;

    for (let d = 0; d < 8; d++) {
      if (mask & BITS[d]) {
        result |= BITS[(d + 1) % 8];
      }
    }

    return result;
  }

  function turnsToMatch(current, target) {
    let mask = current;

    for (let turns = 0; turns < 8; turns++) {
      if (mask === target) return turns;
      mask = rotateMask(mask);
    }

    return Infinity;
  }

  function generateRoute(random) {
    const path = [START];
    const visited = new Set(path);

    function search(current) {
      if (current === TARGET) {
        return path.length >= 8;
      }

      if (path.length >= 20) return false;

      const candidates = shuffle(
        DIRS.map((_, d) => neighbor(current, d))
          .filter(i => i >= 0 && !visited.has(i)),
        random
      );

      for (const next of candidates) {
        if (next === TARGET && path.length < 7) continue;

        visited.add(next);
        path.push(next);

        if (search(next)) return true;

        path.pop();
        visited.delete(next);
      }

      return false;
    }

    if (!search(START)) {
      throw new Error("Не удалось построить маршрут");
    }

    return [...path];
  }

  function createLevel(levelNumber, options = {}) {
    const number = Math.max(1, Math.floor(levelNumber));
    const seed = options.seed ?? number * 7919 + 451;
    const random = seededRandom(seed);

    const route = generateRoute(random);
    const solution = Array(SIZE * SIZE).fill(0);
    const cells = Array(SIZE * SIZE).fill(null);

    // Создаём эталонные соединения маршрута.
    for (let i = 0; i < route.length; i++) {
      const index = route[i];
      let mask = 0;

      if (i > 0) {
        mask |= BITS[directionBetween(index, route[i - 1])];
      }

      if (i < route.length - 1) {
        mask |= BITS[directionBetween(index, route[i + 1])];
      }

      solution[index] = mask;
    }

    let scrambleMoves = 0;

    // Поворачиваем проводники, сохраняя решение.
    for (const index of route) {
      const fixed = index === START || index === TARGET;
      const correctMask = solution[index];

      let mask = correctMask;

      if (!fixed) {
        const turns = 1 + Math.floor(random() * 7);

        for (let i = 0; i < turns; i++) {
          mask = rotateMask(mask);
        }

        // Не оставляем проводник в исходном положении.
        if (mask === correctMask) {
          mask = rotateMask(mask);
        }

        scrambleMoves += turnsToMatch(mask, correctMask);
      }

      cells[index] = {
        kind: index === START
          ? "source"
          : index === TARGET
            ? "target"
            : "wire",
        mask,
        solutionMask: correctMask,
        fixed
      };
    }

    // Препятствия не могут перекрыть правильный маршрут.
    const available = shuffle(
      Array.from({ length: SIZE * SIZE }, (_, i) => i)
        .filter(i => !route.includes(i)),
      random
    );

    const obstacleCount = Math.min(
      3 + Math.floor(number / 15),
      7
    );

    for (let i = 0; i < obstacleCount; i++) {
      cells[available[i]] = {
        kind: "block",
        fixed: true
      };
    }

    const level = {
      number,
      seed,
      size: SIZE,
      start: START,
      target: TARGET,
      route,
      solution,
      cells,
      scrambleMoves
    };

    if (!verifySolution(level)) {
      throw new Error("Проверка решения уровня не пройдена");
    }

    return level;
  }

  function verifySolution(level) {
    if (!level || !Array.isArray(level.route)) return false;

    const { route, solution } = level;

    if (
      route.length < 2 ||
      route[0] !== level.start ||
      route[route.length - 1] !== level.target
    ) {
      return false;
    }

    const visited = new Set();

    for (let i = 0; i < route.length; i++) {
      const index = route[i];

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= SIZE * SIZE ||
        visited.has(index)
      ) {
        return false;
      }

      visited.add(index);

      if (!solution[index]) return false;

      if (i > 0) {
        const d = directionBetween(index, route[i - 1]);

        if (d < 0 || !(solution[index] & BITS[d])) {
          return false;
        }
      }

      if (i < route.length - 1) {
        const d = directionBetween(index, route[i + 1]);

        if (d < 0 || !(solution[index] & BITS[d])) {
          return false;
        }
      }
    }

    return true;
  }

  function getHint(level, currentMasks) {
    for (const index of level.route) {
      const cell = level.cells[index];

      if (!cell || cell.fixed || cell.kind !== "wire") continue;

      const currentMask = currentMasks[index];

      if (currentMask !== cell.solutionMask) {
        return {
          index,
          turns: turnsToMatch(currentMask, cell.solutionMask)
        };
      }
    }

    return null;
  }

  return Object.freeze({
    createLevel,
    verifySolution,
    rotateMask,
    turnsToMatch,
    getHint
  });
})();
