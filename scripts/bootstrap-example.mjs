import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RevisiumClient } from "@revisium/client";

const revisiumUrlPattern = /^revisium(?:\+(http|https))?:\/\//;
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function readConfig(configPath) {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) {
    return;
  }

  process.loadEnvFile(envPath);
}

export function connectionFromEnv(config) {
  const parsedUrl = parseConnectionTarget(process.env.REVISIUM_URL ?? config.defaultUrl ?? "");
  const baseUrl = parsedUrl.baseUrl;
  const defaultLocalUsername = isLocalUrl(baseUrl) ? "admin" : "";
  const defaultLocalPassword = isLocalUrl(baseUrl) ? "admin" : "";

  return {
    baseUrl,
    organizationId: parsedUrl.organizationId ?? config.organizationId ?? "admin",
    projectName: parsedUrl.projectName ?? config.projectName,
    branchName: parsedUrl.branchName ?? config.branchName ?? "master",
    revisionName: parsedUrl.revisionName ?? config.revisionName ?? "draft",
    username: parsedUrl.username ?? process.env.REVISIUM_USERNAME ?? config.username ?? defaultLocalUsername,
    password: parsedUrl.password ?? process.env.REVISIUM_PASSWORD ?? config.password ?? defaultLocalPassword,
    token: parsedUrl.token ?? process.env.REVISIUM_TOKEN ?? "",
    apiKey: parsedUrl.apiKey ?? process.env.REVISIUM_API_KEY ?? "",
  };
}

async function authenticate(client, connection) {
  if (connection.apiKey) {
    client.loginWithApiKey(connection.apiKey);
    return;
  }

  if (connection.token) {
    client.loginWithToken(connection.token);
    return;
  }

  await client.login(connection.username, connection.password);
}

async function ensureProject(client, connection) {
  const org = client.org(connection.organizationId);

  try {
    await org.createProject({
      projectName: connection.projectName,
      branchName: connection.branchName,
    });
    console.log(`created project ${connection.organizationId}/${connection.projectName}`);
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }

    console.log(`project exists: ${connection.organizationId}/${connection.projectName}`);
  }
}

export async function ensureTables(draft, tables) {
  const existingTables = await draft.getTables({ first: 1000 });
  const existingTableIds = new Set(existingTables.edges.map(({ node }) => node.id));

  for (const table of tables) {
    if (existingTableIds.has(table.id)) {
      console.log(`table exists: ${table.id}`);
      continue;
    }

    try {
      await draft.createTable(table.id, table.schema);
      console.log(`created table: ${table.id}`);
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }

      console.log(`table exists: ${table.id}`);
    }

    existingTableIds.add(table.id);
  }
}

export async function ensureRows(draft, rows, tables) {
  const existingRowIdsByTable = new Map();
  const schemasByTable = new Map(tables.map((table) => [table.id, table.schema]));

  for (const row of rows) {
    const existingRowIds = await getExistingRowIds(draft, existingRowIdsByTable, row.tableId);

    if (existingRowIds.has(row.rowId)) {
      console.log(`row exists: ${row.tableId}/${row.rowId}`);
      continue;
    }

    try {
      await draft.createRow(row.tableId, row.rowId, hydrateSchemaDefaults(schemasByTable.get(row.tableId), row.data));
      console.log(`created row: ${row.tableId}/${row.rowId}`);
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }

      console.log(`row exists: ${row.tableId}/${row.rowId}`);
    }

    existingRowIds.add(row.rowId);
  }
}

async function getExistingRowIds(draft, cache, tableId) {
  if (!cache.has(tableId)) {
    const existingRows = await draft.getRows(tableId, { first: 1000 });
    cache.set(tableId, new Set(existingRows.edges.map(({ node }) => node.id)));
  }

  return cache.get(tableId);
}

