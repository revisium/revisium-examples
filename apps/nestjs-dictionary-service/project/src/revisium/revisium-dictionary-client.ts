import { Injectable } from "@nestjs/common";
import { RevisiumClient, type RevisionScope } from "@revisium/client";
import type { WithId } from "../dictionary/dictionary.types.js";
import { parseRevisiumUrl, type RevisiumTarget } from "./revisium-url.js";

@Injectable()
export class RevisiumDictionaryClient {
  private readonly target = parseRevisiumUrl(process.env.REVISIUM_URL);
  private readonly client = new RevisiumClient({ baseUrl: this.target.baseUrl });
  private revisionScope: Promise<RevisionScope> | undefined;

  async rows<T extends Record<string, unknown>>(tableId: string): Promise<Array<WithId<T>>> {
    const scope = await this.revision();
    const rows = await scope.getRows(tableId, { first: 100 });

    return rows.edges.map(({ node }) => ({
      id: node.id,
      ...(node.data as T),
    }));
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
    } else if (target.username && target.password) {
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
