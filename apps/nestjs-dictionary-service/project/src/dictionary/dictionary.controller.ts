import { Controller, Get } from "@nestjs/common";
import { DictionaryService } from "./dictionary.service.js";
import type { DictionarySummary, FaqItem, WithId } from "./dictionary.types.js";

@Controller()
export class DictionaryController {
  constructor(private readonly dictionary: DictionaryService) {}

  @Get("health")
  health(): { status: string } {
    return { status: "ok" };
  }

  @Get("faq")
  faq(): Promise<Array<WithId<FaqItem>>> {
    return this.dictionary.getFaqItems();
  }

  @Get("dictionary")
  dictionarySummary(): Promise<DictionarySummary> {
    return this.dictionary.getSummary();
  }
}
