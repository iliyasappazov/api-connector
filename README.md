# api-connector
Axios wrapper that simplifies JS API SDK development.

## Getting started

### Installation
```npm install api-connector```

### Import
Import `api-connector`:
```js
import ApiConn from "api-connector";
// or
ApiConn = require("api-connector").default;
```

### Example
Create `GET` request:
```js
ApiConn.reqGet("https://example.com")
        .onOk(response => console.log(response.data))
        .start();
```


### SDK example
Assume:
+ you have an API with base url: `https://example.com`;
+ all successful responses have the following format: `{ status: "ok", result: []}`;
+ all failed responses have the following format: `{ status: "fail", message: ""}`;
+ there are GET `/users` and DELETE `/user?name={name}` endpoints;
+ you have to create an SDK which will interact with API;
+ SDK users should get only `result` response field value;
+ on error SDK should log error or `message` response field.

Create sample SDK:
```js
import ApiConn from "api-connector";

const exampleConn = ApiConn.create(
        { baseURL: "https://example.com" }, 
        response => response.data.status === "ok"
    );

function configureEndpoint(apiRequest) {
    return apiRequest.onOk(response => response.data.result)
                     .onFail(response => console.log(response.data.message))
                     .onError(error => console.log(error))
}

const SDK = {
    getUsers: () => configureEndpoint(exampleConn.reqGet("/users")),
    deleteUser: (username) => configureEndpoint(exampleConn.reqDelete("/user", { name: username }))
}

SDK.getUsers()
   .onOk(users => console.log("Total users count: ", users))
   .start()
   
SDK.deleteUser("John")
   .onOk(result => console.log("John has been deleted!"))
   .start()
```


### ApiConnector API

#### .create(configs?, validateFunc?)
Create ApiConnector with Axios configs:
```js
myApiConn = ApiConn.create({baseURL: "https://example.com"});
```
Provided validate function will be used in response status evaluation:
```js
myApiConn = ApiConn.create({}, response => response.data.status === "ok");
```

#### .request(config)
Creates and returns `ApiRequest` using Axios request configs.
```js
req = ApiConn.request({method: "GET", url: "https://example.com"});
```

#### .req* Aliases
For convenience aliases have been provided for some request methods:

##### .reqGet(url, params?, config?)
##### .reqPost(url, data?, params?, config?)
##### .reqPatch(url, data?, params?, config?)
##### .reqPut(url, data?, params?, config?)
##### .reqDelete(url, params?, config?)

These methods just calls `.request` method, e.g, `.reqPost` is equal to `ApiConn.request({method: "POST", url, data, params, ...config})`. 


### ApiRequest Api

#### start()
Performs http request.

#### startSingle(id?)
Creates and performs http request.  
Cancels previous pending requests with the same *method*, *url* and *id*.

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
Supported event names: `"onOk"`, `"onFail"`, `"onCancel"`, `"onError"`, `"onStatus={status}"`.  
All unsupported event names will be ignored.

Attach callback to request cancellation and response with status code 401:
```js
ApiConn.reqGet("https://example.com").onAny(callback, "onCancel", "onStatus=401").start();
```

##### .onStatus(callback, ...statuses)
Adds callback to response with exact status code.

Attach callback to responses with 201 and 202 status codes.
```js
ApiConn.reqGet("https://example.com").onStatus(callback, 201, "202").start();
```
