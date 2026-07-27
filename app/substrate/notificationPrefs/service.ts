import { NotificationprefsPersistence, type NotificationprefsQuery, type NotificationprefsRecord } from './persistence';

export type NotificationprefsInput = Omit<NotificationprefsRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class NotificationprefsService {
  constructor(private readonly persistence: NotificationprefsPersistence) {}

  create(input: NotificationprefsInput, now = Date.now()): NotificationprefsRecord {
    this.assertInput(input);
    const record: NotificationprefsRecord = {
      ...input,
      id: `notificationPrefs-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<NotificationprefsInput>, now = Date.now()): NotificationprefsRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('notification preferences record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): NotificationprefsRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: NotificationprefsQuery = {}): NotificationprefsRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: NotificationprefsRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof NotificationprefsQuery, value: string): NotificationprefsRecord[] {
    return this.persistence.list({ [field]: value } as NotificationprefsQuery);
  }

  duplicate(id: string, now = Date.now()): NotificationprefsRecord {
    const source = this.get(id);
    if (!source) throw new Error('notificationPrefs record not found');
    return this.create({ userId: source.userId, categories: source.categories, quietHours: source.quietHours, enabled: source.enabled }, now);
  }

  bulkCreate(inputs: NotificationprefsInput[], now = Date.now()): NotificationprefsRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<NotificationprefsInput>): string[] {
    const required: Array<keyof NotificationprefsInput> = ['userId', 'categories', 'quietHours', 'enabled'];
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

  deleteMany(query: NotificationprefsQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): NotificationprefsRecord {
    const record = this.get(id);
    if (!record) throw new Error('notificationPrefs record not found');
    return record;
  }

  compact(): NotificationprefsRecord[] {
    const unique = new Map<string, NotificationprefsRecord>();
    this.search().forEach((record) => unique.set(record.userId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<NotificationprefsInput>): void {
    const required: Array<keyof NotificationprefsInput> = ['userId', 'categories', 'quietHours', 'enabled'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for notification preferences`);
      }
    }
  }
}
