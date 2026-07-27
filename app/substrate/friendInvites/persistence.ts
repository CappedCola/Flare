export type FriendinvitesRecord = {
  id: string;
  inviteId: string;
  senderId: string;
  recipientId: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

export type FriendinvitesQuery = Partial<Pick<FriendinvitesRecord, 'inviteId' | 'senderId' | 'recipientId' | 'status'>>;

export class FriendinvitesPersistence {
  private readonly records = new Map<string, FriendinvitesRecord>();

  constructor(seed: FriendinvitesRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: FriendinvitesRecord): FriendinvitesRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): FriendinvitesRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: FriendinvitesQuery = {}): FriendinvitesRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof FriendinvitesRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: FriendinvitesRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): FriendinvitesRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: FriendinvitesQuery = {}): FriendinvitesRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<FriendinvitesRecord>): FriendinvitesRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: FriendinvitesQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized friendInvites must be an array');
    const records = parsed.filter((record): record is FriendinvitesRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as FriendinvitesRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): FriendinvitesRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is FriendinvitesRecord => Boolean(record));
  }

  countBy(field: keyof FriendinvitesQuery, value: string): number {
    return this.list({ [field]: value } as FriendinvitesQuery).length;
  }

  touch(id: string, now = Date.now()): FriendinvitesRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: FriendinvitesRecord) => FriendinvitesRecord): FriendinvitesRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: FriendinvitesQuery = {}): FriendinvitesRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('friendInvites record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
