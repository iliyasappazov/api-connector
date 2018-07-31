import Axios from 'axios';
import { hashCode, Pipe } from './utils';

/**
 * ApiRequest creates and performs cancellable http request.
 * ApiRequest is able to attach callbacks to the following events:
 * + *successful* API response (`.onOk`)
 * + *failed* API response (`.onFail`)
 * + any API response (`.onResponse`)
 * + request cancellation (`.onCancel`)
 * + exception (`.onError`)
 * + after any of the above (`.then`)
 * + after *failed* API response, or cancellation, or exception (`onAnyError`)
 * + status code (`.onStatus`)
 * + any event combination (`.onAny`)
 */
export default class ApiRequest {
  /**
   * Stores configurations and initializes callback pipes.
   * Validate function will be used to evaluate response success.
   * Axios response object will be passed to the function, and if `true` is returned the response is said to be *successful*.
   * If the function is `null` any response will be considered as *successful*.
   *
   * @param {Axios} axios - Axios instance
   * @param {{}} pendingRequests  - dictionary with pending request cancel functions
   * @param {function} validateFunc - function that decides whether a response is *successful* or *failed*
   * @param {AxiosRequestConfig} configs  - Axios configs
   */
  constructor(axios, pendingRequests, validateFunc, configs) {
    this.axios = axios;
    this.pendingRequests = pendingRequests;
    this.configs = configs;
    this.callbacks = {
      onOk: new Pipe(),
      onFail: new Pipe(),
      onCancel: new Pipe(),
      onError: new Pipe(),
      /** @type {Object.<string, Pipe>} */
      onStatus: {},
    };
    this.validate = validateFunc;
  }

  /**
   * Attaches callback to all given events.
   * Supported event names: `"onOk"`, `"onFail"`, `"onCancel"`, `"onError"`, `"onStatus={status}"`.
   * All unsupported event names will be ignored.
   *
   * @param {function} callback
   * @param {...string} eventNames
   * @returns {ApiRequest} the same request
   */
  onAny(callback, ...eventNames) {
    for (let i = 0; i < eventNames.length; i += 1) {
      const eventName = eventNames[i];
      if (Object.keys(this.callbacks).indexOf(eventName) >= 0) {
        this.callbacks[eventName].join(callback);
      } else {
        const matchGroups = eventName.match(/onStatus=(.*)/);
        if (matchGroups) {
          try {
            const statuses = JSON.parse(matchGroups[1]);
            if (Array.isArray(statuses)) {
              this.onStatus(callback, ...statuses);
            } else {
              this.onStatus(callback, statuses);
            }
          } catch (e) {
            /* empty */
          }
        }
      }
    }
    return this;
  }

  /**
   * Adds callback to *successful* response.
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  onOk(callback) {
    this.onAny(callback, 'onOk');
    return this;
  }

  /**
   * Adds callback to *failed* response.
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  onFail(callback) {
    this.onAny(callback, 'onFail');
    return this;
  }

  /**
   * Adds callback to any response.
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  onResponse(callback) {
    this.onAny(callback, 'onOk', 'onFail');
    return this;
  }

  /**
   * Adds callback to request cancellation.
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  onCancel(callback) {
    this.onAny(callback, 'onCancel');
    return this;
  }

  /**
   * Adds callback function that will be called on exception rise.
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  onError(callback) {
    this.onAny(callback, 'onError');
    return this;
  }

  /**
   * Adds callback that will be fired last on any request result.
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  then(callback) {
    this.onAny(callback, 'onOk', 'onFail', 'onCancel', 'onError');
    return this;
  }


  /**
   * Adds callback to response with exact status code.
   *
   * @param {function} callback
   * @param {...number} statuses
   * @returns {ApiRequest} the same request
   */
  onStatus(callback, ...statuses) {
    statuses.forEach((status) => {
      if (!this.callbacks.onStatus[status]) {
        this.callbacks.onStatus[status] = new Pipe();
      }
      this.callbacks.onStatus[status].join(callback);
    });
    return this;
  }

  /**
   * Adds callback that will be fired on any not Ok results:
   * + fail
   * + error
   * + cancel
   *
   * @param {function} callback
   * @returns {ApiRequest} the same request
   */
  onAnyError(callback) {
    return this.onAny(callback, 'onFail', 'onError', 'onCancel');
  }

  /**
   * Creates and performs http request.
   * Cancels previous pending requests with the same method, url and identifier.
   *
   * @param {string|number} identifier - some identifier
   * @returns {Canceler} request cancel function
   */
  startSingle(identifier = '') {
    const info = hashCode(this.configs.method + this.configs.url + identifier);
    const requestId = Date.now(); // create current request id
    const pendingRequests = this.pendingRequests[info];

    // cancel pending requests
    if (pendingRequests) {
      for (let i = 0, l = Object.values(pendingRequests).length; i < l; i += 1) {
        pendingRequests[i](); // cancel request
      }
    } else {
      this.pendingRequests[info] = {};
    }
    const cancelRequestFunction = this.start();

    // add request cancel function to pending pending requests
    this.pendingRequests[info][requestId] = cancelRequestFunction;

    this.then(() => {
      delete this.pendingRequests[info][requestId]; // finally remove request from pending requests
    });

    return cancelRequestFunction;
  }

  /**
   * Performs http request.
   *
   * @returns {Canceler} request cancel function
   */
  start() {
    // setup request cancel token
    const source = Axios.CancelToken.source();
    const config = {
      ...this.configs,
      cancelToken: source.token,
    };

    // perform request
    this.axios.request(config)
      .then((res) => {
        if (Object.prototype.hasOwnProperty.call(this.callbacks.onStatus, res.status)) {
          this.callbacks.onStatus[res.status].process(res);
        }
        if (!this.validate || this.validate(res)) {
          this.callbacks.onOk.process(res);
        } else {
          this.callbacks.onFail.process(res);
        }
      })
      .catch((thrown) => {
        if (Axios.isCancel(thrown)) { // check whether request was cancelled
          this.callbacks.onCancel.process(thrown);
        } else {
          this.callbacks.onError.process(thrown);
        }
      });

    return source.cancel; // return cancel function
  }
}
