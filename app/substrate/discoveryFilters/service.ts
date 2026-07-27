import { DiscoveryfiltersPersistence, type DiscoveryfiltersQuery, type DiscoveryfiltersRecord } from './persistence';

export type DiscoveryfiltersInput = Omit<DiscoveryfiltersRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class DiscoveryfiltersService {
  constructor(private readonly persistence: DiscoveryfiltersPersistence) {}

  create(input: DiscoveryfiltersInput, now = Date.now()): DiscoveryfiltersRecord {
    this.assertInput(input);
    const record: DiscoveryfiltersRecord = {
      ...input,
      id: `discoveryFilters-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<DiscoveryfiltersInput>, now = Date.now()): DiscoveryfiltersRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('discovery filters record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): DiscoveryfiltersRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: DiscoveryfiltersQuery = {}): DiscoveryfiltersRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: DiscoveryfiltersRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof DiscoveryfiltersQuery, value: string): DiscoveryfiltersRecord[] {
    return this.persistence.list({ [field]: value } as DiscoveryfiltersQuery);
  }

  duplicate(id: string, now = Date.now()): DiscoveryfiltersRecord {
    const source = this.get(id);
    if (!source) throw new Error('discoveryFilters record not found');
    return this.create({ query: source.query, category: source.category, sort: source.sort, tags: source.tags }, now);
  }

  bulkCreate(inputs: DiscoveryfiltersInput[], now = Date.now()): DiscoveryfiltersRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<DiscoveryfiltersInput>): string[] {
    const required: Array<keyof DiscoveryfiltersInput> = ['query', 'category', 'sort', 'tags'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.query)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: DiscoveryfiltersQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): DiscoveryfiltersRecord {
    const record = this.get(id);
    if (!record) throw new Error('discoveryFilters record not found');
    return record;
  }

  compact(): DiscoveryfiltersRecord[] {
    const unique = new Map<string, DiscoveryfiltersRecord>();
    this.search().forEach((record) => unique.set(record.query, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<DiscoveryfiltersInput>): void {
    const required: Array<keyof DiscoveryfiltersInput> = ['query', 'category', 'sort', 'tags'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for discovery filters`);
      }
    }
  }
}
