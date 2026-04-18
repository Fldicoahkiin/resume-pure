import {
  getRenderArtifactKey,
  readCachedRenderArtifact,
} from '@/lib/render/cache';
import { buildRenderArtifact, disposeRenderArtifact } from '@/lib/render/surface';
import { exportRenderArtifactToPDF } from '@/lib/render/pdf';
import type { RenderBuildOptions } from '@/lib/render/types';
import type { ResumeData } from '@/types';

function downloadBytes(bytes: Uint8Array, filename: string) {
  const view = bytes.slice();
  const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function exportToPDF(
  data: ResumeData,
  options: RenderBuildOptions,
  filename: string = 'resume.pdf',
): Promise<void> {
  const cacheKey = getRenderArtifactKey(data, options);
  const cachedArtifact = readCachedRenderArtifact(cacheKey);
  const artifact = cachedArtifact || await buildRenderArtifact(data, options);

  try {
    const pdfBytes = await exportRenderArtifactToPDF(artifact, filename);
    downloadBytes(pdfBytes, filename);
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw new Error('PDF 导出失败');
  } finally {
    if (!cachedArtifact) {
      disposeRenderArtifact(artifact);
    }
  }
}
