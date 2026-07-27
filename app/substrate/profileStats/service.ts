import { ProfilestatsPersistence, type ProfilestatsQuery, type ProfilestatsRecord } from './persistence';

export type ProfilestatsInput = Omit<ProfilestatsRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class ProfilestatsService {
  constructor(private readonly persistence: ProfilestatsPersistence) {}

  create(input: ProfilestatsInput, now = Date.now()): ProfilestatsRecord {
    this.assertInput(input);
    const record: ProfilestatsRecord = {
      ...input,
      id: `profileStats-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<ProfilestatsInput>, now = Date.now()): ProfilestatsRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('profile stats record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): ProfilestatsRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: ProfilestatsQuery = {}): ProfilestatsRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: ProfilestatsRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof ProfilestatsQuery, value: string): ProfilestatsRecord[] {
    return this.persistence.list({ [field]: value } as ProfilestatsQuery);
  }

  duplicate(id: string, now = Date.now()): ProfilestatsRecord {
    const source = this.get(id);
    if (!source) throw new Error('profileStats record not found');
    return this.create({ userId: source.userId, posts: source.posts, followers: source.followers, streak: source.streak }, now);
  }

  bulkCreate(inputs: ProfilestatsInput[], now = Date.now()): ProfilestatsRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<ProfilestatsInput>): string[] {
    const required: Array<keyof ProfilestatsInput> = ['userId', 'posts', 'followers', 'streak'];
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

  deleteMany(query: ProfilestatsQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): ProfilestatsRecord {
    const record = this.get(id);
    if (!record) throw new Error('profileStats record not found');
    return record;
  }

  compact(): ProfilestatsRecord[] {
    const unique = new Map<string, ProfilestatsRecord>();
    this.search().forEach((record) => unique.set(record.userId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<ProfilestatsInput>): void {
    const required: Array<keyof ProfilestatsInput> = ['userId', 'posts', 'followers', 'streak'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for profile stats`);
      }
    }
  }
}
