import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DiscoveryfiltersPanel } from '../../app/substrate/discoveryFilters/Panel';
import { handleDiscoveryfilters } from '../../app/substrate/discoveryFilters/handler';
import { DiscoveryfiltersPersistence } from '../../app/substrate/discoveryFilters/persistence';
import { DiscoveryfiltersService, type DiscoveryfiltersInput } from '../../app/substrate/discoveryFilters/service';

const input = (overrides: Partial<DiscoveryfiltersInput> = {}): DiscoveryfiltersInput => ({
  query: 'primary',
  category: 'secondary',
  sort: 'tertiary',
  tags: 'quaternary',
  ...overrides,
});

  it('persists discovery filters', () => {
    const store = new DiscoveryfiltersPersistence();
    const service = new DiscoveryfiltersService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ query: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { tags: 'changed' }, 200).tags).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles discovery filters requests', () => {
    const service = new DiscoveryfiltersService(new DiscoveryfiltersPersistence());
    const created = handleDiscoveryfilters(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleDiscoveryfilters(service, { action: 'get', id }).status).toBe(200);
    expect(handleDiscoveryfilters(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleDiscoveryfilters(service, { action: 'update', id, patch: { sort: 'revised' } }).status).toBe(200);
    expect(handleDiscoveryfilters(service, { action: 'list' }).status).toBe(200);
    expect(handleDiscoveryfilters(service, { action: 'delete', id }).status).toBe(200);
    expect(handleDiscoveryfilters(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleDiscoveryfilters(service, { action: 'create', input: input({ query: '' }) }).status).toBe(400);
  });

  it('renders discovery filters state', () => {
    const service = new DiscoveryfiltersService(new DiscoveryfiltersPersistence());
    const record = service.create(input({ query: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<DiscoveryfiltersPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips discoveryFilters', () => {
    const first = new DiscoveryfiltersPersistence();
    const service = new DiscoveryfiltersService(first);
    service.bulkCreate([input(), input({ query: 'second' })], 300);
    const encoded = first.serialize();
    const second = new DiscoveryfiltersPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ query: 'second' })?.query).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ category: 'secondary' })).toBe(2);
  });

  it('validates and duplicates discoveryFilters', () => {
    const service = new DiscoveryfiltersService(new DiscoveryfiltersPersistence());
    expect(service.validate({ query: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('query', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports discoveryFilters maintenance', () => {
    const store = new DiscoveryfiltersPersistence();
    const service = new DiscoveryfiltersService(store);
    const created = service.bulkCreate([input(), input({ query: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('query', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ query: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves discoveryFilters transfer requests', () => {
    const service = new DiscoveryfiltersService(new DiscoveryfiltersPersistence());
    const created = handleDiscoveryfilters(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleDiscoveryfilters(service, { action: 'export' }).data as string;
    expect(handleDiscoveryfilters(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleDiscoveryfilters(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps discoveryFilters selections stable', () => {
    const store = new DiscoveryfiltersPersistence();
    const service = new DiscoveryfiltersService(store);
    const rows = service.bulkCreate([input(), input({ query: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ query: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleDiscoveryfilters(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleDiscoveryfilters(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ query: 'absent' })).toThrow('not found');
  });

  it('counts recent discoveryFilters', () => {
    const service = new DiscoveryfiltersService(new DiscoveryfiltersPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.query).toBe('primary');
  });

