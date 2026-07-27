import { PromptqueuePersistence, type PromptqueueQuery, type PromptqueueRecord } from './persistence';

export type PromptqueueInput = Omit<PromptqueueRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class PromptqueueService {
  constructor(private readonly persistence: PromptqueuePersistence) {}

  create(input: PromptqueueInput, now = Date.now()): PromptqueueRecord {
    this.assertInput(input);
    const record: PromptqueueRecord = {
      ...input,
      id: `promptQueue-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<PromptqueueInput>, now = Date.now()): PromptqueueRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('prompt queue record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): PromptqueueRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: PromptqueueQuery = {}): PromptqueueRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: PromptqueueRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof PromptqueueQuery, value: string): PromptqueueRecord[] {
    return this.persistence.list({ [field]: value } as PromptqueueQuery);
  }

  duplicate(id: string, now = Date.now()): PromptqueueRecord {
    const source = this.get(id);
    if (!source) throw new Error('promptQueue record not found');
    return this.create({ promptId: source.promptId, priority: source.priority, status: source.status, labels: source.labels }, now);
  }

  bulkCreate(inputs: PromptqueueInput[], now = Date.now()): PromptqueueRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<PromptqueueInput>): string[] {
    const required: Array<keyof PromptqueueInput> = ['promptId', 'priority', 'status', 'labels'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.promptId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: PromptqueueQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): PromptqueueRecord {
    const record = this.get(id);
    if (!record) throw new Error('promptQueue record not found');
    return record;
  }

  compact(): PromptqueueRecord[] {
    const unique = new Map<string, PromptqueueRecord>();
    this.search().forEach((record) => unique.set(record.promptId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<PromptqueueInput>): void {
    const required: Array<keyof PromptqueueInput> = ['promptId', 'priority', 'status', 'labels'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for prompt queue`);
      }
    }
  }
}
