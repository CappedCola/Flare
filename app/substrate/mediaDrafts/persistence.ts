export type MediadraftsRecord = {
  id: string;
  draftId: string;
  userId: string;
  uri: string;
  caption: string;
  createdAt: number;
  updatedAt: number;
};

export type MediadraftsQuery = Partial<Pick<MediadraftsRecord, 'draftId' | 'userId' | 'uri' | 'caption'>>;

export class MediadraftsPersistence {
  private readonly records = new Map<string, MediadraftsRecord>();

  constructor(seed: MediadraftsRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: MediadraftsRecord): MediadraftsRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): MediadraftsRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: MediadraftsQuery = {}): MediadraftsRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof MediadraftsRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: MediadraftsRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): MediadraftsRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: MediadraftsQuery = {}): MediadraftsRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<MediadraftsRecord>): MediadraftsRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: MediadraftsQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized mediaDrafts must be an array');
    const records = parsed.filter((record): record is MediadraftsRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as MediadraftsRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): MediadraftsRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is MediadraftsRecord => Boolean(record));
  }

  countBy(field: keyof MediadraftsQuery, value: string): number {
    return this.list({ [field]: value } as MediadraftsQuery).length;
  }

  touch(id: string, now = Date.now()): MediadraftsRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: MediadraftsRecord) => MediadraftsRecord): MediadraftsRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: MediadraftsQuery = {}): MediadraftsRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('mediaDrafts record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