export function hydrateSchemaDefaults(schema, data) {
  if (!schema || typeof schema !== "object") {
    return data;
  }

  if (schema.type === "object" && schema.properties) {
    const result = data && typeof data === "object" && !Array.isArray(data) ? { ...data } : {};

    for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
      if (Object.hasOwn(result, propertyName)) {
        result[propertyName] = hydrateSchemaDefaults(propertySchema, result[propertyName]);
        continue;
      }

      if (Object.hasOwn(propertySchema, "default")) {
        result[propertyName] = cloneDefault(propertySchema.default);
      }
    }

    return result;
  }

  if (schema.type === "array" && Array.isArray(data)) {
    return data.map((item) => hydrateSchemaDefaults(schema.items, item));
  }

  return data;
}

function cloneDefault(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

async function ensureEndpoints(draft, endpointTypes) {
  const endpoints = await draft.getEndpoints();
  const existingTypes = new Set(endpoints.map((endpoint) => endpoint.type));

  for (const type of endpointTypes) {
    if (existingTypes.has(type)) {
      console.log(`endpoint exists: ${type}`);
      continue;
    }

    await draft.createEndpoint({ type });
    console.log(`created endpoint: ${type}`);
  }
}

async function commitIfNeeded(draft, message) {
  const changes = await draft.getChanges();

  if (!changes.totalChanges) {
    console.log("no draft changes to commit");
    return;
  }

  await draft.commit(message);
  console.log(`committed revision: ${message}`);
}

export async function bootstrapExample(configPath) {
  const resolvedConfigPath = resolve(configPath);
  loadEnvFile(resolve(dirname(resolvedConfigPath), ".env"));
  const config = readConfig(resolvedConfigPath);
  const connection = connectionFromEnv(config);
  assertConnection(connection);

  const client = new RevisiumClient({ baseUrl: connection.baseUrl });
  await authenticate(client, connection);
  await ensureProject(client, connection);

  const branch = await client.branch({
    org: connection.organizationId,
    project: connection.projectName,
    branch: connection.branchName,
  });
  const draft = branch.draft();

  await ensureTables(draft, config.tables ?? []);
  await ensureRows(draft, config.rows ?? [], config.tables ?? []);
  await commitIfNeeded(draft, config.commitMessage ?? `Bootstrap ${connection.projectName} example`);
  await ensureEndpoints(branch.head(), config.endpoints ?? ["REST_API", "GRAPHQL"]);

  console.log(`ready: ${connection.organizationId}/${connection.projectName}/${connection.branchName}:head`);
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] === currentFile) {
  const configArg = process.argv[2];
  if (!configArg) {
    console.error("Usage: node scripts/bootstrap-example.mjs <path-to-bootstrap.config.json>");
    process.exit(1);
  }

  const scriptDir = dirname(currentFile);
  bootstrapExample(resolve(scriptDir, "..", configArg)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export function configUrl(relativePath, importMetaUrl) {
  return fileURLToPath(new URL(relativePath, importMetaUrl));
}

export function configFileUrl(relativePath, importMetaUrl) {
  return pathToFileURL(configUrl(relativePath, importMetaUrl));
}

export function parseConnectionTarget(target) {
  if (!revisiumUrlPattern.test(target)) {
    return { baseUrl: target };
  }

  return parseRevisiumUrl(target);
}

export function parseRevisiumUrl(target) {
  const protocolMatch = target.match(revisiumUrlPattern);
  const forceProtocol = protocolMatch?.[1];
  const withoutProtocol = target.replace(revisiumUrlPattern, "");
  const queryIndex = withoutProtocol.indexOf("?");
  const mainPart = queryIndex === -1 ? withoutProtocol : withoutProtocol.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? "" : withoutProtocol.slice(queryIndex + 1);
  const queryParams = new URL(`http://revisium.local/?${queryString}`).searchParams;
  const { auth, hostAndPath } = splitAuth(mainPart);
  const [hostWithPort, organizationId, projectName, branchWithRevision] = hostAndPath.split("/");
  const { branchName, revisionName } = splitBranchRevision(branchWithRevision);
  const { username, password } = splitCredentials(auth);

  return {
    baseUrl: buildBaseUrl(hostWithPort, forceProtocol),
    organizationId: decodeUrlPart(organizationId),
    projectName: decodeUrlPart(projectName),
    branchName: decodeUrlPart(branchName),
    revisionName: decodeUrlPart(revisionName),
    username: decodeUrlPart(username),
    password: decodeUrlPart(password),
    token: queryParams.get("token") ?? undefined,
    apiKey: queryParams.get("apikey") ?? queryParams.get("apiKey") ?? queryParams.get("api_key") ?? undefined,
  };
}

function assertConnection(connection) {
  if (!connection.baseUrl) {
    throw new Error("Missing Revisium host in REVISIUM_URL or defaultUrl.");
  }

  if (!connection.organizationId) {
    throw new Error("Missing organization in REVISIUM_URL or defaultUrl.");
  }

  if (!connection.projectName) {
    throw new Error("Missing project in REVISIUM_URL or defaultUrl.");
  }

  if (!connection.branchName) {
    throw new Error("Missing branch in REVISIUM_URL or defaultUrl.");
  }

  if (!isLocalUrl(connection.baseUrl) && !connection.apiKey && !connection.token) {
    throw new Error("Remote Revisium targets must include ?apikey=... or ?token=...");
  }

  if (!connection.apiKey && !connection.token && (!connection.username || !connection.password)) {
    throw new Error("Revisium targets must include user:password, ?apikey=..., or ?token=...");
  }
}

function splitAuth(mainPart) {
  const lastAtIndex = mainPart.lastIndexOf("@");
  const firstSlashIndex = mainPart.indexOf("/");
  const atIsBeforeFirstSlash = lastAtIndex !== -1 && (firstSlashIndex === -1 || lastAtIndex < firstSlashIndex);

  if (!atIsBeforeFirstSlash) {
    return { hostAndPath: mainPart };
  }

  return {
    auth: mainPart.slice(0, lastAtIndex),
    hostAndPath: mainPart.slice(lastAtIndex + 1),
  };
}

function splitCredentials(auth) {
  if (!auth) {
    return {};
  }

  const firstColonIndex = auth.indexOf(":");
  if (firstColonIndex === -1) {
    return { username: auth };
  }

  return {
    username: auth.slice(0, firstColonIndex),
    password: auth.slice(firstColonIndex + 1),
  };
}

function splitBranchRevision(branchWithRevision) {
  if (!branchWithRevision) {
    return {};
  }

  const colonIndex = branchWithRevision.indexOf(":");
  if (colonIndex === -1) {
    return { branchName: branchWithRevision };
  }

  return {
    branchName: branchWithRevision.slice(0, colonIndex),
    revisionName: branchWithRevision.slice(colonIndex + 1),
  };
}

function buildBaseUrl(hostWithPort, forceProtocol) {
  if (!hostWithPort) {
    return "";
  }

  const protocol = forceProtocol ?? (localHosts.has(extractHost(hostWithPort)) ? "http" : "https");
  return `${protocol}://${hostWithPort}`;
}

function extractHost(hostWithPort) {
  if (hostWithPort.startsWith("[") && hostWithPort.includes("]")) {
    return hostWithPort.slice(1, hostWithPort.indexOf("]")).toLowerCase();
  }

  return hostWithPort.split(":")[0].toLowerCase();
}

function decodeUrlPart(value) {
  if (!value) {
    return undefined;
  }

  return decodeURIComponent(value);
}

function isLocalUrl(baseUrl) {
  try {
    const { hostname } = new URL(baseUrl);
    return localHosts.has(hostname);
  } catch {
    return false;
  }
}

function isAlreadyExistsError(error) {
  const status = error.status ?? error.statusCode ?? error.response?.status;
  const message = String(error.message ?? "");

  return status === 409 || /already exists|conflict/i.test(message);
}
