import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { NotificationprefsPanel } from '../../app/substrate/notificationPrefs/Panel';
import { handleNotificationprefs } from '../../app/substrate/notificationPrefs/handler';
import { NotificationprefsPersistence } from '../../app/substrate/notificationPrefs/persistence';
import { NotificationprefsService, type NotificationprefsInput } from '../../app/substrate/notificationPrefs/service';

const input = (overrides: Partial<NotificationprefsInput> = {}): NotificationprefsInput => ({
  userId: 'primary',
  categories: 'secondary',
  quietHours: 'tertiary',
  enabled: 'quaternary',
  ...overrides,
});

describe('notification preferences', () => {
  it('persists notification preferences', () => {
    const store = new NotificationprefsPersistence();
    const service = new NotificationprefsService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ userId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { enabled: 'changed' }, 200).enabled).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles notification preferences requests', () => {
    const service = new NotificationprefsService(new NotificationprefsPersistence());
    const created = handleNotificationprefs(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleNotificationprefs(service, { action: 'get', id }).status).toBe(200);
    expect(handleNotificationprefs(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleNotificationprefs(service, { action: 'update', id, patch: { quietHours: 'revised' } }).status).toBe(200);
    expect(handleNotificationprefs(service, { action: 'list' }).status).toBe(200);
    expect(handleNotificationprefs(service, { action: 'delete', id }).status).toBe(200);
    expect(handleNotificationprefs(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleNotificationprefs(service, { action: 'create', input: input({ userId: '' }) }).status).toBe(400);
  });

  it('renders notification preferences state', () => {
    const service = new NotificationprefsService(new NotificationprefsPersistence());
    const record = service.create(input({ userId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<NotificationprefsPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips notificationPrefs', () => {
    const first = new NotificationprefsPersistence();
    const service = new NotificationprefsService(first);
    service.bulkCreate([input(), input({ userId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new NotificationprefsPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ userId: 'second' })?.userId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ categories: 'secondary' })).toBe(2);
  });

  it('validates and duplicates notificationPrefs', () => {
    const service = new NotificationprefsService(new NotificationprefsPersistence());
    expect(service.validate({ userId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('userId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports notificationPrefs maintenance', () => {
    const store = new NotificationprefsPersistence();
    const service = new NotificationprefsService(store);
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

  it('serves notificationPrefs transfer requests', () => {
    const service = new NotificationprefsService(new NotificationprefsPersistence());
    const created = handleNotificationprefs(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleNotificationprefs(service, { action: 'export' }).data as string;
    expect(handleNotificationprefs(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleNotificationprefs(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps notificationPrefs selections stable', () => {
    const store = new NotificationprefsPersistence();
    const service = new NotificationprefsService(store);
    const rows = service.bulkCreate([input(), input({ userId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ userId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleNotificationprefs(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleNotificationprefs(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ userId: 'absent' })).toThrow('not found');
  });

  it('counts recent notificationPrefs', () => {
    const service = new NotificationprefsService(new NotificationprefsPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.userId).toBe('primary');
  });

});
