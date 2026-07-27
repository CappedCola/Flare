import { AchievementledgerPersistence, type AchievementledgerQuery, type AchievementledgerRecord } from './persistence';

export type AchievementledgerInput = Omit<AchievementledgerRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class AchievementledgerService {
  constructor(private readonly persistence: AchievementledgerPersistence) {}

  create(input: AchievementledgerInput, now = Date.now()): AchievementledgerRecord {
    this.assertInput(input);
    const record: AchievementledgerRecord = {
      ...input,
      id: `achievementLedger-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<AchievementledgerInput>, now = Date.now()): AchievementledgerRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('achievement ledger record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): AchievementledgerRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: AchievementledgerQuery = {}): AchievementledgerRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: AchievementledgerRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof AchievementledgerQuery, value: string): AchievementledgerRecord[] {
    return this.persistence.list({ [field]: value } as AchievementledgerQuery);
  }

  duplicate(id: string, now = Date.now()): AchievementledgerRecord {
    const source = this.get(id);
    if (!source) throw new Error('achievementLedger record not found');
    return this.create({ userId: source.userId, code: source.code, points: source.points, awardedAt: source.awardedAt }, now);
  }

  bulkCreate(inputs: AchievementledgerInput[], now = Date.now()): AchievementledgerRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<AchievementledgerInput>): string[] {
    const required: Array<keyof AchievementledgerInput> = ['userId', 'code', 'points', 'awardedAt'];
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

  deleteMany(query: AchievementledgerQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): AchievementledgerRecord {
    const record = this.get(id);
    if (!record) throw new Error('achievementLedger record not found');
    return record;
  }

  compact(): AchievementledgerRecord[] {
    const unique = new Map<string, AchievementledgerRecord>();
    this.search().forEach((record) => unique.set(record.userId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<AchievementledgerInput>): void {
    const required: Array<keyof AchievementledgerInput> = ['userId', 'code', 'points', 'awardedAt'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for achievement ledger`);
      }
    }
  }
}
