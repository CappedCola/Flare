import { ChatthreadsPersistence, type ChatthreadsQuery, type ChatthreadsRecord } from './persistence';

export type ChatthreadsInput = Omit<ChatthreadsRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class ChatthreadsService {
  constructor(private readonly persistence: ChatthreadsPersistence) {}

  create(input: ChatthreadsInput, now = Date.now()): ChatthreadsRecord {
    this.assertInput(input);
    const record: ChatthreadsRecord = {
      ...input,
      id: `chatThreads-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<ChatthreadsInput>, now = Date.now()): ChatthreadsRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('chat threads record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): ChatthreadsRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: ChatthreadsQuery = {}): ChatthreadsRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: ChatthreadsRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof ChatthreadsQuery, value: string): ChatthreadsRecord[] {
    return this.persistence.list({ [field]: value } as ChatthreadsQuery);
  }

  duplicate(id: string, now = Date.now()): ChatthreadsRecord {
    const source = this.get(id);
    if (!source) throw new Error('chatThreads record not found');
    return this.create({ threadId: source.threadId, participantIds: source.participantIds, title: source.title, unreadCount: source.unreadCount }, now);
  }

  bulkCreate(inputs: ChatthreadsInput[], now = Date.now()): ChatthreadsRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<ChatthreadsInput>): string[] {
    const required: Array<keyof ChatthreadsInput> = ['threadId', 'participantIds', 'title', 'unreadCount'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.threadId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: ChatthreadsQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): ChatthreadsRecord {
    const record = this.get(id);
    if (!record) throw new Error('chatThreads record not found');
    return record;
  }

  compact(): ChatthreadsRecord[] {
    const unique = new Map<string, ChatthreadsRecord>();
    this.search().forEach((record) => unique.set(record.threadId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<ChatthreadsInput>): void {
    const required: Array<keyof ChatthreadsInput> = ['threadId', 'participantIds', 'title', 'unreadCount'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for chat threads`);
      }
    }
  }
}
