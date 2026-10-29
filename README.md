# @relay-sdk/react

Official [Relay](https://sendrelay.com.ng) React bindings: show a delivery's status, the rider on a map and a live arrival time with one hook.

```bash
npm install @relay-sdk/react
```

```tsx
import { RelayProvider, useTaskTracker, useEtaCountdown } from '@relay-sdk/react';

// Your server mints the token with its API key (relay.auth.createWebSocketToken).
const getToken = async (taskIds: string[]) =>
  (await fetch('/api/relay/token', { method: 'POST', body: JSON.stringify({ taskIds }) }).then((r) => r.json())).token;

export function App() {
  return (
    <RelayProvider getToken={getToken}>
      <OrderTracking taskId="..." />
    </RelayProvider>
  );
}

function OrderTracking({ taskId }: { taskId: string }) {
  const { status, rider, eta, connection } = useTaskTracker(taskId);
  const secondsLeft = useEtaCountdown(eta);
  return (
    <p>
      {status ?? 'Finding a rider'}
      {secondsLeft !== null && ` · arriving in ${Math.ceil(secondsLeft / 60)} min`}
      {connection === 'reconnecting' && ' · reconnecting'}
    </p>
  );
}
```

`useTaskTracker` returns `status`, `rider` (position, bearing, speed), `eta` (the rider's road ETA to their next stop), `events`, `connection`, `finished` and `error`. It stops listening on unmount. Seed it from your own task read with `useTaskTracker(id, { initial: { status, eta: liveEta } })`.

Everything from `@relay-sdk/sdk-browser` is re-exported. [Full documentation](https://docs.sendrelay.com.ng/sdks/react-sdk)
