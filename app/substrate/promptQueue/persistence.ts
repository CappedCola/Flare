export type PromptqueueRecord = {
  id: string;
  promptId: string;
  priority: string;
  status: string;
  labels: string;
  createdAt: number;
  updatedAt: number;
};

export type PromptqueueQuery = Partial<Pick<PromptqueueRecord, 'promptId' | 'priority' | 'status' | 'labels'>>;

export class PromptqueuePersistence {
  private readonly records = new Map<string, PromptqueueRecord>();

  constructor(seed: PromptqueueRecord[] = []) {
    seed.forEach((record) => this.save(record));
  }

  save(record: PromptqueueRecord): PromptqueueRecord {
    const copy = { ...record };
    this.records.set(copy.id, copy);
    return { ...copy };
  }

  find(id: string): PromptqueueRecord | undefined {
    const record = this.records.get(id);
    return record ? { ...record } : undefined;
  }

  list(query: PromptqueueQuery = {}): PromptqueueRecord[] {
    return [...this.records.values()]
      .filter((record) => Object.entries(query).every(([key, value]) => record[key as keyof PromptqueueRecord] === value))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((record) => ({ ...record }));
  }

  remove(id: string): boolean {
    return this.records.delete(id);
  }

  count(): number {
    return this.records.size;
  }

  replace(records: PromptqueueRecord[]): void {
    this.records.clear();
    records.forEach((record) => this.save(record));
  }

  snapshot(): PromptqueueRecord[] {
    return [...this.records.values()].map((record) => ({ ...record }));
  }
  has(id: string): boolean {
    return this.records.has(id);
  }

  findFirst(query: PromptqueueQuery = {}): PromptqueueRecord | undefined {
    return this.list(query)[0];
  }

  update(id: string, patch: Partial<PromptqueueRecord>): PromptqueueRecord | undefined {
    const current = this.records.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() };
    this.records.set(id, next);
    return { ...next };
  }

  removeWhere(query: PromptqueueQuery): number {
    const matches = this.list(query);
    matches.forEach((record) => this.records.delete(record.id));
    return matches.length;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot());
  }

  restore(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error('serialized promptQueue must be an array');
    const records = parsed.filter((record): record is PromptqueueRecord =>
      Boolean(record) && typeof record === 'object' && typeof (record as PromptqueueRecord).id === 'string',
    );
    this.replace(records);
  }
  findByIds(ids: string[]): PromptqueueRecord[] {
    return ids.map((id) => this.find(id)).filter((record): record is PromptqueueRecord => Boolean(record));
  }

  countBy(field: keyof PromptqueueQuery, value: string): number {
    return this.list({ [field]: value } as PromptqueueQuery).length;
  }

  touch(id: string, now = Date.now()): PromptqueueRecord | undefined {
    return this.update(id, { updatedAt: now });
  }

  clear(): void {
    this.records.clear();
  }
  mapRecords(mapper: (record: PromptqueueRecord) => PromptqueueRecord): PromptqueueRecord[] {
    const mapped = this.snapshot().map(mapper);
    this.replace(mapped);
    return this.snapshot();
  }

  firstOrThrow(query: PromptqueueQuery = {}): PromptqueueRecord {
    const record = this.findFirst(query);
    if (!record) throw new Error('promptQueue record not found');
    return record;
  }
  countUpdatedAfter(timestamp: number): number {
    return this.snapshot().filter((record) => record.updatedAt > timestamp).length;
  }
}
