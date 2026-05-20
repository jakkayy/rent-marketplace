import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';

export interface ProductDocument {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  occasion: string | null;
  color: string | null;
  size: string | null;
  tags: string[];
  pricePerDay: number;
  categoryId: string | null;
  shopId: string;
  shopName: string;
  status: string;
}

const INDEX = 'products';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: InstanceType<typeof Meilisearch>;
  private available = false;

  constructor(private config: ConfigService) {
    this.client = new Meilisearch({
      host: config.get<string>('MEILI_HOST', 'http://localhost:7700'),
      apiKey: config.get<string>('MEILI_MASTER_KEY', ''),
    });
  }

  async onModuleInit() {
    try {
      await this.client.health();
      const index = this.client.index(INDEX);
      await index.updateSearchableAttributes(['name', 'description', 'brand', 'tags', 'shopName']);
      await index.updateFilterableAttributes(['categoryId', 'shopId', 'occasion', 'status', 'color', 'size']);
      await index.updateSortableAttributes(['pricePerDay']);
      this.available = true;
      this.logger.log('Connected to Meilisearch');
    } catch {
      this.logger.warn('Meilisearch unavailable — falling back to database search');
    }
  }

  isAvailable() {
    return this.available;
  }

  async upsert(doc: ProductDocument) {
    if (!this.available) return;
    await this.client.index(INDEX).addDocuments([doc]);
  }

  async delete(id: string) {
    if (!this.available) return;
    await this.client.index(INDEX).deleteDocument(id);
  }

  async bulkUpsert(docs: ProductDocument[]) {
    if (!this.available || docs.length === 0) return;
    await this.client.index(INDEX).addDocuments(docs);
    this.logger.log(`Synced ${docs.length} products to Meilisearch`);
  }

  async search(query: string, options: {
    filter?: string[];
    sort?: string[];
    limit?: number;
    offset?: number;
  } = {}) {
    const result = await this.client.index(INDEX).search(query, {
      filter: options.filter,
      sort: options.sort,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    });
    return { ids: result.hits.map((h) => h.id as string), total: result.estimatedTotalHits ?? 0 };
  }
}
