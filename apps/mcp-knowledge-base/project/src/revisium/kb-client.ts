import { RevisiumClient, type RevisionScope, type RowModel } from "@revisium/client";
import { parseRevisiumUrl, type RevisiumTarget } from "./revisium-url.js";

export interface TableSummary {
  tableId: string;
  rowCount: number;
}

export interface KbRow {
  tableId: string;
  rowId: string;
  data: Record<string, unknown>;
}

export interface KbSearchResult extends KbRow {
  preview: string;
}

export class RevisiumKbClient {
  private readonly target = parseRevisiumUrl(process.env.REVISIUM_URL);
  private readonly client = new RevisiumClient({ baseUrl: this.target.baseUrl });
  private revisionScope: Promise<RevisionScope> | undefined;

  async listTables(): Promise<TableSummary[]> {
    const scope = await this.revision();
    const tables = await scope.getTables({ first: 100 });

    return Promise.all(
      tables.edges.map(async ({ node }) => {
        const count = await scope.getTableCountRows(node.id);
        return {
          tableId: node.id,
          rowCount: count.count,
        };
      }),
    );
  }

  async getRow(tableId: string, rowId: string): Promise<KbRow> {
    const scope = await this.revision();
    const row = await scope.getRow(tableId, rowId);
    return toKbRow(tableId, row);
  }

  async search(query: string, limit: number): Promise<KbSearchResult[]> {
    const normalizedQuery = query.toLowerCase();
    const scope = await this.revision();
    const tables = await this.listTables();
    const matches: KbSearchResult[] = [];

    for (const table of tables) {
      const rows = await scope.getRows(table.tableId, { first: 100 });

      for (const { node } of rows.edges) {
        const haystack = JSON.stringify(node.data).toLowerCase();
        if (haystack.includes(normalizedQuery)) {
          matches.push({
            ...toKbRow(table.tableId, node),
            preview: preview(node.data),
          });
        }

        if (matches.length >= limit) {
          return matches;
        }
      }
    }

    return matches;
  }

  private async revision(): Promise<RevisionScope> {
    this.revisionScope ??= this.connect(this.target);
    return this.revisionScope;
  }

  private async connect(target: RevisiumTarget): Promise<RevisionScope> {
    if (target.apiKey) {
      this.client.loginWithApiKey(target.apiKey);
    } else if (target.token) {
      this.client.loginWithToken(target.token);
    } else {
      await this.client.login(target.username, target.password);
    }

    return this.client.revision({
      org: target.organizationId,
      project: target.projectName,
      branch: target.branchName,
      revision: target.revisionName,
    });
  }
}

function toKbRow(tableId: string, row: RowModel): KbRow {
  return {
    tableId,
    rowId: row.id,
    data: row.data,
  };
}

function preview(data: Record<string, unknown>): string {
  const summary = data.title ?? data.topic ?? data.summary ?? data.content ?? JSON.stringify(data);
  return String(summary).slice(0, 180);
}
