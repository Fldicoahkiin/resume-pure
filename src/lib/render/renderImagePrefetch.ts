import type { RenderDrawOp } from './types';

const DEFAULT_IMAGE_PREFETCH_CONCURRENCY = 4;

export async function prefetchRenderImages<T>(
  operations: RenderDrawOp[],
  load: (src: string) => Promise<T>,
  concurrency: number = DEFAULT_IMAGE_PREFETCH_CONCURRENCY,
) {
  const sources = Array.from(new Set(
    operations.flatMap((operation) => operation.kind === 'image' ? [operation.src] : []),
  ));
  const results = new Map<string, T>();
  let nextIndex = 0;

  const run = async () => {
    while (nextIndex < sources.length) {
      const source = sources[nextIndex];
      nextIndex += 1;
      results.set(source, await load(source));
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), sources.length) }, () => run()),
  );
  return results;
}
