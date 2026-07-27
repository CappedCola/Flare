export type NotificationprefsRecord = {
  id: string;
  userId: string;
  categories: string;
  quietHours: string;
  enabled: string;
  createdAt: number;
  updatedAt: number;
};

export type NotificationprefsQuery = Partial<Pick<NotificationprefsRecord, 'userId' | 'categories' | 'quietHours' | 'enabled'>>;

export class NotificationprefsPersistence {
  private readonly records = new Map<string, NotificationprefsRecord>();

  constructor(seed: NotificationprefsRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: NotificationprefsRecord): NotificationprefsRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): NotificationprefsRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: NotificationprefsQuery = {}): NotificationprefsRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof NotificationprefsRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: NotificationprefsRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): NotificationprefsRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: NotificationprefsQuery = {}): NotificationprefsRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<NotificationprefsRecord>): NotificationprefsRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: NotificationprefsQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized notificationPrefs must be an array');
    const records = parsed.filter((record): record is NotificationprefsRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as NotificationprefsRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): NotificationprefsRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is NotificationprefsRecord => Boolean(record));
  }

  countBy(field: keyof NotificationprefsQuery, value: string): number {
    return this.list({ [field]: value } as NotificationprefsQuery).length;
  }

  touch(id: string, now = Date.now()): NotificationprefsRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: NotificationprefsRecord) => NotificationprefsRecord): NotificationprefsRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: NotificationprefsQuery = {}): NotificationprefsRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('notificationPrefs record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
