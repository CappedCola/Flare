import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TimelineentriesPanel } from '../../app/substrate/timelineEntries/Panel';
import { handleTimelineentries } from '../../app/substrate/timelineEntries/handler';
import { TimelineentriesPersistence } from '../../app/substrate/timelineEntries/persistence';
import { TimelineentriesService, type TimelineentriesInput } from '../../app/substrate/timelineEntries/service';

const input = (overrides: Partial<TimelineentriesInput> = {}): TimelineentriesInput => ({
  entryId: 'primary',
  userId: 'secondary',
  kind: 'tertiary',
  body: 'quaternary',
  ...overrides,
});

describe('timeline entries', () => {
  it('persists timeline entries', () => {
    const store = new TimelineentriesPersistence();
    const service = new TimelineentriesService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ entryId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { body: 'changed' }, 200).body).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles timeline entries requests', () => {
    const service = new TimelineentriesService(new TimelineentriesPersistence());
    const created = handleTimelineentries(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleTimelineentries(service, { action: 'get', id }).status).toBe(200);
    expect(handleTimelineentries(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleTimelineentries(service, { action: 'update', id, patch: { kind: 'revised' } }).status).toBe(200);
    expect(handleTimelineentries(service, { action: 'list' }).status).toBe(200);
    expect(handleTimelineentries(service, { action: 'delete', id }).status).toBe(200);
    expect(handleTimelineentries(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleTimelineentries(service, { action: 'create', input: input({ entryId: '' }) }).status).toBe(400);
  });

  it('renders timeline entries state', async () => {
    const service = new TimelineentriesService(new TimelineentriesPersistence());
    const record = service.create(input({ entryId: 'visible' }));
    const selected: string[] = [];
    render(<TimelineentriesPanel service={service} onSelect={(item) => selected.push(item.id)} />);
    await waitFor(() => expect(screen.getByText('1 timeline entries')).toBeTruthy());
    act(() => { fireEvent.press(screen.getByText('visible')); });
    expect(selected).toEqual([record.id]);
    fireEvent.press(screen.getByText('Refresh'));
    expect(screen.getByText('1 timeline entries')).toBeTruthy();
  });
  it('round trips timelineEntries', () => {
    const first = new TimelineentriesPersistence();
    const service = new TimelineentriesService(first);
    service.bulkCreate([input(), input({ entryId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new TimelineentriesPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ entryId: 'second' })?.entryId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ userId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates timelineEntries', () => {
    const service = new TimelineentriesService(new TimelineentriesPersistence());
    expect(service.validate({ entryId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('entryId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports timelineEntries maintenance', () => {
    const store = new TimelineentriesPersistence();
    const service = new TimelineentriesService(store);
    const created = service.bulkCreate([input(), input({ entryId: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('entryId', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ entryId: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves timelineEntries transfer requests', () => {
    const service = new TimelineentriesService(new TimelineentriesPersistence());
    const created = handleTimelineentries(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleTimelineentries(service, { action: 'export' }).data as string;
    expect(handleTimelineentries(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleTimelineentries(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps timelineEntries selections stable', () => {
    const store = new TimelineentriesPersistence();
    const service = new TimelineentriesService(store);
    const rows = service.bulkCreate([input(), input({ entryId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ entryId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleTimelineentries(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleTimelineentries(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ entryId: 'absent' })).toThrow('not found');
  });

  it('counts recent timelineEntries', () => {
    const service = new TimelineentriesService(new TimelineentriesPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.entryId).toBe('primary');
  });

});
