# api-connector
Axios wrapper that simplifies JS API SDK development.

## Getting started

### Installation
```npm install api-connector```

### Import
Import `api-connector`:
```js
import ApiConnector from 'api-connector';
// or
ApiConnector = require('api-connector').default;
```

### Example
Create `GET` request with ES6 async/await:
```js
const response = await ApiConnector.reqGet('https://example.com')
                                   .start();
```
Create `GET` request without promise:
```js
ApiConnector.reqGet('https://example.com')
            .onOk(response => console.log(response))
            .start('', false);
```
Combine both:
```js
const responseData = await ApiConnector.reqGet('https://example.com')
                                       .onOk(response => response.data)
                                       .start();
```

### ApiRequest modes: `simple`/`promised`
As you can see in the example above there are two ApiRequest modes:
+ `simple` - async and based purely on callbacks;
+ `promised` - returns Promise that will be resolved with the result of the last onOk handler 
or rejected with the last `onFail`/`onCancel`/`onError` handler.  

By default all requests are `promised`. 
To start `simple` request call the `start`/`startSingle` method with the `promise` parameter set to `false`.

Example:
```js
const request = ApiConnector.reqGet('https://example.com')
                            .onOk(response => console.log(response));
// start promised ApiRequest:
await request.start()
// start simple ApiRequest:
request.start('', false);
// start simple ApiRequest and then convert it to promised:
request.start('', false);
await request.genPromise();
```

### Axios configuration
ApiConnector simply wraps Axios requests thus all Axios configurations are still available. 
You create an ApiConnector instance with common axios configurations:
```js
const generalAxiosConfigs = { base_url: 'http://localhost' };
const connector = ApiConnector.create(generalAxiosConfigs);
```
And/or pass the Axios configuration object directly to the request as last parameter:
```js
const axiosConfigs = { timeout: 1000 };
const response = await connector.reqGet('/test', {param1: 'test'}, axiosConfigs).start()
```

### Response validation
ApiConnector has a mechanism to determine the successfulness of the response.
By default all completed responses are considered as successful.
You can change this logic by passing `validateFunc` property to the `create` method. 
This function should accept the Axios response object and return `true` if response is successful and `false` otherwise.
For example:
```js
const testConnector = ApiConnector.create({baseURL: 'http://localhost/api'}, response => response.data.result === 'OK');
response = await testConnector.reqGet('/test')
                              .onOk(() => console.log('Success')) // will be called on response { result: 'OK' ... }
                              .onFail(() => console.log('Fail'))
                              .start();
```

### Event handling
#### Basic events
ApiConnector allows you to attach callbacks to the following **basic** events:
+ `onOk` - *successful* API response;
+ `onFail` - *failed* API response;
+ `onCancel` - request cancellation;
+ `onError` - exception;
+ `onStatus` - status code.

There are two ways to attach callbacks to any of the above events. The simplest one - call a method with the same name:
```js
ApiConnector.reqGet('http://localhost')
            .onOk(processResponse)
            .onFail(alertError)
            .onCancel(alertError)
            .onError(alertError)
            .onStatus(logout, 401, 403)
```
Another way to attach callbacks - use `onAny` method:
```js
ApiConnector.reqGet('http://localhost')
            .onAny(processResponse, 'onOk')
            .onAny(alertError, 'onFail', 'onCancel', 'onError')
            .onAny(authorizeResponse, 'onStatus=[401, 403]');
```

#### Combined events
For convenience there are **combined** events that represents a different combinations of the **basic** events:
+ `onResponse` - is called on any API response, combines `onOk` and `onFail` events
+ `onAnyError` - combines `onFail`, `onCancel`, `onError` events
+ `then` - combines `onOk`, `onFail`, `onCancel`, `onError` events 

Compared to the **basic** events callbacks to the **combined** events could be attached only by calling 
a method with the same name: 
```js
ApiConnector.reqGet('http://localhost')
            .onResponse(processResponse)
            .onAnyError(alertError)
            .then(sayGoodbye);
```
the code above is equivalent to:
```js
ApiConnector.reqGet('http://localhost')
            .onAny(processResponse, 'onOk', 'onFail')
            .onAnyError(alertError, 'onFail', 'onCancel', 'onError')
            .then(sayGoodbye, 'onOk', 'onFail', 'onCancel', 'onError');
```

#### Multiple handlers
You could attach multiple callbacks on the same event, all these callbacks will be fired in order in which they were added.  
The result from the previous callback will be passed to the next one:
```js
const result = await ApiConnector.reqGet('http://localhost')
                                 .onOk(() => 'Hello,')
                                 .onOk(hello => hello + ' World')
                                 .then(helloWorld => helloWorld + '!')
                                 .start();
console.log(result); // 'Hello, world!'                                 
```

#### Post-handlers
Event callbacks could be attached after the request start:
```js
const request = ApiConnector.reqGet('http://localhost');
await request.onOk(() => 'Hello, World!')
             .start();
request.onOk(res => console.log(res));  // 'Hello, World!'
```

#### Promised ApiRequest
`Promised` ApiRequest returns a Promise that:
+ resolves with the result of the last `onOk` event handler;
+ on `onFail` event throws the following Error: 
    ```js
    {
      isFail: true,
      data: any // result of the last onFail callback 
    }
    ```
+ on `onCancel` event throws the following Error:
     ```js
     {
       isCancel: true,
       data: any // result of the last onCancel callback 
     }
     ```
+ on `onError` event throws the result of the last `onError` callback.

