import { ChatthreadsService, type ChatthreadsInput } from './service';
import type { ChatthreadsQuery, ChatthreadsRecord } from './persistence';

export type ChatthreadsRequest =
  | { action: 'create'; input: ChatthreadsInput }
  | { action: 'list'; query?: ChatthreadsQuery }
  | { action: 'get'; id: string }
  | { action: 'update'; id: string; patch: Partial<ChatthreadsInput> }
  | { action: 'delete'; id: string }
  | { action: 'summary' }
  | { action: 'validate'; input: Partial<ChatthreadsInput> }
  | { action: 'bulk-create'; inputs: ChatthreadsInput[] }
  | { action: 'export' }
  | { action: 'import'; serialized: string }
  | { action: 'exists'; id: string };

;

export type ChatthreadsResponse = {
  status: 200 | 201 | 400 | 404;
  data?: ChatthreadsRecord | ChatthreadsRecord[] | { deleted: boolean } | string | { count: number };
  error?: string;
};

export function handleChatthreads(service: ChatthreadsService, request: ChatthreadsRequest): ChatthreadsResponse {
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
