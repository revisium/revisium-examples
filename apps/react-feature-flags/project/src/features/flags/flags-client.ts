import type { FeatureFlag } from "./types";

const endpoint = import.meta.env.VITE_REVISIUM_PUBLIC_FEATURE_FLAG_TABLE_URL as string | undefined;

export async function loadFlags(): Promise<FeatureFlag[]> {
  if (!endpoint) {
    throw new Error("VITE_REVISIUM_PUBLIC_FEATURE_FLAG_TABLE_URL is required.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ first: 100 }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load flags: ${response.status}`);
  }

  return normalizeRows(await response.json());
}

function normalizeRows(payload: unknown): FeatureFlag[] {
  if (Array.isArray(payload)) {
    return payload.map(rowFromUnknown).filter(isFeatureFlag);
  }

  if (isRecord(payload)) {
    const edges = payload.edges;
    if (Array.isArray(edges)) {
      return edges.map((edge) => rowFromUnknown(isRecord(edge) ? edge.node : edge)).filter(isFeatureFlag);
    }

    const rows = payload.rows ?? payload.data;
    if (Array.isArray(rows)) {
      return rows.map(rowFromUnknown).filter(isFeatureFlag);
    }
  }

  return [];
}

function rowFromUnknown(value: unknown): FeatureFlag | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = typeof value.id === "string" ? value.id : undefined;
  const data = isRecord(value.data) ? value.data : value;

  if (!id) {
    return undefined;
  }

  return {
    id,
    enabled: Boolean(data.enabled),
    rollout: numberOrZero(data.rollout),
    description: typeof data.description === "string" ? data.description : "",
    environments: arrayOfStrings(data.environments),
  };
}

function isFeatureFlag(value: FeatureFlag | undefined): value is FeatureFlag {
  return value !== undefined;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
