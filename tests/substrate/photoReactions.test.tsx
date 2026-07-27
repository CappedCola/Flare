import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PhotoreactionsPanel } from '../../app/substrate/photoReactions/Panel';
import { handlePhotoreactions } from '../../app/substrate/photoReactions/handler';
import { PhotoreactionsPersistence } from '../../app/substrate/photoReactions/persistence';
import { PhotoreactionsService, type PhotoreactionsInput } from '../../app/substrate/photoReactions/service';

const input = (overrides: Partial<PhotoreactionsInput> = {}): PhotoreactionsInput => ({
  photoId: 'primary',
  userId: 'secondary',
  reaction: 'tertiary',
  occurredAt: 'quaternary',
  ...overrides,
});

  it('persists photo reactions', () => {
    const store = new PhotoreactionsPersistence();
    const service = new PhotoreactionsService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ photoId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { occurredAt: 'changed' }, 200).occurredAt).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles photo reactions requests', () => {
    const service = new PhotoreactionsService(new PhotoreactionsPersistence());
    const created = handlePhotoreactions(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handlePhotoreactions(service, { action: 'get', id }).status).toBe(200);
    expect(handlePhotoreactions(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handlePhotoreactions(service, { action: 'update', id, patch: { reaction: 'revised' } }).status).toBe(200);
    expect(handlePhotoreactions(service, { action: 'list' }).status).toBe(200);
    expect(handlePhotoreactions(service, { action: 'delete', id }).status).toBe(200);
    expect(handlePhotoreactions(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handlePhotoreactions(service, { action: 'create', input: input({ photoId: '' }) }).status).toBe(400);
  });

  it('renders photo reactions state', () => {
    const service = new PhotoreactionsService(new PhotoreactionsPersistence());
    const record = service.create(input({ photoId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<PhotoreactionsPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips photoReactions', () => {
    const first = new PhotoreactionsPersistence();
    const service = new PhotoreactionsService(first);
    service.bulkCreate([input(), input({ photoId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new PhotoreactionsPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ photoId: 'second' })?.photoId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ userId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates photoReactions', () => {
    const service = new PhotoreactionsService(new PhotoreactionsPersistence());
    expect(service.validate({ photoId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('photoId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports photoReactions maintenance', () => {
    const store = new PhotoreactionsPersistence();
    const service = new PhotoreactionsService(store);
    const created = service.bulkCreate([input(), input({ photoId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('photoId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ photoId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves photoReactions transfer requests', () => {
    const service = new PhotoreactionsService(new PhotoreactionsPersistence());
    const created = handlePhotoreactions(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handlePhotoreactions(service, { action: 'export' }).data as string;
    expect(handlePhotoreactions(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handlePhotoreactions(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps photoReactions selections stable', () => {
    const store = new PhotoreactionsPersistence();
    const service = new PhotoreactionsService(store);
    const rows = service.bulkCreate([input(), input({ photoId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ photoId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handlePhotoreactions(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handlePhotoreactions(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ photoId: 'absent' })).toThrow('not found');
  });

  it('counts recent photoReactions', () => {
    const service = new PhotoreactionsService(new PhotoreactionsPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.photoId).toBe('primary');
  });

