export interface FeatureFlag {
  id: string;
  enabled: boolean;
  rollout: number;
  description: string;
  environments: string[];
}
