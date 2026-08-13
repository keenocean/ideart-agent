import { and, eq, gt, isNull, lte, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { agentTurnLease, type AgentTurnLease } from '@/config/db/schema';

export const TURN_LEASE_TTL_MS = 60_000;
export const TURN_LEASE_RENEW_INTERVAL_MS = 20_000;

export class TurnExecutionAbortedError extends Error {
  constructor(message = 'Agent turn no longer owns its execution lease.') {
    super(message);
    this.name = 'AbortError';
  }
}

interface LeaseOwner {
  chatId: string;
  userId: string;
  turnId: string;
}

export async function getTurnLease(
  chatId: string
): Promise<AgentTurnLease | undefined> {
  const [lease] = await db()
    .select()
    .from(agentTurnLease)
    .where(eq(agentTurnLease.chatId, chatId))
    .limit(1);
  return lease;
}

export async function getActiveTurnLease(
  chatId: string
): Promise<AgentTurnLease | undefined> {
  const [lease] = await db()
    .select()
    .from(agentTurnLease)
    .where(
      and(
        eq(agentTurnLease.chatId, chatId),
        gt(agentTurnLease.expiresAt, databaseNow())
      )
    )
    .limit(1);
  return lease;
}

/** Insert a new owner or atomically replace an expired lease. */
export async function acquireTurnLease(
  owner: LeaseOwner,
  ttlMs = TURN_LEASE_TTL_MS
): Promise<boolean> {
  try {
    await db()
      .insert(agentTurnLease)
      .values({
        ...owner,
        expiresAt: databaseExpiry(ttlMs),
        cancelRequestedAt: null,
      });
  } catch (error) {
    const existing = await getTurnLease(owner.chatId);
    if (!existing) throw error;
  }

  let current = await getTurnLease(owner.chatId);
  if (current?.turnId === owner.turnId && current.userId === owner.userId) {
    return true;
  }
  if (!current || current.userId !== owner.userId) return false;

  await db()
    .update(agentTurnLease)
    .set({
      turnId: owner.turnId,
      expiresAt: databaseExpiry(ttlMs),
      cancelRequestedAt: null,
      updatedAt: databaseNow(),
    })
    .where(
      and(
        eq(agentTurnLease.chatId, owner.chatId),
        eq(agentTurnLease.userId, owner.userId),
        eq(agentTurnLease.turnId, current.turnId),
        lte(agentTurnLease.expiresAt, databaseNow())
      )
    );

  current = await getTurnLease(owner.chatId);
  return current?.turnId === owner.turnId && current.userId === owner.userId;
}

export async function renewTurnLease(
  owner: LeaseOwner,
  ttlMs = TURN_LEASE_TTL_MS
): Promise<boolean> {
  await db()
    .update(agentTurnLease)
    .set({
      expiresAt: databaseExpiry(ttlMs),
      updatedAt: databaseNow(),
    })
    .where(
      and(
        ownerFilter(owner),
        gt(agentTurnLease.expiresAt, databaseNow()),
        isNull(agentTurnLease.cancelRequestedAt)
      )
    );
  return hasTurnLeaseOwnership(owner);
}

export async function hasTurnLeaseOwnership(
  owner: LeaseOwner
): Promise<boolean> {
  const [lease] = await db()
    .select({ turnId: agentTurnLease.turnId })
    .from(agentTurnLease)
    .where(
      and(
        ownerFilter(owner),
        gt(agentTurnLease.expiresAt, databaseNow()),
        isNull(agentTurnLease.cancelRequestedAt)
      )
    )
    .limit(1);
  return lease?.turnId === owner.turnId;
}

export async function assertTurnLeaseOwnership(
  owner: LeaseOwner
): Promise<void> {
  if (!(await hasTurnLeaseOwnership(owner))) {
    throw new TurnExecutionAbortedError();
  }
}

export async function requestTurnCancellation(
  owner: LeaseOwner
): Promise<boolean> {
  await db()
    .update(agentTurnLease)
    .set({
      cancelRequestedAt: databaseNow(),
      updatedAt: databaseNow(),
    })
    .where(
      and(
        ownerFilter(owner),
        gt(agentTurnLease.expiresAt, databaseNow()),
        isNull(agentTurnLease.cancelRequestedAt)
      )
    );

  const current = await getTurnLease(owner.chatId);
  return Boolean(
    current?.userId === owner.userId &&
    current.turnId === owner.turnId &&
    current.cancelRequestedAt
  );
}

export async function releaseTurnLease(owner: LeaseOwner): Promise<void> {
  await db().delete(agentTurnLease).where(ownerFilter(owner));
}

function ownerFilter(owner: LeaseOwner) {
  return and(
    eq(agentTurnLease.chatId, owner.chatId),
    eq(agentTurnLease.userId, owner.userId),
    eq(agentTurnLease.turnId, owner.turnId)
  );
}

function databaseNow() {
  const provider = envConfigs.database_provider;
  if (provider === 'sqlite' || provider === 'd1' || provider === 'turso') {
    return sql`CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)`;
  }
  if (provider === 'mysql') return sql`CURRENT_TIMESTAMP(3)`;
  return sql`CURRENT_TIMESTAMP`;
}

function databaseExpiry(ttlMs: number) {
  const provider = envConfigs.database_provider;
  if (provider === 'sqlite' || provider === 'd1' || provider === 'turso') {
    return sql`CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) + ${ttlMs}`;
  }
  if (provider === 'mysql') {
    return sql`TIMESTAMPADD(MICROSECOND, ${ttlMs * 1000}, CURRENT_TIMESTAMP(3))`;
  }
  return sql`CURRENT_TIMESTAMP + (${ttlMs} * INTERVAL '1 millisecond')`;
}
