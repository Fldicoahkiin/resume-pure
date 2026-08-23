import type { RenderPath } from './types';

const DEFAULT_ICON_VIEW_BOX_SIZE = 24;

export interface SvgPathPlacement {
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
}

export function fitSvgPathViewBox(
  operation: Pick<RenderPath, 'x' | 'y' | 'width' | 'height' | 'viewBox'>,
): SvgPathPlacement {
  if (!operation.viewBox) {
    return {
      originX: operation.x,
      originY: operation.y,
      scaleX: operation.width / DEFAULT_ICON_VIEW_BOX_SIZE,
      scaleY: operation.height / DEFAULT_ICON_VIEW_BOX_SIZE,
    };
  }

  const { viewBox } = operation;
  const scale = Math.min(
    operation.width / viewBox.width,
    operation.height / viewBox.height,
  );
  const renderedWidth = viewBox.width * scale;
  const renderedHeight = viewBox.height * scale;

  return {
    originX: operation.x + (operation.width - renderedWidth) / 2 - viewBox.x * scale,
    originY: operation.y + (operation.height - renderedHeight) / 2 - viewBox.y * scale,
    scaleX: scale,
    scaleY: scale,
  };
}
