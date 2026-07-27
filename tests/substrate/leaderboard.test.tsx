import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { LeaderboardPanel } from '../../app/substrate/leaderboard/Panel';
import { handleLeaderboard } from '../../app/substrate/leaderboard/handler';
import { LeaderboardPersistence } from '../../app/substrate/leaderboard/persistence';
import { LeaderboardService, type LeaderboardInput } from '../../app/substrate/leaderboard/service';

const input = (overrides: Partial<LeaderboardInput> = {}): LeaderboardInput => ({
  season: 'primary',
  userId: 'secondary',
  score: 'tertiary',
  rank: 'quaternary',
  ...overrides,
});

  it('persists leaderboard entries', () => {
    const store = new LeaderboardPersistence();
    const service = new LeaderboardService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ season: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { rank: 'changed' }, 200).rank).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles leaderboard entries requests', () => {
    const service = new LeaderboardService(new LeaderboardPersistence());
    const created = handleLeaderboard(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleLeaderboard(service, { action: 'get', id }).status).toBe(200);
    expect(handleLeaderboard(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleLeaderboard(service, { action: 'update', id, patch: { score: 'revised' } }).status).toBe(200);
    expect(handleLeaderboard(service, { action: 'list' }).status).toBe(200);
    expect(handleLeaderboard(service, { action: 'delete', id }).status).toBe(200);
    expect(handleLeaderboard(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleLeaderboard(service, { action: 'create', input: input({ season: '' }) }).status).toBe(400);
  });

  it('renders leaderboard entries state', () => {
    const service = new LeaderboardService(new LeaderboardPersistence());
    const record = service.create(input({ season: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<LeaderboardPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips leaderboard', () => {
    const first = new LeaderboardPersistence();
    const service = new LeaderboardService(first);
    service.bulkCreate([input(), input({ season: 'second' })], 300);
    const encoded = first.serialize();
    const second = new LeaderboardPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ season: 'second' })?.season).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ userId: 'secondary' })).toBe(2);
  });

  it('validates and duplicates leaderboard', () => {
    const service = new LeaderboardService(new LeaderboardPersistence());
    expect(service.validate({ season: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('season', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports leaderboard maintenance', () => {
    const store = new LeaderboardPersistence();
    const service = new LeaderboardService(store);
    const created = service.bulkCreate([input(), input({ season: 'other' })], 600);
    expect(store.findByIds([created[0].id, 'unknown'])).toHaveLength(1);
    expect(store.countBy('season', 'primary')).toBe(1);
    expect(service.exists(created[0].id)).toBe(true);
    expect(store.touch(created[0].id, 700)?.updatedAt).toBe(700);
    expect(service.deleteMany({ season: 'other' })).toBe(1);
    const encoded = service.exportData();
    store.clear();
    expect(service.importData(encoded)).toBe(1);
    expect(() => store.restore('null')).toThrow('serialized');
  });

  it('serves leaderboard transfer requests', () => {
    const service = new LeaderboardService(new LeaderboardPersistence());
    const created = handleLeaderboard(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleLeaderboard(service, { action: 'export' }).data as string;
    expect(handleLeaderboard(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleLeaderboard(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps leaderboard selections stable', () => {
    const store = new LeaderboardPersistence();
    const service = new LeaderboardService(store);
    const rows = service.bulkCreate([input(), input({ season: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ season: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleLeaderboard(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleLeaderboard(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ season: 'absent' })).toThrow('not found');
  });

  it('counts recent leaderboard', () => {
    const service = new LeaderboardService(new LeaderboardPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.season).toBe('primary');
  });

