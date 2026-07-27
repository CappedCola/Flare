import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { OfflineoutboxPanel } from '../../app/substrate/offlineOutbox/Panel';
import { handleOfflineoutbox } from '../../app/substrate/offlineOutbox/handler';
import { OfflineoutboxPersistence } from '../../app/substrate/offlineOutbox/persistence';
import { OfflineoutboxService, type OfflineoutboxInput } from '../../app/substrate/offlineOutbox/service';

const input = (overrides: Partial<OfflineoutboxInput> = {}): OfflineoutboxInput => ({
  operationId: 'primary',
  userId: 'secondary',
  kind: 'tertiary',
  payload: 'quaternary',
  ...overrides,
});

describe('offline outbox items', () => {
  it('persists offline outbox items', () => {
    const store = new OfflineoutboxPersistence();
    const service = new OfflineoutboxService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ operationId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { payload: 'changed' }, 200).payload).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles offline outbox items requests', () => {
    const service = new OfflineoutboxService(new OfflineoutboxPersistence());
    const created = handleOfflineoutbox(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleOfflineoutbox(service, { action: 'get', id }).status).toBe(200);
    expect(handleOfflineoutbox(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleOfflineoutbox(service, { action: 'update', id, patch: { kind: 'revised' } }).status).toBe(200);
    expect(handleOfflineoutbox(service, { action: 'list' }).status).toBe(200);
    expect(handleOfflineoutbox(service, { action: 'delete', id }).status).toBe(200);
    expect(handleOfflineoutbox(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleOfflineoutbox(service, { action: 'create', input: input({ operationId: '' }) }).status).toBe(400);
  });

  it('renders offline outbox items state', () => {
    const service = new OfflineoutboxService(new OfflineoutboxPersistence());
    const record = service.create(input({ operationId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<OfflineoutboxPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips offlineOutbox', () => {
    const first = new OfflineoutboxPersistence();
    const service = new OfflineoutboxService(first);
    service.bulkCreate([input(), input({ operationId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new OfflineoutboxPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ operationId: 'second' })?.operationId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ userId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates offlineOutbox', () => {
    const service = new OfflineoutboxService(new OfflineoutboxPersistence());
    expect(service.validate({ operationId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('operationId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports offlineOutbox maintenance', () => {
    const store = new OfflineoutboxPersistence();
    const service = new OfflineoutboxService(store);
    const created = service.bulkCreate([input(), input({ operationId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('operationId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ operationId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves offlineOutbox transfer requests', () => {
    const service = new OfflineoutboxService(new OfflineoutboxPersistence());
    const created = handleOfflineoutbox(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleOfflineoutbox(service, { action: 'export' }).data as string;
    expect(handleOfflineoutbox(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleOfflineoutbox(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps offlineOutbox selections stable', () => {
    const store = new OfflineoutboxPersistence();
    const service = new OfflineoutboxService(store);
    const rows = service.bulkCreate([input(), input({ operationId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ operationId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleOfflineoutbox(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleOfflineoutbox(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ operationId: 'absent' })).toThrow('not found');
  });

  it('counts recent offlineOutbox', () => {
    const service = new OfflineoutboxService(new OfflineoutboxPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.operationId).toBe('primary');
  });

});
