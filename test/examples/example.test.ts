/**
 * Example tests demonstrating hoverfly-ts-decorators usage.
 *
 * In real usage, nock intercepts would be replaced by actual calls to a
 * service running in front of Hoverfly (e.g. http://localhost:8500).
 * Here, nock intercepts both the Hoverfly admin API calls (port 8888) AND
 * simulates the service responses so the examples are self-contained.
 */
import * as assert from 'assert';
import * as path from 'path';
import nock from 'nock';
import axios from 'axios';
import { useSimulation, loadSimulation } from '../../src/index';

const FIXTURES = path.resolve(__dirname, '../fixtures');

// ---------------------------------------------------------------------------
// Example 1: suite-level simulation via useSimulation()
//
// useSimulation() registers a before() hook that clears Hoverfly and loads
// the simulation file once before all tests in the describe block.
// ---------------------------------------------------------------------------
describe('Example 1: suite-level simulation with useSimulation()', function () {
  // Intercept Hoverfly admin API calls made by the before() hook
  before(function () {
    nock('http://localhost:8888')
      .delete('/api/v2/simulation').reply(200)
      .put('/api/v2/simulation').reply(200);
  });

  // Load users.json before all tests in this suite
  useSimulation(path.join(FIXTURES, 'users.json'));

  afterEach(function () {
    nock.cleanAll();
  });

  it('service returns the user list from the loaded simulation', async function () {
    // Simulate what the proxied service would return (Hoverfly forwards the response)
    nock('http://localhost:8500')
      .get('/users')
      .reply(200, [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);

    const res = await axios.get('http://localhost:8500/users');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.length, 2);
    assert.strictEqual(res.data[0].name, 'Alice');
  });

  it('service returns a single user from the loaded simulation', async function () {
    nock('http://localhost:8500')
      .get('/users/1')
      .reply(200, { id: 1, name: 'Alice' });

    const res = await axios.get('http://localhost:8500/users/1');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.name, 'Alice');
  });
});

// ---------------------------------------------------------------------------
// Example 2: per-test simulation via loadSimulation()
//
// loadSimulation() is called directly inside each it() body, allowing
// different simulations to be loaded for different tests in the same suite.
// ---------------------------------------------------------------------------
describe('Example 2: per-test simulation with loadSimulation()', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  it('loads users simulation and calls the users endpoint', async function () {
    // Hoverfly admin API
    nock('http://localhost:8888')
      .delete('/api/v2/simulation').reply(200)
      .put('/api/v2/simulation').reply(200);

    // Simulated service response
    nock('http://localhost:8500')
      .get('/users')
      .reply(200, [{ id: 1, name: 'Alice' }]);

    await loadSimulation(path.join(FIXTURES, 'users.json'));

    const res = await axios.get('http://localhost:8500/users');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data[0].name, 'Alice');
  });

  it('loads products simulation and calls the products endpoint', async function () {
    // Hoverfly admin API
    nock('http://localhost:8888')
      .delete('/api/v2/simulation').reply(200)
      .put('/api/v2/simulation').reply(200);

    // Simulated service response
    nock('http://localhost:8500')
      .get('/products')
      .reply(200, [{ id: 1, name: 'Widget' }]);

    await loadSimulation(path.join(FIXTURES, 'products.json'));

    const res = await axios.get('http://localhost:8500/products');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data[0].name, 'Widget');
  });
});

// ---------------------------------------------------------------------------
// Example 3: appending a simulation (no clear, POST instead of PUT)
// ---------------------------------------------------------------------------
describe('Example 3: appending a simulation without clearing', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  it('appends products on top of an existing simulation', async function () {
    // Only a POST — no DELETE
    nock('http://localhost:8888')
      .post('/api/v2/simulation').reply(200);

    await loadSimulation(path.join(FIXTURES, 'products.json'), { append: true });
  });
});

// ---------------------------------------------------------------------------
// Example 4: connecting to a non-default Hoverfly instance
// ---------------------------------------------------------------------------
describe('Example 4: custom host and port', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  it('loads a simulation into a Hoverfly on a custom address', async function () {
    nock('http://hoverfly.staging:9000')
      .delete('/api/v2/simulation').reply(200)
      .put('/api/v2/simulation').reply(200);

    await loadSimulation(path.join(FIXTURES, 'users.json'), {
      host: 'hoverfly.staging',
      port: 9000,
    });
  });
});
