import { runCliBootstrap } from "./bootstrap-cli.mjs";

const examples = [
  ["apps/nestjs-dictionary-service/bootstrap.config.json", "dictionary"],
  ["apps/nextjs-remote-config/bootstrap.config.json", "web-config"],
  ["apps/react-feature-flags/bootstrap.config.json", "frontend-config"],
  ["apps/mcp-knowledge-base/bootstrap.config.json", "knowledge-base"],
];

for (const [configPath, context] of examples) {
  runCliBootstrap(configPath, context);
}
