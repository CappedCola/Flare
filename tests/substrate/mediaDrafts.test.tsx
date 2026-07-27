import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MediadraftsPanel } from '../../app/substrate/mediaDrafts/Panel';
import { handleMediadrafts } from '../../app/substrate/mediaDrafts/handler';
import { MediadraftsPersistence } from '../../app/substrate/mediaDrafts/persistence';
import { MediadraftsService, type MediadraftsInput } from '../../app/substrate/mediaDrafts/service';

const input = (overrides: Partial<MediadraftsInput> = {}): MediadraftsInput => ({
  draftId: 'primary',
  userId: 'secondary',
  uri: 'tertiary',
  caption: 'quaternary',
  ...overrides,
});

describe('media drafts', () => {
  it('persists media drafts', () => {
    const store = new MediadraftsPersistence();
    const service = new MediadraftsService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ draftId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { caption: 'changed' }, 200).caption).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles media drafts requests', () => {
    const service = new MediadraftsService(new MediadraftsPersistence());
    const created = handleMediadrafts(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleMediadrafts(service, { action: 'get', id }).status).toBe(200);
    expect(handleMediadrafts(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleMediadrafts(service, { action: 'update', id, patch: { uri: 'revised' } }).status).toBe(200);
    expect(handleMediadrafts(service, { action: 'list' }).status).toBe(200);
    expect(handleMediadrafts(service, { action: 'delete', id }).status).toBe(200);
    expect(handleMediadrafts(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleMediadrafts(service, { action: 'create', input: input({ draftId: '' }) }).status).toBe(400);
  });

  it('renders media drafts state', async () => {
    const service = new MediadraftsService(new MediadraftsPersistence());
    const record = service.create(input({ draftId: 'visible' }));
    const selected: string[] = [];
    render(<MediadraftsPanel service={service} onSelect={(item) => selected.push(item.id)} />);
    await waitFor(() => expect(screen.getByText('1 media drafts')).toBeTruthy());
    fireEvent.press(screen.getByText('visible'));
    expect(selected).toEqual([record.id]);
    fireEvent.press(screen.getByText('Refresh'));
    expect(screen.getByText('1 media drafts')).toBeTruthy();
  });
  it('round trips mediaDrafts', () => {
    const first = new MediadraftsPersistence();
    const service = new MediadraftsService(first);
    service.bulkCreate([input(), input({ draftId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new MediadraftsPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ draftId: 'second' })?.draftId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ userId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates mediaDrafts', () => {
    const service = new MediadraftsService(new MediadraftsPersistence());
    expect(service.validate({ draftId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('draftId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports mediaDrafts maintenance', () => {
    const store = new MediadraftsPersistence();
    const service = new MediadraftsService(store);
    const created = service.bulkCreate([input(), input({ draftId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('draftId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ draftId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves mediaDrafts transfer requests', () => {
    const service = new MediadraftsService(new MediadraftsPersistence());
    const created = handleMediadrafts(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleMediadrafts(service, { action: 'export' }).data as string;
    expect(handleMediadrafts(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleMediadrafts(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps mediaDrafts selections stable', () => {
    const store = new MediadraftsPersistence();
    const service = new MediadraftsService(store);
    const rows = service.bulkCreate([input(), input({ draftId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ draftId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleMediadrafts(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleMediadrafts(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ draftId: 'absent' })).toThrow('not found');
  });

  it('counts recent mediaDrafts', () => {
    const service = new MediadraftsService(new MediadraftsPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.draftId).toBe('primary');
  });

});
