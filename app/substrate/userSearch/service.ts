import { UsersearchPersistence, type UsersearchQuery, type UsersearchRecord } from './persistence';

export type UsersearchInput = Omit<UsersearchRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class UsersearchService {
  constructor(private readonly persistence: UsersearchPersistence) {}

  create(input: UsersearchInput, now = Date.now()): UsersearchRecord {
    this.assertInput(input);
    const record: UsersearchRecord = {
      ...input,
      id: `userSearch-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<UsersearchInput>, now = Date.now()): UsersearchRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('user search entries record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): UsersearchRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: UsersearchQuery = {}): UsersearchRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: UsersearchRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof UsersearchQuery, value: string): UsersearchRecord[] {
    return this.persistence.list({ [field]: value } as UsersearchQuery);
  }

  duplicate(id: string, now = Date.now()): UsersearchRecord {
    const source = this.get(id);
    if (!source) throw new Error('userSearch record not found');
    return this.create({ userId: source.userId, displayName: source.displayName, handle: source.handle, score: source.score }, now);
  }

  bulkCreate(inputs: UsersearchInput[], now = Date.now()): UsersearchRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<UsersearchInput>): string[] {
    const required: Array<keyof UsersearchInput> = ['userId', 'displayName', 'handle', 'score'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.userId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: UsersearchQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): UsersearchRecord {
    const record = this.get(id);
    if (!record) throw new Error('userSearch record not found');
    return record;
  }

  compact(): UsersearchRecord[] {
    const unique = new Map<string, UsersearchRecord>();
    this.search().forEach((record) => unique.set(record.userId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<UsersearchInput>): void {
    const required: Array<keyof UsersearchInput> = ['userId', 'displayName', 'handle', 'score'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for user search entries`);
      }
    }
  }
}
