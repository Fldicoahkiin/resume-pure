let lastTimestamp = 0;
let sequence = 0;

function randomSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
}

export function createEntityId(prefix: string): string {
  const timestamp = Date.now();

  if (timestamp === lastTimestamp) {
    sequence += 1;
  } else {
    lastTimestamp = timestamp;
    sequence = 0;
  }

  return `${prefix}-${timestamp}-${sequence}-${randomSuffix()}`;
}
