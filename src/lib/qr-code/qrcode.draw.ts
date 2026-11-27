import { excavateQRCode, qrCodePath, type qrCodeImage } from './qrcode.engine';

export interface QRCodeDrawing {
  modules: boolean[][];
  margin: number;
  numCells: number;
  image: ReturnType<typeof qrCodeImage>;
  size: number;
  bgColor: string;
  color: string;
}

/** Canvas effect rc-qrcode: DPR bitmap, background, modules, then uploaded icon. */
export function drawQRCode(
  canvas: HTMLCanvasElement,
  settings: QRCodeDrawing,
  image?: HTMLImageElement
) {
  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  const view = canvas.ownerDocument.defaultView!;
  const { modules, margin, numCells, size, bgColor, color } = settings;
  const placement = settings.image;
  const haveImage = placement != null && image != null && image.complete
    && image.naturalHeight !== 0 && image.naturalWidth !== 0;
  let cellsToDraw = modules;

  if (haveImage && placement.excavation)
    cellsToDraw = excavateQRCode(modules, placement.excavation);

  const pixelRatio = view.devicePixelRatio || 1;
  canvas.height = canvas.width = size * pixelRatio;
  const scale = size / numCells * pixelRatio;
  context.scale(scale, scale);
  context.fillStyle = bgColor;
  context.fillRect(0, 0, numCells, numCells);
  context.fillStyle = color;
  let supportsPath = false;

  try {
    new view.Path2D().addPath(new view.Path2D());
    supportsPath = true;
  }
  catch {
    // The original fallback also checks the performance of addPath, and not only the presence of Path2D.
  }

  if (supportsPath) {
    context.fill(new view.Path2D(qrCodePath(cellsToDraw, margin)));
  }
  else {
    // In fallback the standard draws the original modules without excavation; maintain this difference of ways.
    modules.forEach((row, y) => row.forEach((cell, x) => {
      if (cell)
        context.fillRect(x + margin, y + margin, 1, 1);
    }));
  }

  if (placement)
    context.globalAlpha = placement.opacity;

  if (haveImage)
    context.drawImage(image, placement.x + margin, placement.y + margin, placement.w, placement.h);
}
