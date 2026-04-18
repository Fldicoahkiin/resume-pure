import { disposeRenderArtifact } from '@/lib/render/surface';
import type { RenderArtifact, RenderBuildOptions } from '@/lib/render/types';
import type { ResumeData } from '@/types';

interface CachedRenderArtifact {
  key: string;
  artifact: RenderArtifact;
}

let cachedRenderArtifact: CachedRenderArtifact | null = null;

export function getRenderArtifactKey(data: ResumeData, options: RenderBuildOptions) {
  return JSON.stringify({
    resume: data,
    theme: options.theme,
    translations: options.translations,
  });
}

export function readCachedRenderArtifact(key: string) {
  if (!cachedRenderArtifact || cachedRenderArtifact.key !== key) {
    return null;
  }

  return cachedRenderArtifact.artifact;
}

export function storeCachedRenderArtifact(key: string, artifact: RenderArtifact) {
  if (
    cachedRenderArtifact &&
    cachedRenderArtifact.key === key &&
    cachedRenderArtifact.artifact === artifact
  ) {
    return;
  }

  if (cachedRenderArtifact) {
    disposeRenderArtifact(cachedRenderArtifact.artifact);
  }

  cachedRenderArtifact = { key, artifact };
}

export function clearCachedRenderArtifact(key?: string) {
  if (!cachedRenderArtifact) {
    return;
  }

  if (key && cachedRenderArtifact.key !== key) {
    return;
  }

  disposeRenderArtifact(cachedRenderArtifact.artifact);
  cachedRenderArtifact = null;
}
