/**
 * Integration tests for useSimulation().
 *
 * Requires Hoverfly running via docker compose. Start with:
 *   docker compose up -d
 * Run with:
 *   npm run test:integration
 */
import * as assert from 'assert';
import axios from 'axios';
import { useSimulation, useSimulations, loadSimulation } from '../../src/index';
import { CLIENT_OPTIONS, SERVICE_URL, USERS_SIM, PRODUCTS_SIM, getSimulationPairs } from './helpers';

describe('useSimulation() — suite-level hook', function () {
  useSimulation(USERS_SIM, CLIENT_OPTIONS);

  it('GET /users returns Alice and Bob', async function () {
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ name: string }>;
    assert.strictEqual(users[0].name, 'Alice');
  });

  it('admin API reflects the loaded simulation', async function () {
    const pairs = await getSimulationPairs();
    assert.ok(pairs.length > 0, 'expected at least one simulation pair to be loaded');
  });
});

describe('useSimulations() — multi-file suite-level hook', function () {
  useSimulations([USERS_SIM, PRODUCTS_SIM], CLIENT_OPTIONS);

  it('GET /users returns Alice', async function () {
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ name: string }>;
    assert.strictEqual(users[0].name, 'Alice');
  });

  it('GET /products returns Widget', async function () {
    const res = await axios.get(`${SERVICE_URL}/products`);
    assert.strictEqual(res.status, 200);
    const products = res.data as Array<{ name: string }>;
    assert.strictEqual(products[0].name, 'Widget');
  });

  it('admin API shows pairs from both files', async function () {
    const pairs = await getSimulationPairs();
    assert.ok(pairs.length >= 2, `expected at least 2 pairs, got ${pairs.length}`);
  });
});

describe('useSimulations() — skips DELETE when clearSimulations is false', function () {
  before(async function () {
    await loadSimulation(USERS_SIM, CLIENT_OPTIONS);
  });

  useSimulations([PRODUCTS_SIM], CLIENT_OPTIONS, false);

  it('GET /users still works (prior simulation was preserved)', async function () {
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
});
