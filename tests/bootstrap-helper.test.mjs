import assert from "node:assert/strict";
import test from "node:test";
import { parseConnectionTarget, parseRevisiumUrl } from "../scripts/bootstrap-example.mjs";

test("parseRevisiumUrl follows revisium-cli localhost protocol detection", () => {
  assert.deepEqual(parseRevisiumUrl("revisium://admin:secret@localhost:9222/admin/dictionary/master"), {
    baseUrl: "http://localhost:9222",
    organizationId: "admin",
    projectName: "dictionary",
    branchName: "master",
    revisionName: undefined,
    username: "admin",
    password: "secret",
    token: undefined,
    apiKey: undefined,
  });
});

test("parseRevisiumUrl carries Cloud API key and revision from URL", () => {
  assert.deepEqual(parseRevisiumUrl("revisium://cloud.revisium.io/my-org/dictionary/master:head?apikey=rev_xxx"), {
    baseUrl: "https://cloud.revisium.io",
    organizationId: "my-org",
    projectName: "dictionary",
    branchName: "master",
    revisionName: "head",
    username: undefined,
    password: undefined,
    token: undefined,
    apiKey: "rev_xxx",
  });
});

test("parseRevisiumUrl supports explicit protocol override and token auth", () => {
  assert.deepEqual(parseRevisiumUrl("revisium+http://internal-revisium:8080/org/proj/main?token=jwt-token"), {
    baseUrl: "http://internal-revisium:8080",
    organizationId: "org",
    projectName: "proj",
    branchName: "main",
    revisionName: undefined,
    username: undefined,
    password: undefined,
    token: "jwt-token",
    apiKey: undefined,
  });
});

test("parseConnectionTarget preserves legacy HTTP base URL targets", () => {
  assert.deepEqual(parseConnectionTarget("http://localhost:9222"), {
    baseUrl: "http://localhost:9222",
  });
});
