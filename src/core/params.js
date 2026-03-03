export const PARAM_SCHEMA = {
  scanlineStrength: { min: 0, max: 1, step: 0.01, default: 0.5 },
  phosphorMask: { min: 0, max: 1, step: 0.01, default: 0.5 },
  barrelDistortion: { min: -0.8, max: 0.8, step: 0.01, default: 0 },
  bloom: { min: 0, max: 1, step: 0.01, default: 0.5 },
  flicker: { min: 0, max: 1, step: 0.01, default: 0.22 },
  chromaticAberration: { min: 0, max: 1, step: 0.01, default: 0.5 },
  noise: { min: 0, max: 1, step: 0.01, default: 0.5 },
  pixelSize: { min: 1, max: 8, step: 1, default: 1 },
};

export const PARAM_IDS = Object.keys(PARAM_SCHEMA);

export const DEFAULT_PARAMS = Object.fromEntries(
  PARAM_IDS.map((id) => [id, PARAM_SCHEMA[id].default]),
);

export const PRESETS = {
  "Consumer TV": {
    scanlineStrength: 0.5,
    phosphorMask: 0.5,
    barrelDistortion: 0,
    bloom: 0.5,
    flicker: 0.22,
    chromaticAberration: 0.5,
    noise: 0.5,
    pixelSize: 1,
  },
  "PVM/BVM": {
    scanlineStrength: 0.25,
    phosphorMask: 0.6,
    barrelDistortion: 0.08,
    bloom: 0.2,
    flicker: 0.12,
    chromaticAberration: 0.08,
    noise: 0.16,
    pixelSize: 1,
  },
  Arcade: {
    scanlineStrength: 0.4,
    phosphorMask: 0.45,
    barrelDistortion: 0.12,
    bloom: 0.55,
    flicker: 0.2,
    chromaticAberration: 0.2,
    noise: 0.3,
    pixelSize: 1,
  },
  "Trinitron RGB Monitor": {
    scanlineStrength: 0.2,
    phosphorMask: 0.72,
    barrelDistortion: 0.04,
    bloom: 0.16,
    flicker: 0.03,
    chromaticAberration: 0.06,
    noise: 0.05,
    pixelSize: 1,
  },
  "VHS Composite": {
    scanlineStrength: 0.48,
    phosphorMask: 0.28,
    barrelDistortion: 0.26,
    bloom: 0.68,
    flicker: 0.16,
    chromaticAberration: 0.54,
    noise: 0.34,
    pixelSize: 2,
  },
  "Portable CRT": {
    scanlineStrength: 0.56,
    phosphorMask: 0.34,
    barrelDistortion: 0.32,
    bloom: 0.34,
    flicker: 0.18,
    chromaticAberration: 0.26,
    noise: 0.24,
    pixelSize: 2,
  },
  "Late-Night Broadcast": {
    scanlineStrength: 0.35,
    phosphorMask: 0.42,
    barrelDistortion: 0.16,
    bloom: 0.5,
    flicker: 0.12,
    chromaticAberration: 0.22,
    noise: 0.2,
    pixelSize: 1,
  },
};
