import { OfflineoutboxPersistence, type OfflineoutboxQuery, type OfflineoutboxRecord } from './persistence';

export type OfflineoutboxInput = Omit<OfflineoutboxRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class OfflineoutboxService {
  constructor(private readonly persistence: OfflineoutboxPersistence) {}

  create(input: OfflineoutboxInput, now = Date.now()): OfflineoutboxRecord {
    this.assertInput(input);
    const record: OfflineoutboxRecord = {
      ...input,
      id: `offlineOutbox-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<OfflineoutboxInput>, now = Date.now()): OfflineoutboxRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('offline outbox items record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): OfflineoutboxRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: OfflineoutboxQuery = {}): OfflineoutboxRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: OfflineoutboxRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof OfflineoutboxQuery, value: string): OfflineoutboxRecord[] {
    return this.persistence.list({ [field]: value } as OfflineoutboxQuery);
  }

  duplicate(id: string, now = Date.now()): OfflineoutboxRecord {
    const source = this.get(id);
    if (!source) throw new Error('offlineOutbox record not found');
    return this.create({ operationId: source.operationId, userId: source.userId, kind: source.kind, payload: source.payload }, now);
  }

  bulkCreate(inputs: OfflineoutboxInput[], now = Date.now()): OfflineoutboxRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<OfflineoutboxInput>): string[] {
    const required: Array<keyof OfflineoutboxInput> = ['operationId', 'userId', 'kind', 'payload'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.operationId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: OfflineoutboxQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): OfflineoutboxRecord {
    const record = this.get(id);
    if (!record) throw new Error('offlineOutbox record not found');
    return record;
  }

  compact(): OfflineoutboxRecord[] {
    const unique = new Map<string, OfflineoutboxRecord>();
    this.search().forEach((record) => unique.set(record.operationId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<OfflineoutboxInput>): void {
    const required: Array<keyof OfflineoutboxInput> = ['operationId', 'userId', 'kind', 'payload'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for offline outbox items`);
      }
    }
  }
}
