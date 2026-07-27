export type AchievementledgerRecord = {
  id: string;
  userId: string;
  code: string;
  points: string;
  awardedAt: string;
  createdAt: number;
  updatedAt: number;
};

export type AchievementledgerQuery = Partial<Pick<AchievementledgerRecord, 'userId' | 'code' | 'points' | 'awardedAt'>>;

export class AchievementledgerPersistence {
  private readonly records = new Map<string, AchievementledgerRecord>();

  constructor(seed: AchievementledgerRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: AchievementledgerRecord): AchievementledgerRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): AchievementledgerRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: AchievementledgerQuery = {}): AchievementledgerRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof AchievementledgerRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: AchievementledgerRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): AchievementledgerRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: AchievementledgerQuery = {}): AchievementledgerRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<AchievementledgerRecord>): AchievementledgerRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: AchievementledgerQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized achievementLedger must be an array');
    const records = parsed.filter((record): record is AchievementledgerRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as AchievementledgerRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): AchievementledgerRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is AchievementledgerRecord => Boolean(record));
  }

  countBy(field: keyof AchievementledgerQuery, value: string): number {
    return this.list({ [field]: value } as AchievementledgerQuery).length;
  }

  touch(id: string, now = Date.now()): AchievementledgerRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: AchievementledgerRecord) => AchievementledgerRecord): AchievementledgerRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: AchievementledgerQuery = {}): AchievementledgerRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('achievementLedger record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
