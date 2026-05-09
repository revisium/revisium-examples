import { existsSync } from "node:fs";
import { resolve } from "node:path";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const app = await NestFactory.create(AppModule);

await app.listen(port);

console.log(`Dictionary service listening on http://localhost:${port}`);
