export type PhotoreactionsRecord = {
  id: string;
  photoId: string;
  userId: string;
  reaction: string;
  occurredAt: string;
  createdAt: number;
  updatedAt: number;
};

export type PhotoreactionsQuery = Partial<Pick<PhotoreactionsRecord, 'photoId' | 'userId' | 'reaction' | 'occurredAt'>>;

export class PhotoreactionsPersistence {
  private readonly records = new Map<string, PhotoreactionsRecord>();

  constructor(seed: PhotoreactionsRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: PhotoreactionsRecord): PhotoreactionsRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): PhotoreactionsRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: PhotoreactionsQuery = {}): PhotoreactionsRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof PhotoreactionsRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: PhotoreactionsRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): PhotoreactionsRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: PhotoreactionsQuery = {}): PhotoreactionsRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<PhotoreactionsRecord>): PhotoreactionsRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: PhotoreactionsQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized photoReactions must be an array');
    const records = parsed.filter((record): record is PhotoreactionsRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as PhotoreactionsRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): PhotoreactionsRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is PhotoreactionsRecord => Boolean(record));
  }

  countBy(field: keyof PhotoreactionsQuery, value: string): number {
    return this.list({ [field]: value } as PhotoreactionsQuery).length;
  }

  touch(id: string, now = Date.now()): PhotoreactionsRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: PhotoreactionsRecord) => PhotoreactionsRecord): PhotoreactionsRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: PhotoreactionsQuery = {}): PhotoreactionsRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('photoReactions record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
