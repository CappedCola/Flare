import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PromptqueuePanel } from '../../app/substrate/promptQueue/Panel';
import { handlePromptqueue } from '../../app/substrate/promptQueue/handler';
import { PromptqueuePersistence } from '../../app/substrate/promptQueue/persistence';
import { PromptqueueService, type PromptqueueInput } from '../../app/substrate/promptQueue/service';

const input = (overrides: Partial<PromptqueueInput> = {}): PromptqueueInput => ({
  promptId: 'primary',
  priority: 'secondary',
  status: 'tertiary',
  labels: 'quaternary',
  ...overrides,
});

describe('prompt queue', () => {
  it('persists prompt queue', () => {
    const store = new PromptqueuePersistence();
    const service = new PromptqueueService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ promptId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { labels: 'changed' }, 200).labels).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles prompt queue requests', () => {
    const service = new PromptqueueService(new PromptqueuePersistence());
    const created = handlePromptqueue(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handlePromptqueue(service, { action: 'get', id }).status).toBe(200);
    expect(handlePromptqueue(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handlePromptqueue(service, { action: 'update', id, patch: { status: 'revised' } }).status).toBe(200);
    expect(handlePromptqueue(service, { action: 'list' }).status).toBe(200);
    expect(handlePromptqueue(service, { action: 'delete', id }).status).toBe(200);
    expect(handlePromptqueue(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handlePromptqueue(service, { action: 'create', input: input({ promptId: '' }) }).status).toBe(400);
  });

  it('renders prompt queue state', async () => {
    const service = new PromptqueueService(new PromptqueuePersistence());
    const record = service.create(input({ promptId: 'visible' }));
    const selected: string[] = [];
    render(<PromptqueuePanel service={service} onSelect={(item) => selected.push(item.id)} />);
    await waitFor(() => expect(screen.getByText('1 prompt queue')).toBeTruthy());
    fireEvent.press(screen.getByText('visible'));
    expect(selected).toEqual([record.id]);
    fireEvent.press(screen.getByText('Refresh'));
    expect(screen.getByText('1 prompt queue')).toBeTruthy();
  });
  it('round trips promptQueue', () => {
    const first = new PromptqueuePersistence();
    const service = new PromptqueueService(first);
    service.bulkCreate([input(), input({ promptId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new PromptqueuePersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ promptId: 'second' })?.promptId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ priority: 'secondary' })).toBe(2);
  });

  it('validates and duplicates promptQueue', () => {
    const service = new PromptqueueService(new PromptqueuePersistence());
    expect(service.validate({ promptId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('promptId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports promptQueue maintenance', () => {
    const store = new PromptqueuePersistence();
    const service = new PromptqueueService(store);
    const created = service.bulkCreate([input(), input({ promptId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('promptId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ promptId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves promptQueue transfer requests', () => {
    const service = new PromptqueueService(new PromptqueuePersistence());
    const created = handlePromptqueue(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handlePromptqueue(service, { action: 'export' }).data as string;
    expect(handlePromptqueue(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handlePromptqueue(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps promptQueue selections stable', () => {
    const store = new PromptqueuePersistence();
    const service = new PromptqueueService(store);
    const rows = service.bulkCreate([input(), input({ promptId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ promptId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handlePromptqueue(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handlePromptqueue(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ promptId: 'absent' })).toThrow('not found');
  });

  it('counts recent promptQueue', () => {
    const service = new PromptqueueService(new PromptqueuePersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.promptId).toBe('primary');
  });

});
