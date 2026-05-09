import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadFlags } from "./flags-client";
import type { FeatureFlag } from "./types";

interface FlagsContextValue {
  flags: Map<string, FeatureFlag>;
  loading: boolean;
  error?: string;
}

export const FlagsContext = createContext<FlagsContextValue>({
  flags: new Map(),
  loading: true,
});

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    loadFlags()
      .then((loadedFlags) => {
        if (active) {
          setFlags(loadedFlags);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Failed to load flags.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<FlagsContextValue>(
    () => ({
      flags: new Map(flags.map((flag) => [flag.id, flag])),
      loading,
      error,
    }),
    [error, flags, loading],
  );

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}
