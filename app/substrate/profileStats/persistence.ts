export type ProfilestatsRecord = {
  id: string;
  userId: string;
  posts: string;
  followers: string;
  streak: string;
  createdAt: number;
  updatedAt: number;
};

export type ProfilestatsQuery = Partial<Pick<ProfilestatsRecord, 'userId' | 'posts' | 'followers' | 'streak'>>;

export class ProfilestatsPersistence {
  private readonly records = new Map<string, ProfilestatsRecord>();

  constructor(seed: ProfilestatsRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: ProfilestatsRecord): ProfilestatsRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): ProfilestatsRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: ProfilestatsQuery = {}): ProfilestatsRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof ProfilestatsRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: ProfilestatsRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): ProfilestatsRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: ProfilestatsQuery = {}): ProfilestatsRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<ProfilestatsRecord>): ProfilestatsRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: ProfilestatsQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized profileStats must be an array');
    const records = parsed.filter((record): record is ProfilestatsRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as ProfilestatsRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): ProfilestatsRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is ProfilestatsRecord => Boolean(record));
  }

  countBy(field: keyof ProfilestatsQuery, value: string): number {
    return this.list({ [field]: value } as ProfilestatsQuery).length;
  }

  touch(id: string, now = Date.now()): ProfilestatsRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: ProfilestatsRecord) => ProfilestatsRecord): ProfilestatsRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: ProfilestatsQuery = {}): ProfilestatsRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('profileStats record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
