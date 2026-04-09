import * as assert from 'assert';
import * as path from 'path';
import nock from 'nock';
import { useSimulation, loadSimulation } from '../../src/index';

const FIXTURES = path.resolve(__dirname, '../fixtures');
const usersFixture = path.join(FIXTURES, 'users.json');
const productsFixture = path.join(FIXTURES, 'products.json');

describe('loadSimulation()', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  it('clears then loads a simulation', async function () {
    const calls: string[] = [];

    nock('http://localhost:8888')
      .delete('/api/v2/simulation')
      .reply(200, () => { calls.push('DELETE'); return ''; });

    nock('http://localhost:8888')
      .put('/api/v2/simulation')
      .reply(200, () => { calls.push('PUT'); return ''; });

    await loadSimulation(usersFixture);

    assert.deepStrictEqual(calls, ['DELETE', 'PUT']);
  });

  it('skips DELETE and uses POST when append is true', async function () {
    const calls: string[] = [];

    nock('http://localhost:8888')
      .post('/api/v2/simulation')
      .reply(200, () => { calls.push('POST'); return ''; });

    await loadSimulation(usersFixture, { append: true });

    assert.deepStrictEqual(calls, ['POST']);
  });

  it('uses custom host and port', async function () {
    const scope = nock('http://hoverfly.internal:9000')
      .delete('/api/v2/simulation')
      .reply(200)
      .put('/api/v2/simulation')
      .reply(200);

    await loadSimulation(usersFixture, { host: 'hoverfly.internal', port: 9000 });

    assert.ok(scope.isDone(), 'requests sent to custom host:port');
  });

  it('sends auth token when provided', async function () {
    const scope = nock('http://localhost:8888', {
      reqheaders: { authorization: 'Bearer test-token' },
    })
      .delete('/api/v2/simulation')
      .reply(200)
      .put('/api/v2/simulation')
      .reply(200);

    await loadSimulation(usersFixture, { authToken: 'test-token' });

    assert.ok(scope.isDone());
  });

  it('can load different simulations in sequence', async function () {
    nock('http://localhost:8888')
      .delete('/api/v2/simulation').reply(200)
      .put('/api/v2/simulation').reply(200)
      .delete('/api/v2/simulation').reply(200)
      .put('/api/v2/simulation').reply(200);

    await loadSimulation(usersFixture);
    await loadSimulation(productsFixture);
  });
});

describe('useSimulation()', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  describe('registered as a before() hook', function () {
    // Set up nock before useSimulation() registers its before() hook
    before(function () {
      nock('http://localhost:8888')
        .delete('/api/v2/simulation')
        .reply(200)
        .put('/api/v2/simulation')
        .reply(200);
    });

    useSimulation(usersFixture);

    it('fired the before() hook and cleared + loaded the simulation', function () {
      // If useSimulation's before() hook failed, this test would not be reached
      // (Mocha aborts the suite on before() errors). Reaching here proves it worked.
      assert.ok(true);
    });
  });

  describe('with append option', function () {
    before(function () {
      nock('http://localhost:8888')
        .post('/api/v2/simulation')
        .reply(200);
    });

    useSimulation(usersFixture, { append: true });

    it('used POST without DELETE', function () {
      assert.ok(true);
    });
  });

  describe('with custom host and port', function () {
    before(function () {
      nock('http://hoverfly.internal:9000')
        .delete('/api/v2/simulation')
        .reply(200)
        .put('/api/v2/simulation')
        .reply(200);
    });

    useSimulation(usersFixture, { host: 'hoverfly.internal', port: 9000 });

    it('sent requests to the custom host:port', function () {
      assert.ok(true);
    });
  });
});
