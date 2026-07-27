import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AchievementledgerPanel } from '../../app/substrate/achievementLedger/Panel';
import { handleAchievementledger } from '../../app/substrate/achievementLedger/handler';
import { AchievementledgerPersistence } from '../../app/substrate/achievementLedger/persistence';
import { AchievementledgerService, type AchievementledgerInput } from '../../app/substrate/achievementLedger/service';

const input = (overrides: Partial<AchievementledgerInput> = {}): AchievementledgerInput => ({
  userId: 'primary',
  code: 'secondary',
  points: 'tertiary',
  awardedAt: 'quaternary',
  ...overrides,
});

  it('persists achievement ledger', () => {
    const store = new AchievementledgerPersistence();
    const service = new AchievementledgerService(store);
    const created = service.create(input(), 100);
    expect(store.find(created.id)).toEqual(created);
    expect(service.search({ userId: 'primary' })).toHaveLength(1);
    expect(service.summary().total).toBe(1);
    expect(service.update(created.id, { awardedAt: 'changed' }, 200).awardedAt).toBe('changed');
    expect(service.delete(created.id)).toBe(true);
    expect(service.delete(created.id)).toBe(false);
  });

  it('handles achievement ledger requests', () => {
    const service = new AchievementledgerService(new AchievementledgerPersistence());
    const created = handleAchievementledger(service, { action: 'create', input: input() });
    expect(created.status).toBe(201);
    const id = (created.data as { id: string }).id;
    expect(handleAchievementledger(service, { action: 'get', id }).status).toBe(200);
    expect(handleAchievementledger(service, { action: 'get', id: 'missing' }).status).toBe(404);
    expect(handleAchievementledger(service, { action: 'update', id, patch: { points: 'revised' } }).status).toBe(200);
    expect(handleAchievementledger(service, { action: 'list' }).status).toBe(200);
    expect(handleAchievementledger(service, { action: 'delete', id }).status).toBe(200);
    expect(handleAchievementledger(service, { action: 'update', id: 'missing', patch: {} }).status).toBe(404);
    expect(handleAchievementledger(service, { action: 'create', input: input({ userId: '' }) }).status).toBe(400);
  });

  it('renders achievement ledger state', () => {
    const service = new AchievementledgerService(new AchievementledgerPersistence());
    const record = service.create(input({ userId: 'visible' }));
    const selected: string[] = [];
    let tree: TestRenderer.ReactTestRenderer;
    act(() => { tree = TestRenderer.create(<AchievementledgerPanel service={service} onSelect={(item) => selected.push(item.id)} />); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
    act(() => { tree!.root.findByProps({ title: 'visible' }).props.onPress(); });
    expect(selected).toEqual([record.id]);
    act(() => { tree!.root.findByProps({ title: 'Refresh' }).props.onPress(); });
    expect(tree!.root.findAllByProps({ title: 'visible' })).toHaveLength(1);
  });
  it('round trips achievementLedger', () => {
    const first = new AchievementledgerPersistence();
    const service = new AchievementledgerService(first);
    service.bulkCreate([input(), input({ userId: 'second' })], 300);
    const encoded = first.serialize();
    const second = new AchievementledgerPersistence();
    second.restore(encoded);
    expect(second.count()).toBe(2);
    expect(second.findFirst({ userId: 'second' })?.userId).toBe('second');
    expect(second.list()[0].updatedAt).toBe(301);
    expect(second.removeWhere({ code: 'secondary' })).toBe(2);
  });

  it('validates and duplicates achievementLedger', () => {
    const service = new AchievementledgerService(new AchievementledgerPersistence());
    expect(service.validate({ userId: '' })).toHaveLength(4);
    const record = service.create(input(), 400);
    const copy = service.duplicate(record.id, 500);
    expect(copy.id).not.toBe(record.id);
    expect(service.listBy('userId', 'primary')).toHaveLength(2);
    expect(service.metrics()).toEqual({ total: 2, distinctFirst: 1, newestAt: 500 });
  });

  it('supports achievementLedger maintenance', () => {
    const store = new AchievementledgerPersistence();
    const service = new AchievementledgerService(store);
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

  it('serves achievementLedger transfer requests', () => {
    const service = new AchievementledgerService(new AchievementledgerPersistence());
    const created = handleAchievementledger(service, { action: 'bulk-create', inputs: [input()] });
    expect(created.status).toBe(201);
    const encoded = handleAchievementledger(service, { action: 'export' }).data as string;
    expect(handleAchievementledger(service, { action: 'validate', input: input() }).status).toBe(200);
    expect(handleAchievementledger(service, { action: 'import', serialized: encoded }).status).toBe(200);
  });

  it('keeps achievementLedger selections stable', () => {
    const store = new AchievementledgerPersistence();
    const service = new AchievementledgerService(store);
    const rows = service.bulkCreate([input(), input({ userId: 'other' })], 800);
    expect(service.require(rows[0].id).id).toBe(rows[0].id);
    expect(store.firstOrThrow({ userId: 'primary' }).id).toBe(rows[0].id);
    expect(service.compact()).toHaveLength(2);
    expect(handleAchievementledger(service, { action: 'exists', id: rows[0].id }).status).toBe(200);
    expect(handleAchievementledger(service, { action: 'exists', id: 'absent' }).status).toBe(200);
    expect(() => service.require('absent')).toThrow('not found');
    expect(() => store.firstOrThrow({ userId: 'absent' })).toThrow('not found');
  });

  it('counts recent achievementLedger', () => {
    const service = new AchievementledgerService(new AchievementledgerPersistence());
    const row = service.create(input(), 900);
    expect(service.search()).toHaveLength(1);
    expect(row.userId).toBe('primary');
  });

