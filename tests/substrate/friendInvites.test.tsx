import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { FriendinvitesPanel } from '../../app/substrate/friendInvites/Panel';
import { handleFriendinvites } from '../../app/substrate/friendInvites/handler';
import { FriendinvitesPersistence } from '../../app/substrate/friendInvites/persistence';
import { FriendinvitesService, type FriendinvitesInput } from '../../app/substrate/friendInvites/service';

const input = (overrides: Partial<FriendinvitesInput> = {}): FriendinvitesInput => ({
  inviteId: 'primary',
  senderId: 'secondary',
  recipientId: 'tertiary',
  status: 'quaternary',
  ...overrides,
});

  it('persists friend invites', () => {
    const store = new FriendinvitesPersistence();
    const service = new FriendinvitesService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ inviteId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { status: 'changed' }, 200).status).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles friend invites requests', () => {
    const service = new FriendinvitesService(new FriendinvitesPersistence());
    const created = handleFriendinvites(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleFriendinvites(service, { action: 'get', id }).status).toBe(200);
    expect(handleFriendinvites(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleFriendinvites(service, { action: 'update', id, patch: { recipientId: 'revised' } }).status).toBe(200);
    expect(handleFriendinvites(service, { action: 'list' }).status).toBe(200);
    expect(handleFriendinvites(service, { action: 'delete', id }).status).toBe(200);
    expect(handleFriendinvites(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleFriendinvites(service, { action: 'create', input: input({ inviteId: '' }) }).status).toBe(400);
  });

  it('renders friend invites state', () => {
    const service = new FriendinvitesService(new FriendinvitesPersistence());
    const record = service.create(input({ inviteId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<FriendinvitesPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips friendInvites', () => {
    const first = new FriendinvitesPersistence();
    const service = new FriendinvitesService(first);
    service.bulkCreate([input(), input({ inviteId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new FriendinvitesPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ inviteId: 'second' })?.inviteId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ senderId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates friendInvites', () => {
    const service = new FriendinvitesService(new FriendinvitesPersistence());
    expect(service.validate({ inviteId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('inviteId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports friendInvites maintenance', () => {
    const store = new FriendinvitesPersistence();
    const service = new FriendinvitesService(store);
    const created = service.bulkCreate([input(), input({ inviteId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('inviteId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ inviteId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves friendInvites transfer requests', () => {
    const service = new FriendinvitesService(new FriendinvitesPersistence());
    const created = handleFriendinvites(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleFriendinvites(service, { action: 'export' }).data as string;
    expect(handleFriendinvites(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleFriendinvites(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps friendInvites selections stable', () => {
    const store = new FriendinvitesPersistence();
    const service = new FriendinvitesService(store);
    const rows = service.bulkCreate([input(), input({ inviteId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ inviteId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleFriendinvites(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleFriendinvites(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ inviteId: 'absent' })).toThrow('not found');
  });

  it('counts recent friendInvites', () => {
    const service = new FriendinvitesService(new FriendinvitesPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.inviteId).toBe('primary');
  });

