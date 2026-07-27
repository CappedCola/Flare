import { TimelineentriesPersistence, type TimelineentriesQuery, type TimelineentriesRecord } from './persistence';

export type TimelineentriesInput = Omit<TimelineentriesRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class TimelineentriesService {
  constructor(private readonly persistence: TimelineentriesPersistence) {}

  create(input: TimelineentriesInput, now = Date.now()): TimelineentriesRecord {
    this.assertInput(input);
    const record: TimelineentriesRecord = {
      ...input,
      id: `timelineEntries-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<TimelineentriesInput>, now = Date.now()): TimelineentriesRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('timeline entries record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): TimelineentriesRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: TimelineentriesQuery = {}): TimelineentriesRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: TimelineentriesRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof TimelineentriesQuery, value: string): TimelineentriesRecord[] {
    return this.persistence.list({ [field]: value } as TimelineentriesQuery);
  }

  duplicate(id: string, now = Date.now()): TimelineentriesRecord {
    const source = this.get(id);
    if (!source) throw new Error('timelineEntries record not found');
    return this.create({ entryId: source.entryId, userId: source.userId, kind: source.kind, body: source.body }, now);
  }

  bulkCreate(inputs: TimelineentriesInput[], now = Date.now()): TimelineentriesRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<TimelineentriesInput>): string[] {
    const required: Array<keyof TimelineentriesInput> = ['entryId', 'userId', 'kind', 'body'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.entryId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: TimelineentriesQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): TimelineentriesRecord {
    const record = this.get(id);
    if (!record) throw new Error('timelineEntries record not found');
    return record;
  }

  compact(): TimelineentriesRecord[] {
    const unique = new Map<string, TimelineentriesRecord>();
    this.search().forEach((record) => unique.set(record.entryId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<TimelineentriesInput>): void {
    const required: Array<keyof TimelineentriesInput> = ['entryId', 'userId', 'kind', 'body'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for timeline entries`);
      }
    }
  }
}
