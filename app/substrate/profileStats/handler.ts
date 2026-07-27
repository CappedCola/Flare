import { ProfilestatsService, type ProfilestatsInput } from './service';
import type { ProfilestatsQuery, ProfilestatsRecord } from './persistence';

export type ProfilestatsRequest =
  | { action: 'create'; input: ProfilestatsInput }
  | { action: 'list'; query?: ProfilestatsQuery }
  | { action: 'get'; id: string }
  | { action: 'update'; id: string; patch: Partial<ProfilestatsInput> }
  | { action: 'delete'; id: string }
  | { action: 'summary' }
  | { action: 'validate'; input: Partial<ProfilestatsInput> }
  | { action: 'bulk-create'; inputs: ProfilestatsInput[] }
  | { action: 'export' }
  | { action: 'import'; serialized: string }
  | { action: 'exists'; id: string };

;

export type ProfilestatsResponse = {
  status: 200 | 201 | 400 | 404;
  data?: ProfilestatsRecord | ProfilestatsRecord[] | { deleted: boolean } | string | { count: number };
  error?: string;
};

export function handleProfilestats(service: ProfilestatsService, request: ProfilestatsRequest): ProfilestatsResponse {
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
