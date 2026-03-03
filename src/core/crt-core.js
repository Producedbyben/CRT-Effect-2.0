import { DEFAULT_PARAMS } from "./params.js";

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function withDefaultParams(params = {}) {
  return { ...DEFAULT_PARAMS, ...params };
}

export function sampleBilinear(data, width, height, u, v, channel) {
  const x = clamp(u * (width - 1), 0, width - 1);
  const y = clamp(v * (height - 1), 0, height - 1);
  const x0 = Math.floor(x);
  const x1 = Math.min(width - 1, x0 + 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const i00 = (y0 * width + x0) * 4 + channel;
  const i10 = (y0 * width + x1) * 4 + channel;
  const i01 = (y1 * width + x0) * 4 + channel;
  const i11 = (y1 * width + x1) * 4 + channel;

  const a = data[i00] * (1 - tx) + data[i10] * tx;
  const b = data[i01] * (1 - tx) + data[i11] * tx;
  return a * (1 - ty) + b * ty;
}

export function processFramePixels({ srcData, dstData, width, height, params }) {
  const p = withDefaultParams(params);
  const barrel = clamp(p.barrelDistortion, -0.8, 0.8);
  const ca = p.chromaticAberration;
  const scan = p.scanlineStrength;
  const mask = p.phosphorMask;
  const pixelSize = Math.max(1, Number(p.pixelSize) || 1);
  const pixelInfluence = 1 + (pixelSize - 1) * 0.22;
  const pixelStepX = width > 1 ? 1 / (width - 1) : 0;
  const pixelStepY = height > 1 ? 1 / (height - 1) : 0;

  for (let y = 0; y < height; y++) {
    const ny = (y / (height - 1)) * 2 - 1;
    const scanPhase = Math.sin((y + 0.5) * Math.PI);
    const scanlineGain = 1 - scan * (0.35 + 0.65 * (0.5 + 0.5 * scanPhase));

    for (let x = 0; x < width; x++) {
      const nx = (x / (width - 1)) * 2 - 1;
      const r2 = nx * nx + ny * ny;
      const warpCurve = 0.22 + 0.78 * r2;
      const warp = Math.max(0.35, 1 + barrel * warpCurve);
      const srcNx = nx / warp;
      const srcNy = ny / warp;
      const u = srcNx * 0.5 + 0.5;
      const v = srcNy * 0.5 + 0.5;

      const outIndex = (y * width + x) * 4;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        dstData[outIndex] = 0;
        dstData[outIndex + 1] = 0;
        dstData[outIndex + 2] = 0;
        dstData[outIndex + 3] = 255;
        continue;
      }

      const edgeShift = ca * (0.0012 + r2 * 0.0045) * (0.8 + (pixelSize - 1) * 0.22);
      const qx = Math.floor((u * width) / pixelSize) * pixelSize + pixelSize * 0.5;
      const qy = Math.floor((v * height) / pixelSize) * pixelSize + pixelSize * 0.5;
      const qu = clamp(qx / width, 0, 1);
      const qv = clamp(qy / height, 0, 1);

      const ru = qu + edgeShift * (0.7 + Math.abs(nx));
      const gu = qu;
      const bu = qu - edgeShift * (0.7 + Math.abs(nx));

      const red = sampleBilinear(srcData, width, height, ru, qv, 0);
      const green = sampleBilinear(srcData, width, height, gu, qv, 1);
      const blue = sampleBilinear(srcData, width, height, bu, qv, 2);

      const redHoriz =
        sampleBilinear(srcData, width, height, ru - pixelStepX, qv, 0) * 0.5 +
        sampleBilinear(srcData, width, height, ru + pixelStepX, qv, 0) * 0.5;
      const greenHoriz =
        sampleBilinear(srcData, width, height, gu - pixelStepX, qv, 1) * 0.5 +
        sampleBilinear(srcData, width, height, gu + pixelStepX, qv, 1) * 0.5;
      const blueHoriz =
        sampleBilinear(srcData, width, height, bu - pixelStepX, qv, 2) * 0.5 +
        sampleBilinear(srcData, width, height, bu + pixelStepX, qv, 2) * 0.5;

      const redVert =
        sampleBilinear(srcData, width, height, ru, qv - pixelStepY, 0) * 0.5 +
        sampleBilinear(srcData, width, height, ru, qv + pixelStepY, 0) * 0.5;
      const greenVert =
        sampleBilinear(srcData, width, height, gu, qv - pixelStepY, 1) * 0.5 +
        sampleBilinear(srcData, width, height, gu, qv + pixelStepY, 1) * 0.5;
      const blueVert =
        sampleBilinear(srcData, width, height, bu, qv - pixelStepY, 2) * 0.5 +
        sampleBilinear(srcData, width, height, bu, qv + pixelStepY, 2) * 0.5;

      const luminance = Math.max(red, green, blue) / 255;
      const bleed = (0.08 + p.bloom * 0.26 + mask * 0.08) * pixelInfluence * Math.pow(luminance, 0.75);
      const blend = Math.min(0.45, bleed);

      const triad = x % 3;
      const boost = 1 + mask * 0.52;
      const dim = 1 - mask * 0.32;
      const rMask = triad === 0 ? boost : dim;
      const gMask = triad === 1 ? boost : dim;
      const bMask = triad === 2 ? boost : dim;

      const dither = (BAYER_4X4[y & 3][x & 3] / 15 - 0.5) * (1.4 + p.noise * 2.2);

      const redSoft = red * (1 - blend) + (redHoriz * 0.62 + redVert * 0.38) * blend;
      const greenSoft = green * (1 - blend) + (greenHoriz * 0.62 + greenVert * 0.38) * blend;
      const blueSoft = blue * (1 - blend) + (blueHoriz * 0.62 + blueVert * 0.38) * blend;

      dstData[outIndex] = clamp(redSoft * scanlineGain * rMask + dither, 0, 255);
      dstData[outIndex + 1] = clamp(greenSoft * scanlineGain * gMask + dither, 0, 255);
      dstData[outIndex + 2] = clamp(blueSoft * scanlineGain * bMask + dither, 0, 255);
      dstData[outIndex + 3] = 255;
    }
  }
}
