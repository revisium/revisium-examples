export type WithId<T extends Record<string, unknown>> = T & { id: string };

export interface FaqCategory extends Record<string, unknown> {
  name: string;
  slug: string;
}

export interface FaqItem extends Record<string, unknown> {
  question: string;
  answer: string;
  order: number;
  categoryId: string;
  tags: string[];
}

export interface GlossaryTerm extends Record<string, unknown> {
  term: string;
  definition: string;
}

export interface DictionarySummary {
  categories: Array<WithId<FaqCategory>>;
  faqItems: Array<WithId<FaqItem>>;
  glossaryTerms: Array<WithId<GlossaryTerm>>;
  totals: {
    categories: number;
    faqItems: number;
    glossaryTerms: number;
  };
}
