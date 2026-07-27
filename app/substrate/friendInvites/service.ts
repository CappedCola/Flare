import { FriendinvitesPersistence, type FriendinvitesQuery, type FriendinvitesRecord } from './persistence';

export type FriendinvitesInput = Omit<FriendinvitesRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class FriendinvitesService {
  constructor(private readonly persistence: FriendinvitesPersistence) {}

  create(input: FriendinvitesInput, now = Date.now()): FriendinvitesRecord {
    this.assertInput(input);
    const record: FriendinvitesRecord = {
      ...input,
      id: `friendInvites-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<FriendinvitesInput>, now = Date.now()): FriendinvitesRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('friend invites record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): FriendinvitesRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: FriendinvitesQuery = {}): FriendinvitesRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: FriendinvitesRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof FriendinvitesQuery, value: string): FriendinvitesRecord[] {
    return this.persistence.list({ [field]: value } as FriendinvitesQuery);
  }

  duplicate(id: string, now = Date.now()): FriendinvitesRecord {
    const source = this.get(id);
    if (!source) throw new Error('friendInvites record not found');
    return this.create({ inviteId: source.inviteId, senderId: source.senderId, recipientId: source.recipientId, status: source.status }, now);
  }

  bulkCreate(inputs: FriendinvitesInput[], now = Date.now()): FriendinvitesRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<FriendinvitesInput>): string[] {
    const required: Array<keyof FriendinvitesInput> = ['inviteId', 'senderId', 'recipientId', 'status'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.inviteId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: FriendinvitesQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): FriendinvitesRecord {
    const record = this.get(id);
    if (!record) throw new Error('friendInvites record not found');
    return record;
  }

  compact(): FriendinvitesRecord[] {
    const unique = new Map<string, FriendinvitesRecord>();
    this.search().forEach((record) => unique.set(record.inviteId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<FriendinvitesInput>): void {
    const required: Array<keyof FriendinvitesInput> = ['inviteId', 'senderId', 'recipientId', 'status'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for friend invites`);
      }
    }
  }
}
