export type ChatthreadsRecord = {
  id: string;
  threadId: string;
  participantIds: string;
  title: string;
  unreadCount: string;
  createdAt: number;
  updatedAt: number;
};

export type ChatthreadsQuery = Partial<Pick<ChatthreadsRecord, 'threadId' | 'participantIds' | 'title' | 'unreadCount'>>;

export class ChatthreadsPersistence {
  private readonly records = new Map<string, ChatthreadsRecord>();

  constructor(seed: ChatthreadsRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: ChatthreadsRecord): ChatthreadsRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): ChatthreadsRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: ChatthreadsQuery = {}): ChatthreadsRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof ChatthreadsRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: ChatthreadsRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): ChatthreadsRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: ChatthreadsQuery = {}): ChatthreadsRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<ChatthreadsRecord>): ChatthreadsRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: ChatthreadsQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized chatThreads must be an array');
    const records = parsed.filter((record): record is ChatthreadsRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as ChatthreadsRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): ChatthreadsRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is ChatthreadsRecord => Boolean(record));
  }

  countBy(field: keyof ChatthreadsQuery, value: string): number {
    return this.list({ [field]: value } as ChatthreadsQuery).length;
  }

  touch(id: string, now = Date.now()): ChatthreadsRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: ChatthreadsRecord) => ChatthreadsRecord): ChatthreadsRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: ChatthreadsQuery = {}): ChatthreadsRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('chatThreads record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
