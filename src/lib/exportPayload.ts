import type { PDFTranslations, ResumeData } from '@/types';

const EXPORT_PAYLOAD_PREFIX = 'resume-export-payload:';
const EXPORT_PAYLOAD_TTL_MS = 10 * 60 * 1000;

export type ExportStatus = 'success' | 'error';
export type ResumeExportTarget = Window | HTMLIFrameElement;

export interface ResumeExportResult {
  exportId: string;
  status: ExportStatus;
  message?: string;
}

export interface ResumeExportPayload {
  id: string;
  resume: ResumeData;
  translations: PDFTranslations;
  filename: string;
  createdAt: number;
}

function getStorageKey(id: string) {
  return `${EXPORT_PAYLOAD_PREFIX}${id}`;
}

function cleanupExpiredExportPayloads(storage: Storage) {
  const now = Date.now();

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(EXPORT_PAYLOAD_PREFIX)) {
      continue;
    }

    const rawValue = storage.getItem(key);
    if (!rawValue) {
      storage.removeItem(key);
      continue;
    }

    try {
      const payload = JSON.parse(rawValue) as Partial<ResumeExportPayload>;
      if (typeof payload.createdAt !== 'number' || now - payload.createdAt > EXPORT_PAYLOAD_TTL_MS) {
        storage.removeItem(key);
      }
    } catch {
      storage.removeItem(key);
    }
  }
}

export function saveResumeExportPayload(payload: Omit<ResumeExportPayload, 'id' | 'createdAt'>): string {
  if (typeof window === 'undefined') {
    throw new Error('export-payload-window-unavailable');
  }

  cleanupExpiredExportPayloads(window.localStorage);

  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `export-${Date.now()}`;

  const nextPayload: ResumeExportPayload = {
    id,
    ...payload,
    createdAt: Date.now(),
  };

  window.localStorage.setItem(getStorageKey(id), JSON.stringify(nextPayload));
  return id;
}

export function readResumeExportPayload(id: string): ResumeExportPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(id));
  if (!rawValue) {
    return null;
  }

  try {
    const payload = JSON.parse(rawValue) as ResumeExportPayload;
    if (Date.now() - payload.createdAt > EXPORT_PAYLOAD_TTL_MS) {
      window.localStorage.removeItem(getStorageKey(id));
      return null;
    }
    return payload;
  } catch {
    window.localStorage.removeItem(getStorageKey(id));
    return null;
  }
}

export function removeResumeExportPayload(id: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getStorageKey(id));
}

export function createResumeExportUrl(id: string): string {
  if (typeof window === 'undefined') {
    throw new Error('export-url-window-unavailable');
  }

  const url = new URL('./print', window.location.href);
  url.searchParams.set('id', id);
  return url.toString();
}

export function openResumeExportFrame(url: string): HTMLIFrameElement {
  if (typeof window === 'undefined') {
    throw new Error('export-frame-window-unavailable');
  }

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.title = 'resume-export-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '1280px';
  iframe.style.height = '1800px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = '0';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);
  return iframe;
}

function isResumeExportResult(value: unknown): value is ResumeExportResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ResumeExportResult>;
  return (
    typeof candidate.exportId === 'string' &&
    (candidate.status === 'success' || candidate.status === 'error')
  );
}

export function postResumeExportResult(result: ResumeExportResult) {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(result, window.location.origin);
    return;
  }

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(result, window.location.origin);
  }
}

function disposeResumeExportTarget(target: ResumeExportTarget) {
  if (target instanceof HTMLIFrameElement) {
    target.remove();
    return;
  }

  if (!target.closed) {
    target.close();
  }
}

export function waitForResumeExport(exportId: string, exportTarget: ResumeExportTarget): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('export-window-unavailable'));
      return;
    }

    const timeoutMs = 180000;
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      window.clearTimeout(timeoutId);
      window.clearInterval(targetWatcherId);
    };

    const finish = (callback: () => void, shouldDispose: boolean = true) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      if (shouldDispose) {
        disposeResumeExportTarget(exportTarget);
      }
      callback();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isResumeExportResult(event.data)) {
        return;
      }

      const result = event.data;
      if (result.exportId !== exportId) {
        return;
      }

      if (result.status === 'success') {
        finish(resolve);
        return;
      }

      finish(() => reject(new Error(result.message || 'pdf-export-failed')));
    };

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('pdf-export-timeout')));
    }, timeoutMs);

    const targetWatcherId = window.setInterval(() => {
      if (exportTarget instanceof HTMLIFrameElement) {
        if (document.body.contains(exportTarget)) {
          return;
        }
      } else if (!exportTarget.closed) {
        return;
      }

      finish(() => reject(new Error('pdf-export-closed')));
    }, 400);

    window.addEventListener('message', handleMessage);
  });
}
