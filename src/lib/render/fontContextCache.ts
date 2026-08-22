interface FontContextEntry<T> {
  key: string;
  promise: Promise<T>;
  value?: T;
  references: number;
  stale: boolean;
  disposed: boolean;
}

export interface FontContextLease<T> {
  value: T;
  release: () => void;
}

export class FontContextCache<T> {
  private current: FontContextEntry<T> | null = null;

  constructor(
    private readonly load: (key: string) => Promise<T>,
    private readonly dispose: (value: T) => void,
  ) {}

  async acquire(key: string): Promise<FontContextLease<T>> {
    let entry = this.current;
    if (!entry || entry.key !== key) {
      if (entry) {
        this.retire(entry);
      }

      entry = {
        key,
        promise: this.load(key),
        references: 0,
        stale: false,
        disposed: false,
      };
      this.current = entry;
    }

    entry.references += 1;

    let value: T;
    try {
      value = await entry.promise;
      entry.value = value;
    } catch (error) {
      if (this.current === entry) {
        this.current = null;
      }
      entry.stale = true;
      this.releaseEntry(entry);
      throw error;
    }

    let released = false;
    return {
      value,
      release: () => {
        if (released) return;
        released = true;
        this.releaseEntry(entry);
      },
    };
  }

  private retire(entry: FontContextEntry<T>) {
    entry.stale = true;
    this.disposeWhenUnused(entry);
  }

  private releaseEntry(entry: FontContextEntry<T>) {
    entry.references -= 1;
    this.disposeWhenUnused(entry);
  }

  private disposeWhenUnused(entry: FontContextEntry<T>) {
    if (!entry.stale || entry.references !== 0 || entry.disposed) return;

    entry.disposed = true;
    if (entry.value) {
      this.dispose(entry.value);
      return;
    }
    void entry.promise.then(this.dispose, () => undefined);
  }
}
