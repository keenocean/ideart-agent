import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cancelGenerationsForSession, createAgentTools } from './tools';

const mocks = vi.hoisted(() => ({
  assertTurnLeaseOwnership: vi.fn(),
  createImageProvider: vi.fn(),
  createTask: vi.fn(),
  generate: vi.fn(),
  getActiveTasksForSession: vi.fn(),
  getActiveTurnLease: vi.fn(),
  taskTurnId: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: vi.fn(async () => ({ fal_api_key: 'test-key' })),
}));
vi.mock('@/modules/storage/service', () => ({
  getStorage: vi.fn(async () => ({
    uploadFile: vi.fn(),
    getProviderNames: vi.fn(() => ['test']),
  })),
}));
vi.mock('@/modules/ai-tasks/service', () => ({
  AITaskStatus: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELED: 'canceled',
  },
  createTask: mocks.createTask,
  findTask: vi.fn(),
  getActiveTasksForSession: mocks.getActiveTasksForSession,
  markTaskProcessing: vi.fn(),
  taskTurnId: mocks.taskTurnId,
  updateTask: mocks.updateTask,
}));
vi.mock('./image-provider', () => ({
  createImageProvider: mocks.createImageProvider,
  imageProviderOptionsFor: vi.fn(() => ({
    aspect_ratio: '1:1',
    resolution: '1K',
    quality: 'medium',
    n: 1,
  })),
  imageProviderOptionsForProvider: vi.fn((_, options) => options),
  pickImageProvider: vi.fn(() => 'fal'),
  resolveImageProviderModel: vi.fn(() => 'fal-image-model'),
}));
vi.mock('./turn-lease', () => ({
  assertTurnLeaseOwnership: mocks.assertTurnLeaseOwnership,
  getActiveTurnLease: mocks.getActiveTurnLease,
}));

describe('media tool lease ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createTask.mockResolvedValue({ id: 'task-1' });
    mocks.updateTask.mockResolvedValue({ status: 'failed' });
    mocks.createImageProvider.mockReturnValue({ generate: mocks.generate });
    mocks.assertTurnLeaseOwnership
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('lease ownership lost'));
  });

  it('refunds the durable task and never calls the provider after ownership is lost', async () => {
    const [tool] = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      turnId: 'turn-1',
      requireTurnLease: true,
      settings: { mediaMode: 'image' },
    });

    await tool.call({ prompt: 'draw a cat' }, { cwd: '/' });

    expect(mocks.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          sessionId: 'session-1',
          turnId: 'turn-1',
        }),
      })
    );
    expect(mocks.assertTurnLeaseOwnership).toHaveBeenCalledTimes(2);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.updateTask).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 'task-1', status: 'failed' })
    );
  });

  it('does not let orphan cleanup cancel a task protected by a new lease', async () => {
    const task = { id: 'task-new', options: '{}' };
    mocks.getActiveTasksForSession.mockResolvedValue([task]);
    mocks.getActiveTurnLease.mockResolvedValue({
      userId: 'user-1',
      turnId: 'turn-new',
    });
    mocks.taskTurnId.mockReturnValue('turn-new');

    await expect(
      cancelGenerationsForSession({
        userId: 'user-1',
        sessionId: 'session-1',
      })
    ).resolves.toEqual({ canceled: 0, upstreamCanceled: 0 });
    expect(mocks.updateTask).not.toHaveBeenCalled();
  });
});
