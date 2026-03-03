import { createBrowserCanvasAdapter } from "./adapters/browser-canvas.js";
import { processFramePixels, withDefaultParams } from "./core/crt-core.js";

function seededNoise(x, y, frame) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + frame * 19.17) * 43758.5453;
  return v - Math.floor(v);
}

export class CRTRenderer {
  constructor({ frameAdapter = createBrowserCanvasAdapter() } = {}) {
    this.frameAdapter = frameAdapter;
    this.sourceCanvas = this.frameAdapter.createCanvas();
    this.fitCanvas = this.frameAdapter.createCanvas();
    this.workCanvas = this.frameAdapter.createCanvas();
    this.hasImage = false;
  }

  setImage(img, sourceScale = 1) {
    this.frameAdapter.drawImageScaled(this.sourceCanvas, img, sourceScale);
    this.hasImage = true;
  }

  render(outCtx, width, height, seconds, params, frameIndex, fps) {
    outCtx.clearRect(0, 0, width, height);
    outCtx.fillStyle = "black";
    outCtx.fillRect(0, 0, width, height);
    if (!this.hasImage) return;

    this.frameAdapter.fitSource(this.sourceCanvas, this.fitCanvas, width, height);

    this.workCanvas.width = width;
    this.workCanvas.height = height;

    const srcPixels = this.frameAdapter.readPixels(this.fitCanvas, width, height);
    const { ctx: workCtx, imageData: outPixels } = this.frameAdapter.createImageData(this.workCanvas, width, height);

    processFramePixels({
      srcData: srcPixels.data,
      dstData: outPixels.data,
      width,
      height,
      params,
    });

    this.frameAdapter.writePixels(workCtx, outPixels);
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = "high";
    outCtx.drawImage(this.workCanvas, 0, 0);

    const p = withDefaultParams(params);
    const pixelSize = Math.max(1, Number(p.pixelSize) || 1);
    const pixelInfluence = 1 + (pixelSize - 1) * 0.22;

    if (p.bloom > 0) {
      outCtx.save();
      outCtx.globalCompositeOperation = "screen";
      outCtx.globalAlpha = Math.min(0.8, (0.16 + p.bloom * 0.34) * pixelInfluence);
      outCtx.filter = `blur(${(0.8 + p.bloom * 5.6) * (1 + (pixelSize - 1) * 0.12)}px) brightness(${1 + p.bloom * 0.55})`;
      outCtx.drawImage(this.workCanvas, 0, 0);
      outCtx.restore();
    }

    const frameSeconds = frameIndex / fps;
    const flickerWaveA = Math.sin(frameSeconds * Math.PI * 2 * 1.94) * 0.5 + 0.5;
    const flickerWaveB = Math.sin(frameSeconds * Math.PI * 2 * 0.61 + 1.7) * 0.5 + 0.5;
    const flicker = p.flicker * (0.4 + 0.6 * (0.65 * flickerWaveA + 0.35 * flickerWaveB));
    outCtx.fillStyle = `rgba(255,255,255,${(flicker * 0.2).toFixed(3)})`;
    outCtx.fillRect(0, 0, width, height);

    if (p.noise > 0) {
      const count = Math.floor(width * height * 0.008 * p.noise);
      for (let i = 0; i < count; i++) {
        const x = Math.floor(seededNoise(i, seconds, frameIndex) * width);
        const y = Math.floor(seededNoise(i * 2, seconds + 3.1, frameIndex) * height);
        const grain = seededNoise(x + frameIndex * 0.3, y, frameIndex);
        const a = (0.02 + grain * 0.28) * p.noise;
        outCtx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        outCtx.fillRect(x, y, 1, 1);
      }
    }
  }
}
