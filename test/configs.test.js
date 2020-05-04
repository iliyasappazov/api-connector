import test from 'ava';
import Axios from 'axios';
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
      .onAnyError((err) => t.fail(err)),
  );
});

test('by default all responses are `successful`', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` });
  await testRequest(
    api.reqGet('/any')
      .onOk(() => t.pass())
      .onAnyError((err) => t.fail(err)),
  );
});

test('validate function changes response validation logic', async (t) => {
  const validateFunc = (response) => response.data.url === '/ok';

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

test('validate function passed to request overwrites global one', async (t) => {
  const globalValidateFunc = (response) => response.data.url === '/ok';
  const instanceValidateFunc = (response) => response.data.url === '/okay';

  const api = ApiConn.create({ baseURL: `http://localhost:${port}` }, globalValidateFunc);

  // test failed response
  await testRequest(
    api.reqGet('/fail', {}, {}, { validateFunc: instanceValidateFunc })
      .onOk(() => t.fail())
      .onFail(() => t.pass()),
  );

  // test successful response
  await testRequest(
    api.reqGet('/okay', {}, {}, { validateFunc: instanceValidateFunc })
      .onOk(() => t.pass())
      .onFail(() => t.fail()),
  );
});

test('axios instance passed to request overwrites global one', async (t) => {
  const api = ApiConn.create({ baseURL: `http://localhost:${port}` }, (response) => response.data.url === '/ok/ok');
  const axiosInstance = Axios.create({ baseURL: `http://localhost:${port}/ok` });

  await testRequest(
    api.reqGet('/ok', {}, {}, { axios: axiosInstance })
      .onOk(() => t.pass())
      .onFail(() => t.fail()),
  );
});
