export type TimelineentriesRecord = {
  id: string;
  entryId: string;
  userId: string;
  kind: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type TimelineentriesQuery = Partial<Pick<TimelineentriesRecord, 'entryId' | 'userId' | 'kind' | 'body'>>;

export class TimelineentriesPersistence {
  private readonly records = new Map<string, TimelineentriesRecord>();

  constructor(seed: TimelineentriesRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: TimelineentriesRecord): TimelineentriesRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): TimelineentriesRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: TimelineentriesQuery = {}): TimelineentriesRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof TimelineentriesRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: TimelineentriesRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): TimelineentriesRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: TimelineentriesQuery = {}): TimelineentriesRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<TimelineentriesRecord>): TimelineentriesRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: TimelineentriesQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized timelineEntries must be an array');
    const records = parsed.filter((record): record is TimelineentriesRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as TimelineentriesRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): TimelineentriesRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is TimelineentriesRecord => Boolean(record));
  }

  countBy(field: keyof TimelineentriesQuery, value: string): number {
    return this.list({ [field]: value } as TimelineentriesQuery).length;
  }

  touch(id: string, now = Date.now()): TimelineentriesRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: TimelineentriesRecord) => TimelineentriesRecord): TimelineentriesRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: TimelineentriesQuery = {}): TimelineentriesRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('timelineEntries record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
