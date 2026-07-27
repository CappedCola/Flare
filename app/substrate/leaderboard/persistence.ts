export type LeaderboardRecord = {
  id: string;
  season: string;
  userId: string;
  score: string;
  rank: string;
  createdAt: number;
  updatedAt: number;
};

export type LeaderboardQuery = Partial<Pick<LeaderboardRecord, 'season' | 'userId' | 'score' | 'rank'>>;

export class LeaderboardPersistence {
  private readonly records = new Map<string, LeaderboardRecord>();

  constructor(seed: LeaderboardRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: LeaderboardRecord): LeaderboardRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): LeaderboardRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: LeaderboardQuery = {}): LeaderboardRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof LeaderboardRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: LeaderboardRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): LeaderboardRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: LeaderboardQuery = {}): LeaderboardRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<LeaderboardRecord>): LeaderboardRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: LeaderboardQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized leaderboard must be an array');
    const records = parsed.filter((record): record is LeaderboardRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as LeaderboardRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): LeaderboardRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is LeaderboardRecord => Boolean(record));
  }

  countBy(field: keyof LeaderboardQuery, value: string): number {
    return this.list({ [field]: value } as LeaderboardQuery).length;
  }

  touch(id: string, now = Date.now()): LeaderboardRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: LeaderboardRecord) => LeaderboardRecord): LeaderboardRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: LeaderboardQuery = {}): LeaderboardRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('leaderboard record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
