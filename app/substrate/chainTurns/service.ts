import { ChainturnsPersistence, type ChainturnsQuery, type ChainturnsRecord } from './persistence';

export type ChainturnsInput = Omit<ChainturnsRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class ChainturnsService {
  constructor(private readonly persistence: ChainturnsPersistence) {}

  create(input: ChainturnsInput, now = Date.now()): ChainturnsRecord {
    this.assertInput(input);
    const record: ChainturnsRecord = {
      ...input,
      id: `chainTurns-${now}-${this.persistence.count() + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.persistence.save(record);
  }

  update(id: string, patch: Partial<ChainturnsInput>, now = Date.now()): ChainturnsRecord {
    const current = this.persistence.find(id);
    if (!current) throw new Error('chain turns record not found');
    const next = { ...current, ...patch, updatedAt: now };
    this.assertInput(next);
    return this.persistence.save(next);
  }

  get(id: string): ChainturnsRecord | undefined {
    return this.persistence.find(id);
  }

  search(query: ChainturnsQuery = {}): ChainturnsRecord[] {
    return this.persistence.list(query);
  }

  delete(id: string): boolean {
    return this.persistence.remove(id);
  }

  summary(): { total: number; latest?: ChainturnsRecord } {
    const records = this.persistence.list();
    return { total: records.length, latest: records[0] };
  }


  listBy(field: keyof ChainturnsQuery, value: string): ChainturnsRecord[] {
    return this.persistence.list({ [field]: value } as ChainturnsQuery);
  }

  duplicate(id: string, now = Date.now()): ChainturnsRecord {
    const source = this.get(id);
    if (!source) throw new Error('chainTurns record not found');
    return this.create({ chainId: source.chainId, authorId: source.authorId, text: source.text, state: source.state }, now);
  }

  bulkCreate(inputs: ChainturnsInput[], now = Date.now()): ChainturnsRecord[] {
    return inputs.map((input, index) => this.create(input, now + index));
  }

  validate(input: Partial<ChainturnsInput>): string[] {
    const required: Array<keyof ChainturnsInput> = ['chainId', 'authorId', 'text', 'state'];
    return required.filter((key) => {
      const value = input[key];
      return typeof value !== 'string' || value.trim().length === 0;
    }).map(String);
  }

  metrics(): { total: number; distinctFirst: number; newestAt: number } {
    const records = this.search();
    return {
      total: records.length,
      distinctFirst: new Set(records.map((record) => record.chainId)).size,
      newestAt: records.reduce((latest, record) => Math.max(latest, record.updatedAt), 0),
    };
  }


  exists(id: string): boolean {
    return this.persistence.has(id);
  }

  deleteMany(query: ChainturnsQuery): number {
    return this.persistence.removeWhere(query);
  }

  exportData(): string {
    return this.persistence.serialize();
  }

  importData(serialized: string): number {
    this.persistence.restore(serialized);
    return this.persistence.count();
  }


  require(id: string): ChainturnsRecord {
    const record = this.get(id);
    if (!record) throw new Error('chainTurns record not found');
    return record;
  }

  compact(): ChainturnsRecord[] {
    const unique = new Map<string, ChainturnsRecord>();
    this.search().forEach((record) => unique.set(record.chainId, record));
    const records = [...unique.values()];
    this.persistence.replace(records);
    return records;
  }

  private assertInput(input: Partial<ChainturnsInput>): void {
    const required: Array<keyof ChainturnsInput> = ['chainId', 'authorId', 'text', 'state'];
    for (const key of required) {
      const value = input[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${String(key)} is required for chain turns`);
      }
    }
  }
}
