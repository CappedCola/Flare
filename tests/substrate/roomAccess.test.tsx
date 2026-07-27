import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { RoomaccessPanel } from '../../app/substrate/roomAccess/Panel';
import { handleRoomaccess } from '../../app/substrate/roomAccess/handler';
import { RoomaccessPersistence } from '../../app/substrate/roomAccess/persistence';
import { RoomaccessService, type RoomaccessInput } from '../../app/substrate/roomAccess/service';

const input = (overrides: Partial<RoomaccessInput> = {}): RoomaccessInput => ({
  roomId: 'primary',
  userId: 'secondary',
  role: 'tertiary',
  expiresAt: 'quaternary',
  ...overrides,
});

  it('persists room access grants', () => {
    const store = new RoomaccessPersistence();
    const service = new RoomaccessService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ roomId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { expiresAt: 'changed' }, 200).expiresAt).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles room access grants requests', () => {
    const service = new RoomaccessService(new RoomaccessPersistence());
    const created = handleRoomaccess(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleRoomaccess(service, { action: 'get', id }).status).toBe(200);
    expect(handleRoomaccess(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleRoomaccess(service, { action: 'update', id, patch: { role: 'revised' } }).status).toBe(200);
    expect(handleRoomaccess(service, { action: 'list' }).status).toBe(200);
    expect(handleRoomaccess(service, { action: 'delete', id }).status).toBe(200);
    expect(handleRoomaccess(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleRoomaccess(service, { action: 'create', input: input({ roomId: '' }) }).status).toBe(400);
  });

  it('renders room access grants state', () => {
    const service = new RoomaccessService(new RoomaccessPersistence());
    const record = service.create(input({ roomId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<RoomaccessPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips roomAccess', () => {
    const first = new RoomaccessPersistence();
    const service = new RoomaccessService(first);
    service.bulkCreate([input(), input({ roomId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new RoomaccessPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ roomId: 'second' })?.roomId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ userId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates roomAccess', () => {
    const service = new RoomaccessService(new RoomaccessPersistence());
    expect(service.validate({ roomId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('roomId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports roomAccess maintenance', () => {
    const store = new RoomaccessPersistence();
    const service = new RoomaccessService(store);
    const created = service.bulkCreate([input(), input({ roomId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('roomId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ roomId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves roomAccess transfer requests', () => {
    const service = new RoomaccessService(new RoomaccessPersistence());
    const created = handleRoomaccess(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleRoomaccess(service, { action: 'export' }).data as string;
    expect(handleRoomaccess(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleRoomaccess(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps roomAccess selections stable', () => {
    const store = new RoomaccessPersistence();
    const service = new RoomaccessService(store);
    const rows = service.bulkCreate([input(), input({ roomId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ roomId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleRoomaccess(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleRoomaccess(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ roomId: 'absent' })).toThrow('not found');
  });

  it('counts recent roomAccess', () => {
    const service = new RoomaccessService(new RoomaccessPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.roomId).toBe('primary');
  });

