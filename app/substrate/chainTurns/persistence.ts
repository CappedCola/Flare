export type ChainturnsRecord = {
  id: string;
  chainId: string;
  authorId: string;
  text: string;
  state: string;
  createdAt: number;
  updatedAt: number;
};

export type ChainturnsQuery = Partial<Pick<ChainturnsRecord, 'chainId' | 'authorId' | 'text' | 'state'>>;

export class ChainturnsPersistence {
  private readonly records = new Map<string, ChainturnsRecord>();

  constructor(seed: ChainturnsRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: ChainturnsRecord): ChainturnsRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): ChainturnsRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: ChainturnsQuery = {}): ChainturnsRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof ChainturnsRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: ChainturnsRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): ChainturnsRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: ChainturnsQuery = {}): ChainturnsRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<ChainturnsRecord>): ChainturnsRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: ChainturnsQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized chainTurns must be an array');
    const records = parsed.filter((record): record is ChainturnsRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as ChainturnsRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): ChainturnsRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is ChainturnsRecord => Boolean(record));
  }

  countBy(field: keyof ChainturnsQuery, value: string): number {
    return this.list({ [field]: value } as ChainturnsQuery).length;
  }

  touch(id: string, now = Date.now()): ChainturnsRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: ChainturnsRecord) => ChainturnsRecord): ChainturnsRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: ChainturnsQuery = {}): ChainturnsRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('chainTurns record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
