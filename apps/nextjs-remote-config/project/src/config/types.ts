export type WithId<T extends Record<string, unknown>> = T & { id: string };

export interface FeatureFlag extends Record<string, unknown> {
  enabled: boolean;
  rollout: number;
  description: string;
  segments?: string[];
}

export interface PageCopy extends Record<string, unknown> {
  title: string;
  body: string;
  ctas?: Array<{
    label: string;
    href: string;
    flagId?: string;
  }>;
}

export interface Plan extends Record<string, unknown> {
  name: string;
  monthlyPrice: number;
  features?: Array<{
    name: string;
    weight?: number;
    flagId?: string;
  }>;
}

export interface RemoteConfig {
  featureFlags: Array<WithId<FeatureFlag>>;
  pageCopies: Array<WithId<PageCopy>>;
  plans: Array<WithId<Plan>>;
  totals: {
    featureFlags: number;
    pageCopies: number;
    plans: number;
    rows: number;
  };
}
