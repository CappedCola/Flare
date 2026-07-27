import { RoomaccessPersistence, type RoomaccessQuery, type RoomaccessRecord } from './persistence';

export type RoomaccessInput = Omit<RoomaccessRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class RoomaccessService {
  constructor(private readonly persistence: RoomaccessPersistence) {}

  create(input: RoomaccessInput, now = Date.now()): RoomaccessRecord {
    this.assertInput(input);
    const record: RoomaccessRecord = {
      ...input,
      id: `roomAccess-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<RoomaccessInput>, now = Date.now()): RoomaccessRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('room access grants record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): RoomaccessRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: RoomaccessQuery = {}): RoomaccessRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: RoomaccessRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof RoomaccessQuery, value: string): RoomaccessRecord[] {
    return this.persistence.list({ [field]: value } as RoomaccessQuery);
  }

  duplicate(id: string, now = Date.now()): RoomaccessRecord {
    const source = this.get(id);
    if (!source) throw new Error('roomAccess record not found');
    return this.create({ roomId: source.roomId, userId: source.userId, role: source.role, expiresAt: source.expiresAt }, now);
  }

  bulkCreate(inputs: RoomaccessInput[], now = Date.now()): RoomaccessRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<RoomaccessInput>): string[] {
    const required: Array<keyof RoomaccessInput> = ['roomId', 'userId', 'role', 'expiresAt'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.roomId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: RoomaccessQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): RoomaccessRecord {
    const record = this.get(id);
    if (!record) throw new Error('roomAccess record not found');
    return record;
  }

  compact(): RoomaccessRecord[] {
    const unique = new Map<string, RoomaccessRecord>();
    this.search().forEach((record) => unique.set(record.roomId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<RoomaccessInput>): void {
    const required: Array<keyof RoomaccessInput> = ['roomId', 'userId', 'role', 'expiresAt'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for room access grants`);
      }
    }
  }
}
