import Axios from "axios/index";
import {hashCode, Pipe} from "./utils";

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
     * @param {{}} configs  - Axios configs
     */
    constructor(axios, pendingRequests, validateFunc, configs) {
        this._axios = axios;
        this._pendingRequests = pendingRequests;
        this._configs = configs;
        this._callbacks = {
            onOk: new Pipe(),
            onFail: new Pipe(),
            onCancel: new Pipe(),
            onError: new Pipe(),
            /** @type {Object.<string, Pipe>} */
            onStatus: {}
        };
        this._validate = validateFunc;
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
        for (let eventName of eventNames) {
            if (this._callbacks.hasOwnProperty(eventName)) {
                this._callbacks[eventName].join(callback);
                continue;
            }
            const matchGroups = eventName.match(/onStatus=(.*)/);
            if (!matchGroups) continue;
            try {
                let statuses = JSON.parse(matchGroups[1]);
                if (Array.isArray(statuses)) {
                    this.onStatus(callback, ...statuses);
                } else {
                    this.onStatus(callback, statuses);
                }
            } catch (e) {
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
        this.onAny(callback, "onOk");
        return this;
    }

    /**
     * Adds callback to *failed* response.
     *
     * @param {function} callback
     * @returns {ApiRequest} the same request
     */
    onFail(callback) {
        this.onAny(callback, "onFail");
        return this;
    }

    /**
     * Adds callback to any response.
     *
     * @param {function} callback
     * @returns {ApiRequest} the same request
     */
    onResponse(callback) {
        this.onAny(callback, "onOk", "onFail");
        return this;
    }

    /**
     * Adds callback to request cancellation.
     *
     * @param {function} callback
     * @returns {ApiRequest} the same request
     */
    onCancel(callback) {
        this.onAny(callback, "onCancel");
        return this;
    }

    /**
     * Adds callback function that will be called on exception rise.
     *
     * @param {function} callback
     * @returns {ApiRequest} the same request
     */
    onError(callback) {
        this.onAny(callback, "onError");
        return this;
    }

    /**
     * Adds callback that will be fired last on any request result.
     *
     * @param {function} callback
     * @returns {ApiRequest} the same request
     */
    then(callback) {
        this.onAny(callback, "onOk", "onFail", "onCancel", "onError");
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
        statuses.forEach(status => {
            if (!this._callbacks.onStatus[status]) {
                this._callbacks.onStatus[status] = new Pipe();
            }
            this._callbacks.onStatus[status].join(callback);
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
        return this.onAny(callback, "onFail", "onError", "onCancel");
    }

    /**
     * Creates and performs http request.
     * Cancels previous pending requests with the same method, url and identifier.
     *
     * @param {string|number} identifier - some identifier
     * @returns {Canceler} request cancel function
     */
    startSingle(identifier = "") {
        const info = hashCode(this._configs.method + this._configs.url + identifier);
        const requestId = Date.now();    // create current request id

        // cancel pending requests
        if (this._pendingRequests[info]) {
            for (let prId in this._pendingRequests[info]) {
                if (this._pendingRequests[info].hasOwnProperty(prId)) {
                    this._pendingRequests[info][prId]();    // cancel request
                }
            }
        } else {
            this._pendingRequests[info] = {};
        }
        const cancelRequestFunction = this.start();

        this.then(() => {
            delete this._pendingRequests[info][requestId];    // finally remove request from pending requests
        });

        // add request cancel function to pending pending requests
        this._pendingRequests[info][requestId] = cancelRequestFunction;
        return cancelRequestFunction;
    }

    /**
     * Performs http request.
     *
     * @returns {Canceler} request cancel function
     */
    start() {
        // setup request cancel token
        const CancelToken = Axios.CancelToken;
        const source = CancelToken.source();
        const config = {
            ...this._configs,
            cancelToken: source.token
        };

        // perform request
        this._axios.request(config)
            .then(function (res) {
                if(this._callbacks.onStatus.hasOwnProperty(res.status)) {
                    this._callbacks.onStatus[res.status].process(res);
                }
                if (!this._validate || this._validate(res)) {
                    this._callbacks.onOk.process(res);
                } else {
                    this._callbacks.onFail.process(res);
                }
            }.bind(this))
            .catch(function (thrown) {
                if (Axios.isCancel(thrown)) {   // check whether request was cancelled
                    this._callbacks.onCancel.process(thrown);
                } else {
                    this._callbacks.onError.process(thrown);
                }
            }.bind(this));

        return source.cancel;        // return cancel function
    }
}
