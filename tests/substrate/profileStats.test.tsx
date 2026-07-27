import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProfilestatsPanel } from '../../app/substrate/profileStats/Panel';
import { handleProfilestats } from '../../app/substrate/profileStats/handler';
import { ProfilestatsPersistence } from '../../app/substrate/profileStats/persistence';
import { ProfilestatsService, type ProfilestatsInput } from '../../app/substrate/profileStats/service';

const input = (overrides: Partial<ProfilestatsInput> = {}): ProfilestatsInput => ({
  userId: 'primary',
  posts: 'secondary',
  followers: 'tertiary',
  streak: 'quaternary',
  ...overrides,
});

describe('profile stats', () => {
  it('persists profile stats', () => {
    const store = new ProfilestatsPersistence();
    const service = new ProfilestatsService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ userId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { streak: 'changed' }, 200).streak).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles profile stats requests', () => {
    const service = new ProfilestatsService(new ProfilestatsPersistence());
    const created = handleProfilestats(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleProfilestats(service, { action: 'get', id }).status).toBe(200);
    expect(handleProfilestats(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleProfilestats(service, { action: 'update', id, patch: { followers: 'revised' } }).status).toBe(200);
    expect(handleProfilestats(service, { action: 'list' }).status).toBe(200);
    expect(handleProfilestats(service, { action: 'delete', id }).status).toBe(200);
    expect(handleProfilestats(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleProfilestats(service, { action: 'create', input: input({ userId: '' }) }).status).toBe(400);
  });

  it('renders profile stats state', async () => {
    const service = new ProfilestatsService(new ProfilestatsPersistence());
    const record = service.create(input({ userId: 'visible' }));
    const selected: string[] = [];
    render(<ProfilestatsPanel service={service} onSelect={(item) => selected.push(item.id)} />);
    await waitFor(() => expect(screen.getByText('1 profile stats')).toBeTruthy());
    act(() => { fireEvent.press(screen.getByText('visible')); });
    expect(selected).toEqual([record.id]);
    fireEvent.press(screen.getByText('Refresh'));
    expect(screen.getByText('1 profile stats')).toBeTruthy();
  });
  it('round trips profileStats', () => {
    const first = new ProfilestatsPersistence();
    const service = new ProfilestatsService(first);
    service.bulkCreate([input(), input({ userId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new ProfilestatsPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ userId: 'second' })?.userId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ posts: 'secondary' })).toBe(2);
  });

  it('validates and duplicates profileStats', () => {
    const service = new ProfilestatsService(new ProfilestatsPersistence());
    expect(service.validate({ userId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('userId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports profileStats maintenance', () => {
    const store = new ProfilestatsPersistence();
    const service = new ProfilestatsService(store);
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

  it('serves profileStats transfer requests', () => {
    const service = new ProfilestatsService(new ProfilestatsPersistence());
    const created = handleProfilestats(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleProfilestats(service, { action: 'export' }).data as string;
    expect(handleProfilestats(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleProfilestats(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps profileStats selections stable', () => {
    const store = new ProfilestatsPersistence();
    const service = new ProfilestatsService(store);
    const rows = service.bulkCreate([input(), input({ userId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ userId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleProfilestats(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleProfilestats(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ userId: 'absent' })).toThrow('not found');
  });

  it('counts recent profileStats', () => {
    const service = new ProfilestatsService(new ProfilestatsPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.userId).toBe('primary');
  });

});
