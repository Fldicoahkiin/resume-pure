import type { Image } from 'canvaskit-wasm';

interface RenderImageEntry {
  promise: Promise<Image>;
  image?: Image;
  references: number;
  stale: boolean;
  disposed: boolean;
}

export interface RenderImageLease {
  image: Image;
  release: () => void;
}

export class RenderImageCache {
  private readonly entries = new Map<string, RenderImageEntry>();

  constructor(private readonly capacity: number) {}

  async acquire(src: string, load: () => Promise<Image>): Promise<RenderImageLease> {
    let entry = this.entries.get(src);
    if (entry) {
      this.entries.delete(src);
      this.entries.set(src, entry);
    } else {
      entry = {
        promise: load(),
        references: 0,
        stale: false,
        disposed: false,
      };
      this.entries.set(src, entry);
      this.evictOverflow();
    }

    entry.references += 1;

    let image: Image;
    try {
      image = await entry.promise;
      entry.image = image;
    } catch (error) {
      if (this.entries.get(src) === entry) {
        this.entries.delete(src);
      }
      entry.stale = true;
      this.releaseEntry(entry);
      throw error;
    }

    let released = false;
    return {
      image,
      release: () => {
        if (released) return;
        released = true;
        this.releaseEntry(entry);
      },
    };
  }

  private evictOverflow() {
    while (this.entries.size > this.capacity) {
      const oldest = this.entries.entries().next().value as [string, RenderImageEntry] | undefined;
      if (!oldest) return;

      const [src, entry] = oldest;
      this.entries.delete(src);
      entry.stale = true;
      this.disposeWhenUnused(entry);
    }
  }

  private releaseEntry(entry: RenderImageEntry) {
    entry.references -= 1;
    this.disposeWhenUnused(entry);
  }

  private disposeWhenUnused(entry: RenderImageEntry) {
    if (!entry.stale || entry.references !== 0 || entry.disposed) return;

    entry.disposed = true;
    if (entry.image) {
      entry.image.delete();
      return;
    }
    void entry.promise.then((image) => image.delete(), () => undefined);
  }
}
