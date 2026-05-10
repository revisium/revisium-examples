import { RevisiumClient, type RevisionScope } from "@revisium/client";
import type { FeatureFlag, PageCopy, Plan, RemoteConfig, WithId } from "../config/types";
import { parseRevisiumUrl, type RevisiumTarget } from "./revisium-url";

let revisionScope: Promise<RevisionScope> | undefined;

export async function getRemoteConfig(): Promise<RemoteConfig> {
  const [featureFlags, pageCopies, plans] = await Promise.all([
    rows<FeatureFlag>("FeatureFlag"),
    rows<PageCopy>("PageCopy"),
    rows<Plan>("Plan"),
  ]);

  return {
    featureFlags,
    pageCopies,
    plans,
    totals: {
      featureFlags: featureFlags.length,
      pageCopies: pageCopies.length,
      plans: plans.length,
      rows: featureFlags.length + pageCopies.length + plans.length,
    },
  };
}

async function rows<T extends Record<string, unknown>>(tableId: string): Promise<Array<WithId<T>>> {
  const scope = await revision();
  const result = await scope.getRows(tableId, { first: 100 });

  return result.edges.map(({ node }) => ({
    id: node.id,
    ...(node.data as T),
  }));
}

async function revision(): Promise<RevisionScope> {
  revisionScope ??= connect(parseRevisiumUrl(process.env.REVISIUM_URL));
  return revisionScope;
}

async function connect(target: RevisiumTarget): Promise<RevisionScope> {
  const client = new RevisiumClient({ baseUrl: target.baseUrl });

  if (target.apiKey) {
    client.loginWithApiKey(target.apiKey);
  } else if (target.token) {
    client.loginWithToken(target.token);
  } else if (target.username && target.password) {
    await client.login(target.username, target.password);
  }

  return client.revision({
    org: target.organizationId,
    project: target.projectName,
    branch: target.branchName,
    revision: target.revisionName,
  });
}
