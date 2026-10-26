
"use strict";

/*
 * КОНТУР 2.0 — визуальные эффекты.
 * Работает с игровым полем, переданным вызывающим кодом.
 */

window.KonturEffects = (() => {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let animationFrame = 0;

  function animateEnergy(board, path) {
    if (!(board instanceof HTMLElement)) return;

    board.querySelectorAll(".energy-pulse").forEach(
      element => element.remove()
    );

    if (!Array.isArray(path) || path.length === 0) return;

    if (reducedMotion.matches) {
      path.forEach(index => {
        board.children[index]?.classList.add("energized");
      });
      return;
    }

    const cells = path
      .map(index => board.children[index])
      .filter(Boolean);

    cells.forEach((cell, index) => {
      cell.classList.remove("energized");
      cell.style.setProperty(
        "--pulse-delay",
        `${index * 75}ms`
      );
      cell.classList.add("energized", "energy-pulse");
    });
  }

  function clearEnergy(board) {
    if (!(board instanceof HTMLElement)) return;

    board.querySelectorAll(".energy-pulse").forEach(
      element => {
        element.classList.remove("energy-pulse");
        element.style.removeProperty("--pulse-delay");
      }
    );
  }

  function hint(board, index) {
    if (!(board instanceof HTMLElement)) return;

    board.querySelectorAll(".hint").forEach(
      element => element.classList.remove("hint")
    );

    const cell = board.children[index];

    if (!cell) return;

    cell.classList.add("hint", "hint-pulse");
  }

  function clearHint(board) {
    if (!(board instanceof HTMLElement)) return;

    board.querySelectorAll(".hint, .hint-pulse").forEach(
      element => {
        element.classList.remove("hint", "hint-pulse");
      }
    );
  }

  function victory(board) {
    if (!(board instanceof HTMLElement)) return;

    if (reducedMotion.matches) {
      board.classList.add("victory");
      return;
    }

    board.classList.remove("victory");
    void board.offsetWidth;
    board.classList.add("victory");

    const rect = board.getBoundingClientRect();
    const count = 24;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");

      particle.className = "victory-particle";
      particle.style.setProperty(
        "--x",
        `${(Math.random() - 0.5) * rect.width}px`
      );
      particle.style.setProperty(
        "--y",
        `${(Math.random() - 0.8) * rect.height}px`
      );
      particle.style.setProperty(
        "--hue",
        `${145 + Math.random() * 90}`
      );
      particle.style.setProperty(
        "--delay",
        `${Math.random() * 250}ms`
      );

      board.appendChild(particle);

      particle.addEventListener(
        "animationend",
        () => particle.remove(),
        { once: true }
      );
    }
  }

  function clearVictory(board) {
    if (!(board instanceof HTMLElement)) return;

    board.classList.remove("victory");

    board.querySelectorAll(".victory-particle").forEach(
      particle => particle.remove()
    );
  }

  function destroy() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }

  return Object.freeze({
    animateEnergy,
    clearEnergy,
    hint,
    clearHint,
    victory,
    clearVictory,
    destroy
  });
})();
