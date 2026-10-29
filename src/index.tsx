/**
 * Official Relay React bindings: put a `RelayProvider` near the top of your app and call
 * `useTaskTracker(taskId)` wherever you show a delivery.
 *
 * Built on `@relay-sdk/sdk-browser`. Every framework binding wraps the same `createTaskTracker`
 * store, so React, Vue, Svelte and React Native behave identically.
 *
 * @packageDocumentation
 */

import {
  RelayRealtimeClient,
  createTaskTracker,
  type RelayRealtimeClientOptions,
  type TaskTrackerOptions,
  type TaskTrackerState,
} from '@relay-sdk/sdk-browser';
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

export * from '@relay-sdk/sdk-browser';

const RelayContext = createContext<RelayRealtimeClient | null>(null);

export type RelayProviderProps =
  | { client: RelayRealtimeClient; children?: ReactNode }
  | (RelayRealtimeClientOptions & { client?: undefined; children?: ReactNode });

/**
 * Makes one realtime client available to every hook below it.
 *
 * Pass your own `client`, or the client options (at least `getToken`) and the provider creates
 * one and disconnects it on unmount.
 *
 * @example
 * ```tsx
 * <RelayProvider getToken={(taskIds) => fetchTrackingToken(taskIds)}>
 *   <OrderPage />
 * </RelayProvider>
 * ```
 */
export function RelayProvider(props: RelayProviderProps) {
  const { children, client: given, ...options } = props;
  const [owned] = useState(() => (given ? null : new RelayRealtimeClient(options as RelayRealtimeClientOptions)));
  const client = given ?? owned!;

  useEffect(() => (owned ? () => owned.disconnect() : undefined), [owned]);

  return <RelayContext.Provider value={client}>{children}</RelayContext.Provider>;
}

/** The realtime client from the nearest `RelayProvider`. */
export function useRelayClient(): RelayRealtimeClient {
  const client = useContext(RelayContext);
  if (!client) throw new Error('useRelayClient must be used inside a <RelayProvider>');
  return client;
}

export interface UseTaskTrackerOptions extends TaskTrackerOptions {
  /** Set false to pause tracking without unmounting (default true). */
  enabled?: boolean;
}

/** State returned before a task ID is known, or while tracking is disabled. */
export function idleTrackerState(taskId = ''): TaskTrackerState {
  return {
    taskId,
    connection: 'idle',
    status: null,
    currentStageIndex: null,
    rider: null,
    eta: null,
    events: [],
    finished: false,
    error: null,
  };
}

/**
 * Live status, rider position and ETA for one task. Re-renders on every change and stops
 * listening on unmount or when `taskId` changes.
 *
 * @example
 * ```tsx
 * const { status, rider, eta, connection } = useTaskTracker(order.relayTaskId);
 * ```
 */
export function useTaskTracker(taskId: string | null | undefined, options: UseTaskTrackerOptions = {}): TaskTrackerState {
  const client = useRelayClient();
  const { enabled = true, ...trackerOptions } = options;
  // Options seed a tracker; they are read when the task (or client) changes, not on every render.
  const tracker = useMemo(
    () => (taskId ? createTaskTracker(client, taskId, trackerOptions) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, taskId],
  );

  useEffect(() => {
    if (!tracker || !enabled) return;
    void tracker.start();
    return () => void tracker.stop();
  }, [tracker, enabled]);

  const idle = useMemo(() => idleTrackerState(taskId ?? ''), [taskId]);
  return useSyncExternalStore(
    tracker ? tracker.subscribe : noopSubscribe,
    tracker ? tracker.getState : () => idle,
    tracker ? tracker.getState : () => idle,
  );
}

/**
 * Seconds left until `eta.arrivesAt`, ticking once a second. Null when there's no ETA.
 *
 * @example
 * ```tsx
 * const { eta } = useTaskTracker(taskId);
 * const secondsLeft = useEtaCountdown(eta);
 * ```
 */
export function useEtaCountdown(eta: TaskTrackerState['eta']): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!eta) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [eta]);
  return eta ? Math.max(0, Math.round((Date.parse(eta.arrivesAt) - now) / 1000)) : null;
}

const noopSubscribe = () => () => {};
