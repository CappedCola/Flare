import { LeaderboardPersistence, type LeaderboardQuery, type LeaderboardRecord } from './persistence';

export type LeaderboardInput = Omit<LeaderboardRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class LeaderboardService {
  constructor(private readonly persistence: LeaderboardPersistence) {}

  create(input: LeaderboardInput, now = Date.now()): LeaderboardRecord {
    this.assertInput(input);
    const record: LeaderboardRecord = {
      ...input,
      id: `leaderboard-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<LeaderboardInput>, now = Date.now()): LeaderboardRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('leaderboard entries record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): LeaderboardRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: LeaderboardQuery = {}): LeaderboardRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: LeaderboardRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof LeaderboardQuery, value: string): LeaderboardRecord[] {
    return this.persistence.list({ [field]: value } as LeaderboardQuery);
  }

  duplicate(id: string, now = Date.now()): LeaderboardRecord {
    const source = this.get(id);
    if (!source) throw new Error('leaderboard record not found');
    return this.create({ season: source.season, userId: source.userId, score: source.score, rank: source.rank }, now);
  }

  bulkCreate(inputs: LeaderboardInput[], now = Date.now()): LeaderboardRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<LeaderboardInput>): string[] {
    const required: Array<keyof LeaderboardInput> = ['season', 'userId', 'score', 'rank'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.season)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: LeaderboardQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): LeaderboardRecord {
    const record = this.get(id);
    if (!record) throw new Error('leaderboard record not found');
    return record;
  }

  compact(): LeaderboardRecord[] {
    const unique = new Map<string, LeaderboardRecord>();
    this.search().forEach((record) => unique.set(record.season, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<LeaderboardInput>): void {
    const required: Array<keyof LeaderboardInput> = ['season', 'userId', 'score', 'rank'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for leaderboard entries`);
      }
    }
  }
}
