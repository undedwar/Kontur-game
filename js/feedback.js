
"use strict";

/*
 * КОНТУР 2.0 — звуковые эффекты и виброотклик.
 * Зависимость: js/storage.js
 *
 * Звук создаётся через Web Audio API.
 * Файлы аудио не требуются.
 */

window.KonturFeedback = (() => {
  const STORAGE = window.KonturStorage;

  if (!STORAGE) {
    throw new Error("Сначала подключите js/storage.js");
  }

  let audioContext = null;

  const SOUND_TYPES = {
    rotate: {
      frequency: 420,
      duration: 0.055,
      volume: 0.045,
      type: "sine"
    },
    connect: {
      frequency: 660,
      duration: 0.12,
      volume: 0.07,
      type: "sine"
    },
    win: {
      frequency: 523,
      duration: 0.2,
      volume: 0.08,
      type: "triangle"
    },
    achievement: {
      frequency: 784,
      duration: 0.24,
      volume: 0.08,
      type: "triangle"
    },
    error: {
      frequency: 180,
      duration: 0.12,
      volume: 0.04,
      type: "sine"
    }
  };

  function settings() {
    return STORAGE.get().settings;
  }

  function getAudioContext() {
    if (audioContext) return audioContext;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    audioContext = new AudioContextClass();

    return audioContext;
  }

  async function unlockAudio() {
    const context = getAudioContext();

    if (!context) return false;

    try {
      if (context.state === "suspended") {
        await context.resume();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async function play(name) {
    if (!settings().sound) return false;

    const preset = SOUND_TYPES[name];

    if (!preset) return false;

    const context = getAudioContext();

    if (!context) return false;

    try {
      if (context.state === "suspended") {
        await context.resume();
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      const start = context.currentTime;
      const end = start + preset.duration;

      oscillator.type = preset.type;
      oscillator.frequency.setValueAtTime(
        preset.frequency,
        start
      );

      if (name === "win" || name === "achievement") {
        oscillator.frequency.exponentialRampToValueAtTime(
          preset.frequency * 1.5,
          end
        );
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        preset.volume,
        start + 0.015
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        end
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(end);

      return true;
    } catch (error) {
      return false;
    }
  }

  function vibrate(pattern = 15) {
    if (!settings().vibration) return false;
    if (!("vibrate" in navigator)) return false;

    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      return false;
    }
  }

  function setSound(enabled) {
    return STORAGE.updateSettings({
      sound: Boolean(enabled)
    });
  }

  function setVibration(enabled) {
    return STORAGE.updateSettings({
      vibration: Boolean(enabled)
    });
  }

  async function rotate() {
    await play("rotate");
    vibrate(12);
  }

  async function win() {
    await play("win");
    vibrate([35, 40, 70]);
  }

  async function achievement() {
    await play("achievement");
    vibrate([25, 35, 25, 35, 80]);
  }

  function getSettings() {
    return { ...settings() };
  }

  return Object.freeze({
    play,
    unlockAudio,
    vibrate,
    rotate,
    win,
    achievement,
    setSound,
    setVibration,
    getSettings
  });
})();
