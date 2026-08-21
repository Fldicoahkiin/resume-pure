import type { CanvasKit } from 'canvaskit-wasm';

declare global {
  interface Window {
    CanvasKitInit?: (config?: {
      locateFile?: (file: string) => string;
    }) => Promise<CanvasKit>;
  }
}

let canvasKitPromise: Promise<CanvasKit> | null = null;
let runtimeScriptPromise: Promise<void> | null = null;
const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function loadCanvasKitRuntimeScript() {
  if (runtimeScriptPromise) {
    return runtimeScriptPromise;
  }

  runtimeScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-canvas-kit-runtime="true"]');
    if (existingScript) {
      if (window.CanvasKitInit) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('render-runtime-load-failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `${assetBasePath}/vendor/canvaskit.js`;
    script.async = true;
    script.dataset.canvasKitRuntime = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('render-runtime-load-failed')), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    runtimeScriptPromise = null;
    throw error;
  });

  return runtimeScriptPromise;
}

export async function getCanvasKit() {
  if (!canvasKitPromise) {
    canvasKitPromise = (async () => {
      await loadCanvasKitRuntimeScript();

      if (!window.CanvasKitInit) {
        throw new Error('render-runtime-missing');
      }

      return await window.CanvasKitInit({
        locateFile: (file) => {
          if (file === 'canvaskit.wasm') {
            return `${assetBasePath}/vendor/canvaskit.wasm`;
          }

          return `${assetBasePath}/vendor/${file}`;
        },
      });
    })().catch((error) => {
      canvasKitPromise = null;
      throw error;
    });
  }

  return canvasKitPromise;
}