Example:
```js
try {
  const response = await ApiConnector.reqGet('http://localhost')
                                     .onOk(() => 'Ok')
                                     .onFail(() => 'Failed')
                                     .onCancel(() => 'Cancelled')
                                     .onError(() => 'Error')
                                     .start();
  console.log(response); // 'Ok'
} catch (err) {
  if (err.isFail) {
    console.log(err.data); // 'Failed'
  } else if (err.isCancel) {
    console.log(err.data); // 'Cancelled'
  } else {
    console.log(err);  // 'Error'
  }
}
```

### Request cancellation
#### Manual request cancellation
You could cancel request manually by calling the `cancel` method:
```js
const request = ApiConnector.reqGet('http://localhost')
                            .onCancel(() => console.log('Cancelled'));
setTimeout(() => request.cancel(), 100);
request.start();
```
`start`/`startSingle` methods returns Axios request cancellation functions when `promise` parameter is set to `false`:
```js
const cancel = ApiConnector.reqGet('http://localhost')
                           .onCancel(() => console.log('Cancelled'))
                           .start('', false);
cancel();
```

#### Automatic request cancellation
`startSingle` method performs new Axios request and cancels previous pending requests with the same method, url and identifier:
```js
ApiConnector.reqGet('http://localhost', { param1: 1}).start('same');
ApiConnector.reqGet('http://localhost', { param1: 1}).startSingle('same');  // will cancel previous request
ApiConnector.reqGet('http://localhost', { param1: 1}).startSingle('different');  // will NOT cancel any requests, because request identifiers are different
ApiConnector.reqGet('http://localhost', { param1: 2}).startSingle('different');  // will NOT cancel any requests, because request parameters are different
```

### SDK example
Assume:
+ you have an API with base url: `https://example.com`;
+ all successful responses have the following format: `{ status: 'ok', result: []}`;
+ all failed responses have the following format: `{ status: 'fail', message: ''}`;
+ there are GET `/users` and DELETE `/user?name={name}` endpoints;
+ you have to create an SDK which will interact with API;
+ SDK users should get only `result` response field value;
+ on error SDK should log error or `message` response field.

Create sample SDK:
```js
import ApiConnector from 'api-connector';

const exampleApiConnector = ApiConnector.create(
        { baseURL: 'https://example.com' }, 
        response => response.data.status === 'ok'
    );

function configureEndpoint(apiRequest) {
    return apiRequest.onOk(response => response.data.result)
                     .onFail(response => response.data.message);
}

const SDK = {
    getUsers: async () => await configureEndpoint(exampleApiConnector.reqGet('/users')).start(),
    deleteUser: (username) => {
      const endpoint = configureEndpoint(exampleApiConnector.reqDelete('/user', { name: username }));
      endpoint.start('', false);
      return endpoint;
    }
}

try {
    const users = SDK.getUsers();
    console.log('Total users count: ', users.length);
} catch (e) {
    if (e.isFail) {
      console.log(e.data);
    } else if (!e.isCancel) {
      console.log(e);
    }
}

SDK.deleteUser('John')
   .onOk(result => console.log('John has been deleted!'))
   .onAnyError(() => console.log('John survived!'));

await SDK.deleteUser('John').genPromise();
```


### ApiConnector API

#### .create(configs?, validateFunc?)
Create ApiConnector with Axios configs:
```js
myApiConn = ApiConn.create({baseURL: 'https://example.com'});
```
Provided validate function will be used in response status evaluation:
```js
myApiConn = ApiConn.create({}, response => response.data.status === 'ok');
```

#### .request(config)
Creates and returns `ApiRequest` using Axios request configs.
```js
req = ApiConn.request({method: 'GET', url: 'https://example.com'});
```

#### .req* Aliases
For convenience aliases have been provided for some request methods:

##### .reqGet(url, params?, config?)
##### .reqPost(url, data?, params?, config?)
##### .reqPatch(url, data?, params?, config?)
##### .reqPut(url, data?, params?, config?)
##### .reqDelete(url, params?, config?)

These methods just calls `.request` method, e.g, `.reqPost` is equal to `ApiConn.request({method: 'POST', url, data, params, ...config})`. 


### ApiRequest Api

#### start(identifier='', promise=true)
Performs http request.
Returns Canceler function if `promise` is set to false.
Otherwise returns a Promise:
+ `onOk` event will resolve the Promise with a data returned by the last `onOk` handler.
+ `onFail` event will reject the Promise with an error with `isFail` property set `true` and `data` property with a data returned by the last `onFail` handler.
+ `onCancel` event will reject the Promise with an error with `isCancel` property set `true` and `data` property with a data returned by the last `onCancel` handler.
+ `onError` error will reject the Promise with a data returned by the last `onError` handler.

#### startSingle(identifier='', promise=true)
Similar to `start` method but cancels previous pending requests with the same *method*, *url* and *id*.

#### .on* event callbacks
You can attach callbacks to the following events
+ *successful* API response (`.onOk`)
+ *failed* API response (`.onFail`)
+ any API response (`.onResponse`)
+ request cancellation (`.onCancel`)
+ exception (`.onError`)
+ after any of the above (`.then`)
+ after *failed* API response, or cancellation, or exception (`onAnyError`)
+ status code (`.onStatus`)
+ any event combination (`.onAny`)

##### .onAny(callback, ...eventNames)
Attaches callback to all given events.  
Supported event names: `'onOk'`, `'onFail'`, `'onCancel'`, `'onError'`, `'onStatus={status}'`.  
All unsupported event names will be ignored.

Attach callback to request cancellation and response with status code 401:
```js
await ApiConn.reqGet('https://example.com').onAny(callback, 'onCancel', 'onStatus=401').start();
```

##### .onStatus(callback, ...statuses)
Adds callback to response with exact status code.

Attach callback to responses with 201 and 202 status codes.
```js
await ApiConn.reqGet('https://example.com').onStatus(callback, 201, '202').start();
```
