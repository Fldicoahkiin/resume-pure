import type { RenderRect } from './types';

interface ImageSize {
  width: number;
  height: number;
}

export function fitRenderImage(
  box: RenderRect,
  source: ImageSize,
  fit?: 'cover' | 'contain',
): RenderRect {
  if (!fit || source.width <= 0 || source.height <= 0) {
    return box;
  }

  const scale = fit === 'cover'
    ? Math.max(box.width / source.width, box.height / source.height)
    : Math.min(box.width / source.width, box.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;

  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  };
}
