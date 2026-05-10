import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifestPath = join(root, "examples.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isJsonObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const manifest = readJson(manifestPath);

const requiredExampleFields = ["id", "title", "path", "category", "status", "modes", "useCases", "docs"];
const requiredReadmeSections = ["Run", "Architecture", "Revisium Tables", "Verify"];
const requiredApplicationSections = ["Capability Coverage"];
const requiredApplicationFiles = ["bootstrap.config.json", ".env.example", "scripts/bootstrap.mjs"];
const requiredEndpointTypes = ["REST_API", "GRAPHQL"];
const allowedStatuses = new Set(["bootstrap", "reference", "researched"]);
const legacyConnectionEnvNames = [
  "REVISIUM_ORG",
  "REVISIUM_PROJECT",
  "REVISIUM_BRANCH",
  "REVISIUM_REVISION",
  "REVISIUM_USERNAME",
  "REVISIUM_PASSWORD",
  "REVISIUM_TOKEN",
  "REVISIUM_API_KEY",
];
const requiredCapabilityRows = [
  "Tables",
  "Scalar FK",
  "Nested FK",
  "Array primitive FK",
  "Array object FK",
  "Array primitives",
  "Array objects",
  "File field",
  "Nested file",
  "File array",
  "Nested file array",
  "Computed scalar",
  "Computed nested",
  "Computed array index",
  "Computed aggregate",
  "Generated API",
  "MCP",
];
const errors = [];

function validateBootstrapConfig(example, exampleDir) {
  const configPath = join(exampleDir, "bootstrap.config.json");
  if (!existsSync(configPath)) {
    return;
  }

  const config = readJson(configPath);
  if (!isJsonObject(config)) {
    errors.push(`${example.path}/bootstrap.config.json must be a JSON object`);
    return;
  }

  const tables = Array.isArray(config.tables) ? config.tables : [];
  const rows = Array.isArray(config.rows) ? config.rows : [];
  const endpoints = Array.isArray(config.endpoints) ? config.endpoints : [];
  const tableIds = new Set(tables.map((table) => table?.id).filter(Boolean));

  for (const field of ["defaultUrl", "projectName", "branchName", "tables", "rows", "endpoints", "commitMessage"]) {
    if (!(field in config)) {
      errors.push(`${example.path}/bootstrap.config.json is missing ${field}`);
    }
  }

  if (typeof config.defaultUrl === "string" && !config.defaultUrl.startsWith("revisium://")) {
    errors.push(`${example.path}/bootstrap.config.json defaultUrl should use revisium:// format`);
  }
  if ("defaultBaseUrl" in config) {
    errors.push(`${example.path}/bootstrap.config.json should use defaultUrl instead of defaultBaseUrl`);
  }

  if ("tables" in config && !Array.isArray(config.tables)) {
    errors.push(`${example.path}/bootstrap.config.json field "tables" must be an array`);
  }
  if ("rows" in config && !Array.isArray(config.rows)) {
    errors.push(`${example.path}/bootstrap.config.json field "rows" must be an array`);
  }
  if ("endpoints" in config && !Array.isArray(config.endpoints)) {
    errors.push(`${example.path}/bootstrap.config.json field "endpoints" must be an array`);
  }

  if (tables.length < 3) {
    errors.push(`${example.path}/bootstrap.config.json should define at least three tables`);
  }

  for (const endpointType of requiredEndpointTypes) {
    if (!endpoints.includes(endpointType)) {
      errors.push(`${example.path}/bootstrap.config.json is missing ${endpointType} endpoint`);
    }
  }

  for (const row of rows) {
    if (!isJsonObject(row)) {
      errors.push(`${example.path}/bootstrap.config.json contains a non-object row entry`);
      continue;
    }

    if (!tableIds.has(row.tableId)) {
      errors.push(`${example.path}/bootstrap.config.json row ${row.rowId ?? "<missing-rowId>"} references missing table ${row.tableId}`);
    }
  }
}

function validateEnvExample(example, exampleDir) {
  const envPath = join(exampleDir, ".env.example");
  if (!existsSync(envPath)) {
    return;
  }

  const envExample = readFileSync(envPath, "utf8");
  if (!/^REVISIUM_URL=revisium:\/\//m.test(envExample)) {
    errors.push(`${example.path}/.env.example should use a single revisium:// REVISIUM_URL`);
  }

  for (const envName of legacyConnectionEnvNames) {
    if (new RegExp(`^${envName}=`, "m").test(envExample)) {
      errors.push(`${example.path}/.env.example should not split Revisium URL into ${envName}`);
    }
  }
}

if (!isJsonObject(manifest)) {
  errors.push("examples.json must be a JSON object");
}

if (isJsonObject(manifest) && !Array.isArray(manifest.examples)) {
  errors.push("examples.json must contain an examples array");
}

const ids = new Set();
const examples = isJsonObject(manifest) && Array.isArray(manifest.examples) ? manifest.examples : [];

for (const [index, example] of examples.entries()) {
  if (!isJsonObject(example)) {
    errors.push(`examples.json examples[${index}] must be a JSON object`);
    continue;
  }

  for (const field of requiredExampleFields) {
    if (!(field in example)) {
      errors.push(`${example.id ?? "<missing-id>"} is missing ${field}`);
    }
  }

  if (ids.has(example.id)) {
    errors.push(`duplicate example id: ${example.id}`);
  }
  ids.add(example.id);

  if (!allowedStatuses.has(example.status)) {
    errors.push(`${example.id} has unsupported status "${example.status}"`);
  }

  if (!Array.isArray(example.modes) || example.modes.length !== 1 || example.modes[0] !== "standalone") {
    errors.push(`${example.id} should only declare standalone mode in this repo`);
  }

  const exampleDir = join(root, example.path ?? "");
  const readmePath = join(exampleDir, "README.md");
  const metadataPath = join(exampleDir, "example.json");

  if (!existsSync(readmePath)) {
    errors.push(`${example.path} is missing README.md`);
  } else {
    const readme = readFileSync(readmePath, "utf8");
    for (const section of requiredReadmeSections) {
      if (!new RegExp(`^## ${section}$`, "m").test(readme)) {
        errors.push(`${example.path}/README.md is missing "## ${section}"`);
      }
    }

    if (example.category === "application") {
      for (const section of requiredApplicationSections) {
        if (!new RegExp(`^## ${section}$`, "m").test(readme)) {
          errors.push(`${example.path}/README.md is missing "## ${section}"`);
        }
      }

      for (const capability of requiredCapabilityRows) {
        if (!new RegExp(`\\|\\s*${capability}\\s*\\|`).test(readme)) {
          errors.push(`${example.path}/README.md is missing "${capability}" capability coverage`);
        }
      }

      if (!/npm run bootstrap:/.test(readme)) {
        errors.push(`${example.path}/README.md should document its bootstrap script`);
      }
    }
  }

  if (!existsSync(metadataPath)) {
    errors.push(`${example.path} is missing example.json`);
  } else {
    const metadata = readJson(metadataPath);
    if (!isJsonObject(metadata)) {
      errors.push(`${example.path}/example.json must be a JSON object`);
    } else {
      if (metadata.id !== example.id) {
        errors.push(`${example.path}/example.json id does not match examples.json`);
      }
      if (metadata.path !== example.path) {
        errors.push(`${example.path}/example.json path does not match examples.json`);
      }
      if (!Array.isArray(metadata.modes) || metadata.modes.length !== 1 || metadata.modes[0] !== "standalone") {
        errors.push(`${example.path}/example.json should only declare standalone mode`);
      }
    }
  }

  if (example.category === "application") {
    for (const requiredFile of requiredApplicationFiles) {
      if (!existsSync(join(exampleDir, requiredFile))) {
        errors.push(`${example.path} is missing ${requiredFile}`);
      }
    }

    validateBootstrapConfig(example, exampleDir);
    validateEnvExample(example, exampleDir);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${examples.length} examples`);
