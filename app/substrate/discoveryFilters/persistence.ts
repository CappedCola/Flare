export type DiscoveryfiltersRecord = {
  id: string;
  query: string;
  category: string;
  sort: string;
  tags: string;
  createdAt: number;
  updatedAt: number;
};

export type DiscoveryfiltersQuery = Partial<Pick<DiscoveryfiltersRecord, 'query' | 'category' | 'sort' | 'tags'>>;

export class DiscoveryfiltersPersistence {
  private readonly records = new Map<string, DiscoveryfiltersRecord>();

  constructor(seed: DiscoveryfiltersRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: DiscoveryfiltersRecord): DiscoveryfiltersRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): DiscoveryfiltersRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: DiscoveryfiltersQuery = {}): DiscoveryfiltersRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof DiscoveryfiltersRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: DiscoveryfiltersRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): DiscoveryfiltersRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: DiscoveryfiltersQuery = {}): DiscoveryfiltersRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<DiscoveryfiltersRecord>): DiscoveryfiltersRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: DiscoveryfiltersQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized discoveryFilters must be an array');
    const records = parsed.filter((record): record is DiscoveryfiltersRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as DiscoveryfiltersRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): DiscoveryfiltersRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is DiscoveryfiltersRecord => Boolean(record));
  }

  countBy(field: keyof DiscoveryfiltersQuery, value: string): number {
    return this.list({ [field]: value } as DiscoveryfiltersQuery).length;
  }

  touch(id: string, now = Date.now()): DiscoveryfiltersRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: DiscoveryfiltersRecord) => DiscoveryfiltersRecord): DiscoveryfiltersRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: DiscoveryfiltersQuery = {}): DiscoveryfiltersRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('discoveryFilters record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
