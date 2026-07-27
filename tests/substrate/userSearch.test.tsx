import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { UsersearchPanel } from '../../app/substrate/userSearch/Panel';
import { handleUsersearch } from '../../app/substrate/userSearch/handler';
import { UsersearchPersistence } from '../../app/substrate/userSearch/persistence';
import { UsersearchService, type UsersearchInput } from '../../app/substrate/userSearch/service';

const input = (overrides: Partial<UsersearchInput> = {}): UsersearchInput => ({
  userId: 'primary',
  displayName: 'secondary',
  handle: 'tertiary',
  score: 'quaternary',
  ...overrides,
});

describe('user search entries', () => {
  it('persists user search entries', () => {
    const store = new UsersearchPersistence();
    const service = new UsersearchService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ userId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { score: 'changed' }, 200).score).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles user search entries requests', () => {
    const service = new UsersearchService(new UsersearchPersistence());
    const created = handleUsersearch(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleUsersearch(service, { action: 'get', id }).status).toBe(200);
    expect(handleUsersearch(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleUsersearch(service, { action: 'update', id, patch: { handle: 'revised' } }).status).toBe(200);
    expect(handleUsersearch(service, { action: 'list' }).status).toBe(200);
    expect(handleUsersearch(service, { action: 'delete', id }).status).toBe(200);
    expect(handleUsersearch(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleUsersearch(service, { action: 'create', input: input({ userId: '' }) }).status).toBe(400);
  });

  it('renders user search entries state', () => {
    const service = new UsersearchService(new UsersearchPersistence());
    const record = service.create(input({ userId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<UsersearchPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips userSearch', () => {
    const first = new UsersearchPersistence();
    const service = new UsersearchService(first);
    service.bulkCreate([input(), input({ userId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new UsersearchPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ userId: 'second' })?.userId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ displayName: 'secondary' })).toBe(2);
  });

  it('validates and duplicates userSearch', () => {
    const service = new UsersearchService(new UsersearchPersistence());
    expect(service.validate({ userId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('userId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports userSearch maintenance', () => {
    const store = new UsersearchPersistence();
    const service = new UsersearchService(store);
    const created = service.bulkCreate([input(), input({ userId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('userId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ userId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves userSearch transfer requests', () => {
    const service = new UsersearchService(new UsersearchPersistence());
    const created = handleUsersearch(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleUsersearch(service, { action: 'export' }).data as string;
    expect(handleUsersearch(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleUsersearch(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps userSearch selections stable', () => {
    const store = new UsersearchPersistence();
    const service = new UsersearchService(store);
    const rows = service.bulkCreate([input(), input({ userId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ userId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleUsersearch(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleUsersearch(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ userId: 'absent' })).toThrow('not found');
  });

  it('counts recent userSearch', () => {
    const service = new UsersearchService(new UsersearchPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.userId).toBe('primary');
  });

});
