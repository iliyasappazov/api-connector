import test from 'ava';
import { createServer, getFreePort } from './_server';
import ApiConn from '../lib/index';
import { testRequest } from './_common';

let server = null;
let port = 0;
test.before(async () => {
  port = await getFreePort();
  server = createServer(port);
});

test.after.always('cleanup', () => {
  server.close();
});

test('configs are passed to wrapped Axios instance', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  await testRequest(
    api.reqGet('/any')
      .onOk(() => t.pass())
      .onAnyError(err => t.fail(err)),
  );
});

test('by default all responses are `successful`', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  await testRequest(
    api.reqGet('/any')
      .onOk(() => t.pass())
      .onAnyError(err => t.fail(err)),
  );
});

test('validate function changes response validation logic', async (t) => {
  const validateFunc = response => response.data.url === '/ok';

  const api = ApiConn.create({ baseURL: `http://localhost:${port}` }, validateFunc);

  // test failed response
  await testRequest(
    api.reqGet('/fail')
      .onOk(() => t.fail())
      .onFail(() => t.pass()),
  );

  // test successful response
  await testRequest(
    api.reqGet('/ok')
      .onOk(() => t.pass())
      .onFail(() => t.fail()),
  );
});
