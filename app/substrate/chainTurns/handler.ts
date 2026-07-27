import { ChainturnsService, type ChainturnsInput } from './service';
import type { ChainturnsQuery, ChainturnsRecord } from './persistence';

export type ChainturnsRequest =
  | { action: 'create'; input: ChainturnsInput }
  | { action: 'list'; query?: ChainturnsQuery }
  | { action: 'get'; id: string }
  | { action: 'update'; id: string; patch: Partial<ChainturnsInput> }
  | { action: 'delete'; id: string }
  | { action: 'summary' }
  | { action: 'validate'; input: Partial<ChainturnsInput> }
  | { action: 'bulk-create'; inputs: ChainturnsInput[] }
  | { action: 'export' }
  | { action: 'import'; serialized: string }
  | { action: 'exists'; id: string };

;

export type ChainturnsResponse = {
  status: 200 | 201 | 400 | 404;
  data?: ChainturnsRecord | ChainturnsRecord[] | { deleted: boolean } | string | { count: number };
  error?: string;
};

export function handleChainturns(service: ChainturnsService, request: ChainturnsRequest): ChainturnsResponse {
  try {
    switch (request.action) {
      case 'create':
        return { status: 201, data: service.create(request.input) };
      case 'list':
        return { status: 200, data: service.search(request.query) };
      case 'get': {
        const found = service.get(request.id);
        return found ? { status: 200, data: found } : { status: 404, error: 'not found' };
      }
      case 'update':
        return { status: 200, data: service.update(request.id, request.patch) };
      case 'delete':
        return { status: 200, data: { deleted: service.delete(request.id) } };
      case 'summary':
        return { status: 200, data: service.search() };
      case 'validate':
        return { status: service.validate(request.input).length ? 400 : 200, error: service.validate(request.input).join(',') };
      case 'bulk-create':
        return { status: 201, data: service.bulkCreate(request.inputs) };
      case 'export':
        return { status: 200, data: service.exportData() };
      case 'import':
        return { status: 200, data: { count: service.importData(request.serialized) } };
      case 'exists':
        return { status: 200, data: { deleted: service.exists(request.id) } };
      default:
        return { status: 400, error: 'unsupported action' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'request failed';
    return { status: message.includes('not found') ? 404 : 400, error: message };
  }
}
