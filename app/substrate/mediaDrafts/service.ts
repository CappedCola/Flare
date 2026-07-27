import { MediadraftsPersistence, type MediadraftsQuery, type MediadraftsRecord } from './persistence';

export type MediadraftsInput = Omit<MediadraftsRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class MediadraftsService {
  constructor(private readonly persistence: MediadraftsPersistence) {}

  create(input: MediadraftsInput, now = Date.now()): MediadraftsRecord {
    this.assertInput(input);
    const record: MediadraftsRecord = {
      ...input,
      id: `mediaDrafts-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<MediadraftsInput>, now = Date.now()): MediadraftsRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('media drafts record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): MediadraftsRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: MediadraftsQuery = {}): MediadraftsRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: MediadraftsRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof MediadraftsQuery, value: string): MediadraftsRecord[] {
    return this.persistence.list({ [field]: value } as MediadraftsQuery);
  }

  duplicate(id: string, now = Date.now()): MediadraftsRecord {
    const source = this.get(id);
    if (!source) throw new Error('mediaDrafts record not found');
    return this.create({ draftId: source.draftId, userId: source.userId, uri: source.uri, caption: source.caption }, now);
  }

  bulkCreate(inputs: MediadraftsInput[], now = Date.now()): MediadraftsRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<MediadraftsInput>): string[] {
    const required: Array<keyof MediadraftsInput> = ['draftId', 'userId', 'uri', 'caption'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.draftId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: MediadraftsQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): MediadraftsRecord {
    const record = this.get(id);
    if (!record) throw new Error('mediaDrafts record not found');
    return record;
  }

  compact(): MediadraftsRecord[] {
    const unique = new Map<string, MediadraftsRecord>();
    this.search().forEach((record) => unique.set(record.draftId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<MediadraftsInput>): void {
    const required: Array<keyof MediadraftsInput> = ['draftId', 'userId', 'uri', 'caption'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for media drafts`);
      }
    }
  }
}
