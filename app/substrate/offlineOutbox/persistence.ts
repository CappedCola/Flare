export type OfflineoutboxRecord = {
  id: string;
  operationId: string;
  userId: string;
  kind: string;
  payload: string;
  createdAt: number;
  updatedAt: number;
};

export type OfflineoutboxQuery = Partial<Pick<OfflineoutboxRecord, 'operationId' | 'userId' | 'kind' | 'payload'>>;

export class OfflineoutboxPersistence {
  private readonly records = new Map<string, OfflineoutboxRecord>();

  constructor(seed: OfflineoutboxRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: OfflineoutboxRecord): OfflineoutboxRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): OfflineoutboxRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: OfflineoutboxQuery = {}): OfflineoutboxRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof OfflineoutboxRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: OfflineoutboxRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): OfflineoutboxRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: OfflineoutboxQuery = {}): OfflineoutboxRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<OfflineoutboxRecord>): OfflineoutboxRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: OfflineoutboxQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized offlineOutbox must be an array');
    const records = parsed.filter((record): record is OfflineoutboxRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as OfflineoutboxRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): OfflineoutboxRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is OfflineoutboxRecord => Boolean(record));
  }

  countBy(field: keyof OfflineoutboxQuery, value: string): number {
    return this.list({ [field]: value } as OfflineoutboxQuery).length;
  }

  touch(id: string, now = Date.now()): OfflineoutboxRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: OfflineoutboxRecord) => OfflineoutboxRecord): OfflineoutboxRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: OfflineoutboxQuery = {}): OfflineoutboxRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('offlineOutbox record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
