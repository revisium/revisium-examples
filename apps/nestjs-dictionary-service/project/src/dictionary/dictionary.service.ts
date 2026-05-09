import { Injectable } from "@nestjs/common";
import { RevisiumDictionaryClient } from "../revisium/revisium-dictionary-client.js";
import type {
  DictionarySummary,
  FaqCategory,
  FaqItem,
  GlossaryTerm,
  WithId,
} from "./dictionary.types.js";

@Injectable()
export class DictionaryService {
  constructor(private readonly revisium: RevisiumDictionaryClient) {}

  async getFaqItems(): Promise<Array<WithId<FaqItem>>> {
    const faqItems = await this.revisium.rows<FaqItem>("FaqItem");
    return faqItems.sort((left, right) => left.order - right.order);
  }

  async getSummary(): Promise<DictionarySummary> {
    const [categories, faqItems, glossaryTerms] = await Promise.all([
      this.revisium.rows<FaqCategory>("FaqCategory"),
      this.getFaqItems(),
      this.revisium.rows<GlossaryTerm>("GlossaryTerm"),
    ]);

    return {
      categories,
      faqItems,
      glossaryTerms,
      totals: {
        categories: categories.length,
        faqItems: faqItems.length,
        glossaryTerms: glossaryTerms.length,
      },
    };
  }
}
