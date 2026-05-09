export interface RevisiumTarget {
  baseUrl: string;
  organizationId: string;
  projectName: string;
  branchName: string;
  revisionName: string;
  username: string;
  password: string;
  token?: string;
  apiKey?: string;
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function parseRevisiumUrl(value: string | undefined): RevisiumTarget {
  if (!value) {
    throw new Error("REVISIUM_URL is required.");
  }

  const url = new URL(value);
  const [organizationId, projectName, branchWithRevision = "master:head"] = url.pathname.split("/").filter(Boolean);
  const [branchName, revisionName = "head"] = branchWithRevision.split(":");

  if (!organizationId || !projectName || !branchName) {
    throw new Error("REVISIUM_URL must include organization, project, and branch.");
  }

  return {
    baseUrl: `${protocolFor(url)}://${url.host}`,
    organizationId,
    projectName,
    branchName,
    revisionName,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    token: url.searchParams.get("token") ?? undefined,
    apiKey: url.searchParams.get("apikey") ?? undefined,
  };
}

function protocolFor(url: URL): "http" | "https" {
  if (url.protocol === "revisium+http:") {
    return "http";
  }

  if (url.protocol === "revisium+https:") {
    return "https";
  }

  return localHosts.has(url.hostname) ? "http" : "https";
}
