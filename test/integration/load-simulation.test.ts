/**
 * Integration tests for loadSimulation().
 *
 * Requires Hoverfly running via docker compose. Start with:
 *   docker compose up -d
 * Run with:
 *   npm run test:integration
 */
import * as assert from 'assert';
import axios from 'axios';
import { loadSimulation, createClient } from '../../src/index';
import { CLIENT_OPTIONS, SERVICE_URL, USERS_SIM, PRODUCTS_SIM, getSimulationPairs } from './helpers';

// ---------------------------------------------------------------------------
// Replace mode (default): clears existing simulation then loads the new one
// ---------------------------------------------------------------------------
describe('loadSimulation() — replace mode', function () {
  const client = createClient(CLIENT_OPTIONS);

  beforeEach(async function () {
    await client.clearSimulations();
  });

  it('loads users.json and GET /users returns Alice and Bob', async function () {
    await loadSimulation(USERS_SIM, CLIENT_OPTIONS);
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ id: number; name: string }>;
    assert.strictEqual(users.length, 2);
    assert.strictEqual(users[0].name, 'Alice');
    assert.strictEqual(users[1].name, 'Bob');
  });

  it('loads products.json and GET /products returns Widget and Gadget', async function () {
    await loadSimulation(PRODUCTS_SIM, CLIENT_OPTIONS);
    const res = await axios.get(`${SERVICE_URL}/products`);
    assert.strictEqual(res.status, 200);
    const products = res.data as Array<{ name: string }>;
    assert.strictEqual(products.length, 2);
    assert.strictEqual(products[0].name, 'Widget');
  });

  it('loading products.json after users.json replaces the simulation — GET /users no longer matches', async function () {
    await loadSimulation(USERS_SIM, CLIENT_OPTIONS);
    await loadSimulation(PRODUCTS_SIM, CLIENT_OPTIONS);

    const res = await axios.get(`${SERVICE_URL}/products`);
    assert.strictEqual(res.status, 200);

    await assert.rejects(
      () => axios.get(`${SERVICE_URL}/users`),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        return true;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Append mode: POSTs to add pairs without clearing existing simulation
// ---------------------------------------------------------------------------
describe('loadSimulation() — append mode', function () {
  const client = createClient(CLIENT_OPTIONS);

  before(async function () {
    await client.clearSimulations();
    await loadSimulation(USERS_SIM, CLIENT_OPTIONS);
    await loadSimulation(PRODUCTS_SIM, { ...CLIENT_OPTIONS, append: true });
  });

  it('GET /users still works after appending products', async function () {
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ name: string }>;
    assert.strictEqual(users[0].name, 'Alice');
  });

  it('GET /products works after appending', async function () {
    const res = await axios.get(`${SERVICE_URL}/products`);
    assert.strictEqual(res.status, 200);
    const products = res.data as Array<{ name: string }>;
    assert.strictEqual(products[0].name, 'Widget');
  });

  it('admin API shows pairs from both simulations', async function () {
    const pairs = await getSimulationPairs();
    assert.ok(pairs.length >= 2, `expected at least 2 pairs after append, got ${pairs.length}`);
  });
});

// ---------------------------------------------------------------------------
// Per-test switching: each it() loads its own simulation
// ---------------------------------------------------------------------------
describe('loadSimulation() — per-test switching', function () {
  it('loads users.json and GET /users returns data', async function () {
    await loadSimulation(USERS_SIM, CLIENT_OPTIONS);
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ name: string }>;
    assert.ok(users.length > 0);
    assert.strictEqual(users[0].name, 'Alice');
  });

  it('loads products.json and GET /products returns data', async function () {
    await loadSimulation(PRODUCTS_SIM, CLIENT_OPTIONS);
    const res = await axios.get(`${SERVICE_URL}/products`);
    assert.strictEqual(res.status, 200);
    const products = res.data as Array<{ name: string }>;
    assert.ok(products.length > 0);
    assert.strictEqual(products[0].name, 'Widget');
  });
});
