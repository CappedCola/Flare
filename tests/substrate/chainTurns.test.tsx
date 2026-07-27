import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ChainturnsPanel } from '../../app/substrate/chainTurns/Panel';
import { handleChainturns } from '../../app/substrate/chainTurns/handler';
import { ChainturnsPersistence } from '../../app/substrate/chainTurns/persistence';
import { ChainturnsService, type ChainturnsInput } from '../../app/substrate/chainTurns/service';

const input = (overrides: Partial<ChainturnsInput> = {}): ChainturnsInput => ({
  chainId: 'primary',
  authorId: 'secondary',
  text: 'tertiary',
  state: 'quaternary',
  ...overrides,
});

  it('persists chain turns', () => {
    const store = new ChainturnsPersistence();
    const service = new ChainturnsService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ chainId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { state: 'changed' }, 200).state).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles chain turns requests', () => {
    const service = new ChainturnsService(new ChainturnsPersistence());
    const created = handleChainturns(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleChainturns(service, { action: 'get', id }).status).toBe(200);
    expect(handleChainturns(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleChainturns(service, { action: 'update', id, patch: { text: 'revised' } }).status).toBe(200);
    expect(handleChainturns(service, { action: 'list' }).status).toBe(200);
    expect(handleChainturns(service, { action: 'delete', id }).status).toBe(200);
    expect(handleChainturns(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleChainturns(service, { action: 'create', input: input({ chainId: '' }) }).status).toBe(400);
  });

  it('renders chain turns state', () => {
    const service = new ChainturnsService(new ChainturnsPersistence());
    const record = service.create(input({ chainId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<ChainturnsPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips chainTurns', () => {
    const first = new ChainturnsPersistence();
    const service = new ChainturnsService(first);
    service.bulkCreate([input(), input({ chainId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new ChainturnsPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ chainId: 'second' })?.chainId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ authorId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates chainTurns', () => {
    const service = new ChainturnsService(new ChainturnsPersistence());
    expect(service.validate({ chainId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('chainId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports chainTurns maintenance', () => {
    const store = new ChainturnsPersistence();
    const service = new ChainturnsService(store);
    const created = service.bulkCreate([input(), input({ chainId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('chainId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ chainId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves chainTurns transfer requests', () => {
    const service = new ChainturnsService(new ChainturnsPersistence());
    const created = handleChainturns(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleChainturns(service, { action: 'export' }).data as string;
    expect(handleChainturns(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleChainturns(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps chainTurns selections stable', () => {
    const store = new ChainturnsPersistence();
    const service = new ChainturnsService(store);
    const rows = service.bulkCreate([input(), input({ chainId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ chainId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleChainturns(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleChainturns(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ chainId: 'absent' })).toThrow('not found');
  });

  it('counts recent chainTurns', () => {
    const service = new ChainturnsService(new ChainturnsPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.chainId).toBe('primary');
  });

