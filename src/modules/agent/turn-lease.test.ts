import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  acquireTurnLease,
  getTurnLease,
  hasTurnLeaseOwnership,
  releaseTurnLease,
  renewTurnLease,
  requestTurnCancellation,
} from './turn-lease';

const state = vi.hoisted(() => ({
  client: null as any,
  database: null as any,
}));

vi.mock('@/config', () => ({
  envConfigs: { database_provider: 'sqlite' },
}));

vi.mock('@/core/db', async () => {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  state.client = createClient({ url: 'file::memory:' });
  state.database = drizzle(state.client);
  return { db: () => state.database };
});

describe('database-backed Agent turn lease', () => {
  beforeEach(async () => {
    await state.client.executeMultiple(`
      PRAGMA foreign_keys = ON;
      DROP TABLE IF EXISTS agent_turn_lease;
      DROP TABLE IF EXISTS user;
      CREATE TABLE user (id text PRIMARY KEY NOT NULL);
      CREATE TABLE agent_turn_lease (
        chat_id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        turn_id text NOT NULL,
        expires_at integer NOT NULL,
        cancel_requested_at integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
      INSERT INTO user (id) VALUES ('user-1');
    `);
  });

  it('allows only one owner for the same chat while different chats proceed', async () => {
    const first = { chatId: 'chat-1', userId: 'user-1', turnId: 'turn-1' };
    const second = { chatId: 'chat-1', userId: 'user-1', turnId: 'turn-2' };

    await expect(acquireTurnLease(first)).resolves.toBe(true);
    await expect(acquireTurnLease(second)).resolves.toBe(false);
    await expect(
      acquireTurnLease({ ...second, chatId: 'chat-2' })
    ).resolves.toBe(true);
  });

  it('reclaims only an expired owner and rejects stale renew/release calls', async () => {
    const oldOwner = {
      chatId: 'chat-1',
      userId: 'user-1',
      turnId: 'turn-old',
    };
    const newOwner = { ...oldOwner, turnId: 'turn-new' };
    expect(await acquireTurnLease(oldOwner)).toBe(true);
    await state.client.execute({
      sql: 'UPDATE agent_turn_lease SET expires_at = 0 WHERE chat_id = ?',
      args: ['chat-1'],
    });

    expect(await acquireTurnLease(newOwner)).toBe(true);
    expect(await renewTurnLease(oldOwner)).toBe(false);
    await releaseTurnLease(oldOwner);
    expect((await getTurnLease('chat-1'))?.turnId).toBe('turn-new');
  });

  it('uses compare-and-set cancellation and makes the canceled owner fail closed', async () => {
    const owner = { chatId: 'chat-1', userId: 'user-1', turnId: 'turn-1' };
    expect(await acquireTurnLease(owner)).toBe(true);
    expect(await hasTurnLeaseOwnership(owner)).toBe(true);

    expect(await requestTurnCancellation(owner)).toBe(true);
    expect(await hasTurnLeaseOwnership(owner)).toBe(false);
    expect(
      await requestTurnCancellation({ ...owner, turnId: 'turn-other' })
    ).toBe(false);
  });
});
