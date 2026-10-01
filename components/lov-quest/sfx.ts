"use client";

// Chiptune blips with WebAudio square/triangle oscillators. Off by default; the
// AudioContext is only created after a user gesture when sound is enabled.

import type { Sfx } from "./engine";

let ac: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ac) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === "suspended") void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

function tone(freqs: number[], step: number, type: OscillatorType = "square", vol = 0.05) {
  const a = ctx();
  if (!a) return;
  const t0 = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, t0 + i * step));
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.setValueAtTime(vol, t0 + freqs.length * step - 0.01);
  gain.gain.linearRampToValueAtTime(0, t0 + freqs.length * step);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + freqs.length * step + 0.02);
}

export function playSfx(name: Sfx | "menu" | "select") {
  switch (name) {
    case "jump":
      tone([392, 523, 659], 0.035, "square", 0.04);
      break;
    case "gel":
      tone([784, 988, 1319], 0.045, "square", 0.04);
      break;
    case "hit":
      tone([196, 147, 110], 0.06, "triangle", 0.08);
      break;
    case "peak":
      tone([523, 659, 784, 1047, 784, 1047], 0.07, "square", 0.045);
      break;
    case "over":
      tone([392, 330, 262, 196], 0.12, "triangle", 0.08);
      break;
    case "start":
      tone([262, 330, 392, 523], 0.06, "square", 0.04);
      break;
    case "menu":
      tone([660], 0.04, "square", 0.03);
      break;
    case "select":
      tone([523, 784], 0.05, "square", 0.035);
      break;
  }
}
