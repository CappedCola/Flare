export type RoomaccessRecord = {
  id: string;
  roomId: string;
  userId: string;
  role: string;
  expiresAt: string;
  createdAt: number;
  updatedAt: number;
};

export type RoomaccessQuery = Partial<Pick<RoomaccessRecord, 'roomId' | 'userId' | 'role' | 'expiresAt'>>;

export class RoomaccessPersistence {
  private readonly records = new Map<string, RoomaccessRecord>();

  constructor(seed: RoomaccessRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: RoomaccessRecord): RoomaccessRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): RoomaccessRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: RoomaccessQuery = {}): RoomaccessRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof RoomaccessRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: RoomaccessRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): RoomaccessRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: RoomaccessQuery = {}): RoomaccessRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<RoomaccessRecord>): RoomaccessRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: RoomaccessQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized roomAccess must be an array');
    const records = parsed.filter((record): record is RoomaccessRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as RoomaccessRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): RoomaccessRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is RoomaccessRecord => Boolean(record));
  }

  countBy(field: keyof RoomaccessQuery, value: string): number {
    return this.list({ [field]: value } as RoomaccessQuery).length;
  }

  touch(id: string, now = Date.now()): RoomaccessRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: RoomaccessRecord) => RoomaccessRecord): RoomaccessRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: RoomaccessQuery = {}): RoomaccessRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('roomAccess record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
