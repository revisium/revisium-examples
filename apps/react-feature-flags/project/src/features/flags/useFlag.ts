import { useContext } from "react";
import { FlagsContext } from "./FlagsProvider";
import type { FeatureFlag } from "./types";

export function useFlag(flagId: string): FeatureFlag | undefined {
  const { flags } = useContext(FlagsContext);
  return flags.get(flagId);
}
