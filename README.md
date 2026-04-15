# hoverfly-ts-decorators

> **Early development:** This package is in early development. APIs may change and bugs may occur.

TypeScript helpers for loading [Hoverfly](https://hoverfly.io) simulations in [Mocha](https://mochajs.org) test suites. Provides two simple functions — `useSimulation()` for suite-level setup and `loadSimulation()` for per-test control — that manage Hoverfly's simulation state via its admin API so your tests always run against a known, predictable set of mocked HTTP responses.

## Installation

```sh
npm install hoverfly-ts-decorators
```

## Prerequisites

Hoverfly must be running and accessible before your tests execute. The simplest way is Docker Compose (see [Integration tests](#integration-tests)), but any running Hoverfly instance works.

By default the library connects to `localhost:8888` (Hoverfly's admin API). Override this with environment variables or per-call options (see [Configuration](#configuration)).

## Quick start

### Suite-level simulation with `useSimulation()`

Call `useSimulation()` inside a `describe` block to load a simulation once before all tests in that suite.

```typescript
import { useSimulation } from 'hoverfly-ts-decorators';
import axios from 'axios';
import * as assert from 'assert';

describe('User service', function () {
  useSimulation('./simulations/users.json');

  it('returns all users', async function () {
    const res = await axios.get('http://localhost:8500/users');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data[0].name, 'Alice');
  });
});
```

### Per-test simulation with `loadSimulation()`

Call `loadSimulation()` directly inside an `it()` body when different tests need different simulations.

```typescript
import { loadSimulation } from 'hoverfly-ts-decorators';
import axios from 'axios';
import * as assert from 'assert';

describe('Product service', function () {
  it('returns products', async function () {
    await loadSimulation('./simulations/products.json');
    const res = await axios.get('http://localhost:8500/products');
    assert.strictEqual(res.data[0].name, 'Widget');
  });

  it('returns users after switching simulation', async function () {
    await loadSimulation('./simulations/users.json');
    const res = await axios.get('http://localhost:8500/users');
    assert.strictEqual(res.data[0].name, 'Alice');
  });
});
```

### Appending simulations

Pass `{ append: true }` to add pairs to the existing simulation without clearing it first.

```typescript
await loadSimulation('./simulations/users.json');
await loadSimulation('./simulations/products.json', { append: true });
// Both /users and /products now respond correctly
```

## API reference

### `useSimulation(filePath, options?)`

Registers a Mocha `before()` hook in the enclosing `describe` block. The hook clears all Hoverfly simulations and loads the specified file before any test in the suite runs.

| Parameter | Type | Description |
|---|---|---|
| `filePath` | `string` | Path to the simulation JSON file. Relative paths are resolved against `process.cwd()`. |
| `options` | `SimulationOptions` | Optional. See below. |

### `loadSimulation(filePath, options?)`

Async function that clears and loads a simulation. Call directly inside `it()` for per-test control.

| Parameter | Type | Description |
|---|---|---|
| `filePath` | `string` | Path to the simulation JSON file. Relative paths are resolved against `process.cwd()`. |
| `options` | `SimulationOptions` | Optional. See below. |

### `SimulationOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `host` | `string` | `HOVERFLY_HOST` env var or `'localhost'` | Hoverfly admin API host |
| `port` | `number` | `HOVERFLY_PORT` env var or `8888` | Hoverfly admin API port |
| `authToken` | `string` | `HOVERFLY_AUTH_TOKEN` env var | Bearer token for authenticated Hoverfly instances |
| `append` | `boolean` | `false` | When `true`, POSTs to append pairs instead of clearing and replacing |

### `HoverflyClient`

Lower-level class for direct admin API access.

```typescript
import { createClient } from 'hoverfly-ts-decorators';

const client = createClient({ host: 'localhost', port: 8888 });
await client.clearSimulations();
await client.loadSimulation('./simulations/users.json');
```

## Configuration

The library reads three environment variables as defaults. Any value passed in `SimulationOptions` takes precedence.

| Variable | Default | Description |
|---|---|---|
| `HOVERFLY_HOST` | `localhost` | Admin API hostname |
| `HOVERFLY_PORT` | `8888` | Admin API port |
| `HOVERFLY_AUTH_TOKEN` | _(none)_ | Bearer token for authenticated instances |
