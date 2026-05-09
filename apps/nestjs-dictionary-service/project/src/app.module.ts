import { Module } from "@nestjs/common";
import { DictionaryController } from "./dictionary/dictionary.controller.js";
import { DictionaryService } from "./dictionary/dictionary.service.js";
import { RevisiumDictionaryClient } from "./revisium/revisium-dictionary-client.js";

@Module({
  controllers: [DictionaryController],
  providers: [DictionaryService, RevisiumDictionaryClient],
})
export class AppModule {}
