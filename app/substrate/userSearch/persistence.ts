export type UsersearchRecord = {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  score: string;
  createdAt: number;
  updatedAt: number;
};

export type UsersearchQuery = Partial<Pick<UsersearchRecord, 'userId' | 'displayName' | 'handle' | 'score'>>;

export class UsersearchPersistence {
  private readonly records = new Map<string, UsersearchRecord>();

  constructor(seed: UsersearchRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: UsersearchRecord): UsersearchRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): UsersearchRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: UsersearchQuery = {}): UsersearchRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof UsersearchRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: UsersearchRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): UsersearchRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: UsersearchQuery = {}): UsersearchRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<UsersearchRecord>): UsersearchRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: UsersearchQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized userSearch must be an array');
    const records = parsed.filter((record): record is UsersearchRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as UsersearchRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): UsersearchRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is UsersearchRecord => Boolean(record));
  }

  countBy(field: keyof UsersearchQuery, value: string): number {
    return this.list({ [field]: value } as UsersearchQuery).length;
  }

  touch(id: string, now = Date.now()): UsersearchRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: UsersearchRecord) => UsersearchRecord): UsersearchRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: UsersearchQuery = {}): UsersearchRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('userSearch record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
