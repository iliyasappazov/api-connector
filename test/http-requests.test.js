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

test('apiGet sends GET request with correct url and params', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  const params = { any: 'param' };

  await testRequest(
    api.reqGet('/get-request', params)
      .onOk((response) => t.deepEqual(response.data, {
        url: '/get-request?any=param',
        method: 'GET',
        params,
      }))
      .onAnyError((err) => t.fail(err)),
  );
});


test('apiPost sends POST request with correct url, params and data', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  const params = { any: 'param' };
  const data = { any: 'data' };

  await testRequest(
    api.reqPost('/post-request', data, params)
      .onOk((response) => t.deepEqual(response.data, {
        url: '/post-request?any=param',
        method: 'POST',
        params,
        data,
      }))
      .onAnyError((err) => t.fail(err)),
  );
});

test('apiPatch sends PATCH request with correct url, params and data', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  const params = { any: 'param' };
  const data = { any: 'data' };

  await testRequest(
    api.reqPatch('/patch-request', data, params)
      .onOk((response) => t.deepEqual(response.data, {
        url: '/patch-request?any=param',
        method: 'PATCH',
        params,
        data,
      }))
      .onAnyError((err) => t.fail(err)),
  );
});

test('apiPut sends PUT request with correct url, params and data', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  const params = { any: 'param' };
  const data = { any: 'data' };

  await testRequest(
    api.reqPut('/put-request', data, params)
      .onOk((response) => t.deepEqual(response.data, {
        url: '/put-request?any=param',
        method: 'PUT',
        params,
        data,
      }))
      .onAnyError((err) => t.fail(err)),
  );
});

test('reqDelete sends DELETE request with correct url and params', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  const params = { any: 'param' };

  await testRequest(
    api.reqDelete('/delete-request', params)
      .onOk((response) => t.deepEqual(response.data, {
        url: '/delete-request?any=param',
        method: 'DELETE',
        params,
      }))
      .onAnyError((err) => t.fail(err)),
  );
});
