import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ChatthreadsPanel } from '../../app/substrate/chatThreads/Panel';
import { handleChatthreads } from '../../app/substrate/chatThreads/handler';
import { ChatthreadsPersistence } from '../../app/substrate/chatThreads/persistence';
import { ChatthreadsService, type ChatthreadsInput } from '../../app/substrate/chatThreads/service';

const input = (overrides: Partial<ChatthreadsInput> = {}): ChatthreadsInput => ({
  threadId: 'primary',
  participantIds: 'secondary',
  title: 'tertiary',
  unreadCount: 'quaternary',
  ...overrides,
});

  it('persists chat threads', () => {
    const store = new ChatthreadsPersistence();
    const service = new ChatthreadsService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ threadId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { unreadCount: 'changed' }, 200).unreadCount).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles chat threads requests', () => {
    const service = new ChatthreadsService(new ChatthreadsPersistence());
    const created = handleChatthreads(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleChatthreads(service, { action: 'get', id }).status).toBe(200);
    expect(handleChatthreads(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleChatthreads(service, { action: 'update', id, patch: { title: 'revised' } }).status).toBe(200);
    expect(handleChatthreads(service, { action: 'list' }).status).toBe(200);
    expect(handleChatthreads(service, { action: 'delete', id }).status).toBe(200);
    expect(handleChatthreads(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleChatthreads(service, { action: 'create', input: input({ threadId: '' }) }).status).toBe(400);
  });

  it('renders chat threads state', () => {
    const service = new ChatthreadsService(new ChatthreadsPersistence());
    const record = service.create(input({ threadId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<ChatthreadsPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips chatThreads', () => {
    const first = new ChatthreadsPersistence();
    const service = new ChatthreadsService(first);
    service.bulkCreate([input(), input({ threadId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new ChatthreadsPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ threadId: 'second' })?.threadId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ participantIds: 'secondary' })).toBe(2);
  });

  it('validates and duplicates chatThreads', () => {
    const service = new ChatthreadsService(new ChatthreadsPersistence());
    expect(service.validate({ threadId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('threadId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports chatThreads maintenance', () => {
    const store = new ChatthreadsPersistence();
    const service = new ChatthreadsService(store);
    const created = service.bulkCreate([input(), input({ threadId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('threadId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ threadId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves chatThreads transfer requests', () => {
    const service = new ChatthreadsService(new ChatthreadsPersistence());
    const created = handleChatthreads(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleChatthreads(service, { action: 'export' }).data as string;
    expect(handleChatthreads(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleChatthreads(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps chatThreads selections stable', () => {
    const store = new ChatthreadsPersistence();
    const service = new ChatthreadsService(store);
    const rows = service.bulkCreate([input(), input({ threadId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ threadId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleChatthreads(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleChatthreads(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ threadId: 'absent' })).toThrow('not found');
  });

  it('counts recent chatThreads', () => {
    const service = new ChatthreadsService(new ChatthreadsPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.threadId).toBe('primary');
  });

