import { PhotoreactionsPersistence, type PhotoreactionsQuery, type PhotoreactionsRecord } from './persistence';

export type PhotoreactionsInput = Omit<PhotoreactionsRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class PhotoreactionsService {
  constructor(private readonly persistence: PhotoreactionsPersistence) {}

  create(input: PhotoreactionsInput, now = Date.now()): PhotoreactionsRecord {
    this.assertInput(input);
    const record: PhotoreactionsRecord = {
      ...input,
      id: `photoReactions-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<PhotoreactionsInput>, now = Date.now()): PhotoreactionsRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('photo reactions record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): PhotoreactionsRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: PhotoreactionsQuery = {}): PhotoreactionsRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: PhotoreactionsRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof PhotoreactionsQuery, value: string): PhotoreactionsRecord[] {
    return this.persistence.list({ [field]: value } as PhotoreactionsQuery);
  }

  duplicate(id: string, now = Date.now()): PhotoreactionsRecord {
    const source = this.get(id);
    if (!source) throw new Error('photoReactions record not found');
    return this.create({ photoId: source.photoId, userId: source.userId, reaction: source.reaction, occurredAt: source.occurredAt }, now);
  }

  bulkCreate(inputs: PhotoreactionsInput[], now = Date.now()): PhotoreactionsRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<PhotoreactionsInput>): string[] {
    const required: Array<keyof PhotoreactionsInput> = ['photoId', 'userId', 'reaction', 'occurredAt'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.photoId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: PhotoreactionsQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): PhotoreactionsRecord {
    const record = this.get(id);
    if (!record) throw new Error('photoReactions record not found');
    return record;
  }

  compact(): PhotoreactionsRecord[] {
    const unique = new Map<string, PhotoreactionsRecord>();
    this.search().forEach((record) => unique.set(record.photoId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<PhotoreactionsInput>): void {
    const required: Array<keyof PhotoreactionsInput> = ['photoId', 'userId', 'reaction', 'occurredAt'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for photo reactions`);
      }
    }
  }
}
