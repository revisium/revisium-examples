import { bootstrapExample, configUrl } from "../../../scripts/bootstrap-example.mjs";

await bootstrapExample(configUrl("../bootstrap.config.json", import.meta.url));
