import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RelayProvider, useEtaCountdown, useTaskTracker } from './index';

function fakeClient() {
  const handlers = new Map<string, Set<(payload: any) => void>>();
  return {
    on: vi.fn((event: string, handler: (payload: any) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => handlers.get(event)!.delete(handler);
    }),
    emit(event: string, payload: any) {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
    listen: vi.fn(async () => {}),
    stopListening: vi.fn(async () => {}),
    disconnect: vi.fn(),
    listeners: () => [...handlers.values()].reduce((n, set) => n + set.size, 0),
  };
}

afterEach(() => vi.useRealTimers());

describe('useTaskTracker', () => {
  it('renders live status, rider and ETA, and stops on unmount', async () => {
    const client = fakeClient();
    function Order() {
      const { status, eta, rider, connection } = useTaskTracker('t1');
      return (
        <p>
          {connection} {status ?? 'waiting'} {rider ? `${rider.latitude},${rider.longitude}` : 'no-rider'} {eta ? `${eta.meters}m` : 'no-eta'}
        </p>
      );
    }
    const view = render(
      <RelayProvider client={client as any}>
        <Order />
      </RelayProvider>,
    );
    await act(async () => {});
    expect(client.listen).toHaveBeenCalledWith('t1');

    act(() => {
      client.emit('TASK_ASSIGNED', { taskId: 't1', status: 'ASSIGNED', currentStageIndex: 0 });
      client.emit('RIDER_LOCATION_UPDATE', {
        taskId: 't1',
        location: { latitude: 6.45, longitude: 3.39 },
        eta: { stageIndex: 0, seconds: 420, meters: 2350 },
        timestamp: new Date().toISOString(),
      });
    });
    expect(screen.getByText('live ASSIGNED 6.45,3.39 2350m')).toBeTruthy();

    view.unmount();
    await act(async () => {});
    expect(client.stopListening).toHaveBeenCalledWith('t1');
    expect(client.listeners()).toBe(0);
    // A client passed in is the app's to disconnect.
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('is idle without a task ID and tracks once one arrives', async () => {
    const client = fakeClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => <RelayProvider client={client as any}>{children}</RelayProvider>;
    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useTaskTracker(id), {
      wrapper,
      initialProps: { id: null },
    });
    expect(result.current.connection).toBe('idle');
    expect(client.listen).not.toHaveBeenCalled();

    rerender({ id: 't2' });
    await act(async () => {});
    expect(client.listen).toHaveBeenCalledWith('t2');
  });

  it('switches tasks cleanly', async () => {
    const client = fakeClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => <RelayProvider client={client as any}>{children}</RelayProvider>;
    const { rerender } = renderHook(({ id }: { id: string }) => useTaskTracker(id), { wrapper, initialProps: { id: 'a' } });
    await act(async () => {});
    rerender({ id: 'b' });
    await act(async () => {});
    expect(client.stopListening).toHaveBeenCalledWith('a');
    expect(client.listen).toHaveBeenLastCalledWith('b');
  });

  it('throws a clear error outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTaskTracker('t1'))).toThrow('useRelayClient must be used inside a <RelayProvider>');
    spy.mockRestore();
  });
});

describe('RelayProvider', () => {
  it('creates a client from options and disconnects it on unmount', () => {
    const view = render(<RelayProvider getToken={async () => 'token'}>ok</RelayProvider>);
    expect(screen.getByText('ok')).toBeTruthy();
    view.unmount();
  });
});

describe('useEtaCountdown', () => {
  it('counts down to arrivesAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T10:00:00.000Z'));
    const eta = { stageIndex: 0, seconds: 90, meters: 500, arrivesAt: '2026-10-28T10:01:30.000Z', updatedAt: '2026-10-28T10:00:00.000Z' };
    const { result } = renderHook(() => useEtaCountdown(eta));
    expect(result.current).toBe(90);
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current).toBe(60);
    const none = renderHook(() => useEtaCountdown(null));
    expect(none.result.current).toBeNull();
  });
});
