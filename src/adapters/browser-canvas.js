export function createBrowserCanvasAdapter() {
  return {
    createCanvas() {
      return document.createElement("canvas");
    },

    drawImageScaled(canvas, image, sourceScale = 1) {
      const inputWidth = image.naturalWidth || image.videoWidth || image.width;
      const inputHeight = image.naturalHeight || image.videoHeight || image.height;
      const scale = Math.max(0.1, Math.min(1, sourceScale || 1));
      canvas.width = Math.max(1, Math.round(inputWidth * scale));
      canvas.height = Math.max(1, Math.round(inputHeight * scale));
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, inputWidth, inputHeight, 0, 0, canvas.width, canvas.height);
    },

    fitSource(sourceCanvas, targetCanvas, width, height) {
      targetCanvas.width = width;
      targetCanvas.height = height;
      const fitCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
      fitCtx.clearRect(0, 0, width, height);
      fitCtx.imageSmoothingEnabled = true;
      fitCtx.imageSmoothingQuality = "high";

      const srcAspect = sourceCanvas.width / sourceCanvas.height;
      const dstAspect = width / height;
      let sw = sourceCanvas.width;
      let sh = sourceCanvas.height;
      let sx = 0;
      let sy = 0;

      if (srcAspect > dstAspect) {
        sw = sourceCanvas.height * dstAspect;
        sx = (sourceCanvas.width - sw) / 2;
      } else {
        sh = sourceCanvas.width / dstAspect;
        sy = (sourceCanvas.height - sh) / 2;
      }

      fitCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, width, height);
      return fitCtx;
    },

    readPixels(canvas, width, height) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      return ctx.getImageData(0, 0, width, height);
    },

    createImageData(canvas, width, height) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      return { ctx, imageData: ctx.createImageData(width, height) };
    },

    writePixels(ctx, imageData) {
      ctx.putImageData(imageData, 0, 0);
    },
  };
}
