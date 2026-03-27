type NormalizedFormDataItem = { key: string; value: unknown };

export function mapSnapshotToFormData(params: {
  snapshot: unknown;
}): Record<string, unknown> {
  const snapshot = params.snapshot;

  if (isPlainObject(snapshot)) {
    return snapshot;
  }

  return {};
}

export function mapFormDataToSnapshot(formData: unknown): {
  values: unknown;
} {
  const normalized = normalizeFormData(formData);
  const flattened = normalized.reduce<Record<string, unknown>>((acc, item) => {
    acc[item.key] = item.value as any;
    return acc;
  }, {});

  return { values: flattened };
}

function normalizeFormData(input: unknown): NormalizedFormDataItem[] {
  // 1) Already in expected shape: [{ key, value }, ...]
  if (Array.isArray(input)) {
    return input
      .filter((item): item is { key: unknown; value: unknown } => {
        const isObjectItem = Boolean(item) && typeof item === 'object';
        if (!isObjectItem) return false;
        const hasKey = typeof (item as any).key === 'string';
        return hasKey;
      })
      .map((item) => ({ key: (item as any).key, value: (item as any).value }));
  }

  // 2) Some APIs may return JSON string
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return normalizeFormData(parsed);
    } catch {
      return [];
    }
  }

  // 3) Some APIs may return { [key]: value } object
  if (isPlainObject(input)) {
    return Object.entries(input).map(([key, value]) => ({ key, value }));
  }

  return [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}


