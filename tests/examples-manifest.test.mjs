import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "examples.json"), "utf8"));
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

test("examples manifest points to complete example folders", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.ok(Array.isArray(manifest.examples));

  const ids = new Set();
  for (const example of manifest.examples) {
    assert.ok(example.id, "example id is required");
    assert.ok(allowedStatuses.has(example.status), `${example.id} uses unsupported status ${example.status}`);
    assert.deepEqual(example.modes, ["standalone"], `${example.id} should only support standalone in this repo`);
    assert.ok(!ids.has(example.id), `duplicate example id: ${example.id}`);
    ids.add(example.id);

    const exampleDir = join(root, example.path);
    assert.ok(existsSync(exampleDir), `${example.path} must exist`);
    assert.ok(existsSync(join(exampleDir, "README.md")), `${example.path} must have README.md`);
    assert.ok(existsSync(join(exampleDir, "example.json")), `${example.path} must have example.json`);

    const metadata = JSON.parse(readFileSync(join(exampleDir, "example.json"), "utf8"));
    assert.equal(metadata.id, example.id, `${example.path}/example.json id should match examples.json`);
    assert.equal(metadata.path, example.path, `${example.path}/example.json path should match examples.json`);
    assert.deepEqual(metadata.modes, ["standalone"], `${example.path}/example.json should only support standalone`);
  }
});

test("application examples expose bootstrap inputs", () => {
  for (const example of manifest.examples.filter((item) => item.category === "application")) {
    const exampleDir = join(root, example.path);
    const envPath = join(exampleDir, ".env.example");
    assert.ok(existsSync(envPath), `${example.path} must document env`);
    assert.ok(existsSync(join(exampleDir, "bootstrap.config.json")), `${example.path} must define bootstrap config`);
    assert.ok(existsSync(join(exampleDir, "scripts/bootstrap.mjs")), `${example.path} must expose a bootstrap script`);

    const envExample = readFileSync(envPath, "utf8");
    assert.match(envExample, /^REVISIUM_URL=revisium:\/\//m, `${example.path} must use one Revisium URL`);

    for (const envName of legacyConnectionEnvNames) {
      assert.doesNotMatch(envExample, new RegExp(`^${envName}=`, "m"), `${example.path} should not split Revisium URL into ${envName}`);
    }
  }
});
