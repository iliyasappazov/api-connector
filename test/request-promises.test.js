import test from 'ava';
import { createServer, getFreePort } from './_server';
import ApiConn from '../lib/index';
import { testRequest, testRequestSingle } from './_common';

let server = null;
let port = 0;
test.before(async () => {
  port = await getFreePort();
  server = createServer(port);
});

test.after.always('cleanup', () => {
  server.close();
});

test('ApiRequest resolves with response on Ok', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  const response = await api.reqGet('/ok').start();
  t.is(response.data.url, '/ok');
});

test('ApiRequest resolves with the result of the last onOk handler', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  const two = await api.reqGet('/ok')
    .onResponse(() => 1)
    .onOk((one) => one + 1)
    .start();
  t.is(two, 2);
});

test('ApiRequest processes status callbacks before the resolving', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  const two = await api.reqGet('/ok', { status: 201 })
    .onStatus(() => t.pass(), 201)
    .onOk(() => 1)
    .onOk((one) => one + 1)
    .start();
  t.is(two, 2);
});

test('ApiRequest throws an exception on Fail', async (t) => {
  const validateFunc = () => false;
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` }, validateFunc);

  try {
    await api.reqGet('/fail').start();
  } catch (e) {
    t.true(e.isFail);
  }
});

test('ApiRequest throws an exception with the data field equal to the result of the last onFail handler', async (t) => {
  const validateFunc = () => false;
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` }, validateFunc);

  try {
    await api.reqGet('/fail')
      .onAnyError(() => 1)
      .onResponse((one) => one + 1)
      .onFail((two) => two + 1)
      .start();
  } catch (e) {
    if (e.isFail) {
      t.is(e.data, 3);
    }
  }
});

test('ApiRequest throws an exception on Error', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  try {
    await api.reqGet('/error', { status: 500 }).start();
  } catch (e) {
    t.falsy(e.isFail);
    t.falsy(e.isCancel);
  }
});

test('ApiRequest throws the result of the last onError handler', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  try {
    await api.reqGet('/error', { status: 500 })
      .onAnyError(() => 1)
      .onError((one) => one + 1)
      .start();
  } catch (e) {
    t.falsy(e.isFail);
    t.falsy(e.isCancel);
    t.is(e, 2);
  }
});

test('ApiRequest throws an exception on Cancel', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  try {
    setTimeout(() => api.reqGet('/same').startSingle('same', false), 100);
    await api.reqGet('/same', { timeout: 1000 }).onResponse(() => t.fail()).startSingle('same');
  } catch (e) {
    t.true(e.isCancel);
  }
});

test('ApiRequest could be cancelled manually', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  const req = api.reqGet('/same', { timeout: 1000 }).onResponse(() => t.fail());

  try {
    setTimeout(() => req.cancel(), 100);
    await req.start();
  } catch (e) {
    t.true(e.isCancel);
  }
});

test(
  'ApiRequest throws an exception with the data field equal to the result of the last onCancel handler',
  async (t) => {
    const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

    try {
      setTimeout(() => api.reqGet('/same').startSingle('same', false), 100);
      await api.reqGet('/same', { timeout: 1000 })
        .onResponse(() => t.fail())
        .onAnyError(() => 1)
        .onCancel((one) => one + 1)
        .startSingle('same');
    } catch (e) {
      t.true(e.isCancel);
      t.is(e.data, 2);
    }
  },
);

test('ApiRequest processes status callbacks set by onAny method call', async (t) => {
  t.plan(2);
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  await api.reqGet('/ok', { status: 201 })
    .onAny(() => t.pass(), 'onStatus=[200, 201, 202]', 'onStatus=201')
    .start();
});

test('ApiRequest does not throw exception when started quietly with error callback', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  try {
    await testRequest(api.reqGet('/error', { status: 500 })
      .onAnyError(() => t.pass()));
  } catch (e) {
    t.fail();
  }
});

test('ApiRequest does not throw exception when started single quietly with error callback', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });

  try {
    await testRequestSingle(api.reqGet('/error', { status: 500 })
      .onAnyError(() => t.pass()));
  } catch (e) {
    t.fail();
  }
});
