import * as assert from 'assert';
import * as path from 'path';
import nock from 'nock';
import { HoverflyClient } from '../../src/client/hoverfly-client';

const FIXTURES = path.resolve(__dirname, '../fixtures');

describe('HoverflyClient', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  describe('loadSimulation()', function () {
    it('sends PUT /api/v2/simulation with parsed file contents', async function () {
      const scope = nock('http://localhost:8888')
        .put('/api/v2/simulation', (body: unknown) => {
          return typeof body === 'object' && body !== null;
        })
        .reply(200);

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      await client.loadSimulation(path.join(FIXTURES, 'users.json'));

      assert.ok(scope.isDone(), 'PUT /api/v2/simulation was called');
    });

    it('sends POST /api/v2/simulation when append is true', async function () {
      const scope = nock('http://localhost:8888')
        .post('/api/v2/simulation')
        .reply(200);

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: true });
      await client.loadSimulation(path.join(FIXTURES, 'users.json'));

      assert.ok(scope.isDone(), 'POST /api/v2/simulation was called');
    });

    it('resolves relative paths against process.cwd()', async function () {
      const scope = nock('http://localhost:8888')
        .put('/api/v2/simulation')
        .reply(200);

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      // path relative to cwd (project root when running mocha)
      await client.loadSimulation('test/fixtures/users.json');

      assert.ok(scope.isDone(), 'PUT was called with relative path resolved');
    });

    it('sends the correct simulation data in the request body', async function () {
      let receivedBody: unknown;

      nock('http://localhost:8888')
        .put('/api/v2/simulation', (body: unknown) => {
          receivedBody = body;
          return true;
        })
        .reply(200);

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      await client.loadSimulation(path.join(FIXTURES, 'users.json'));

      assert.ok(receivedBody !== undefined);
      const body = receivedBody as Record<string, unknown>;
      assert.ok('data' in body, 'body has data field');
      assert.ok('meta' in body, 'body has meta field');
    });

    it('throws when the file does not exist', async function () {
      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      await assert.rejects(
        () => client.loadSimulation('/nonexistent/path/sim.json'),
        /ENOENT/,
      );
    });

    it('throws when Hoverfly returns a non-2xx response', async function () {
      nock('http://localhost:8888')
        .put('/api/v2/simulation')
        .reply(400, { error: 'invalid simulation' });

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      await assert.rejects(
        () => client.loadSimulation(path.join(FIXTURES, 'users.json')),
      );
    });

    it('sends Authorization header when authToken is provided', async function () {
      const scope = nock('http://localhost:8888', {
        reqheaders: { authorization: 'Bearer my-secret-token' },
      })
        .put('/api/v2/simulation')
        .reply(200);

      const client = new HoverflyClient({
        host: 'localhost',
        port: 8888,
        authToken: 'my-secret-token',
        append: false,
      });
      await client.loadSimulation(path.join(FIXTURES, 'users.json'));

      assert.ok(scope.isDone(), 'Authorization header was sent');
    });
  });

  describe('clearSimulations()', function () {
    it('sends DELETE /api/v2/simulation', async function () {
      const scope = nock('http://localhost:8888')
        .delete('/api/v2/simulation')
        .reply(200);

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      await client.clearSimulations();

      assert.ok(scope.isDone(), 'DELETE /api/v2/simulation was called');
    });

    it('sends Authorization header when authToken is provided', async function () {
      const scope = nock('http://localhost:8888', {
        reqheaders: { authorization: 'Bearer my-secret-token' },
      })
        .delete('/api/v2/simulation')
        .reply(200);

      const client = new HoverflyClient({
        host: 'localhost',
        port: 8888,
        authToken: 'my-secret-token',
        append: false,
      });
      await client.clearSimulations();

      assert.ok(scope.isDone(), 'Authorization header was sent on DELETE');
    });

    it('throws when Hoverfly returns a non-2xx response', async function () {
      nock('http://localhost:8888')
        .delete('/api/v2/simulation')
        .reply(500, { error: 'internal error' });

      const client = new HoverflyClient({ host: 'localhost', port: 8888, append: false });
      await assert.rejects(() => client.clearSimulations());
    });
  });
});
