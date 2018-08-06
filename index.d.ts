import {AxiosResponse, Canceler, AxiosRequestConfig, AxiosInstance} from "axios";

/**
 * Function that decides whether response is *successful* or *failed*,
 * accepts Axios response object, should return `true` if response is *successful*.
 */
interface ValidateResponseFunc {
    (data: AxiosResponse): boolean;
}

/**
 * Dictionary with pending request cancel functions.
 * Keys are hashes of request method, url and id.
 * Values are another dictionaries - with request ts as keys and request cancel functions as values.
 *
 * @example
 * {
 *      someHashString: {
 *          1520000000: cancelFunction
 *          1520000001: cancelFunction
 *      }
 * }
 */
interface PendingRequestsDict {
    [requestHash: string]: { [requestId: string]: Canceler };
}

interface EventCallbackFunc {
    (data: any): any;
}

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
interface ApiRequest {
    /**
     * Stores configurations and initializes callback pipes.
     * Validate function will be used to evaluate response success.
     * Axios response object will be passed to the function, and if `true` is returned the response is said to be *successful*.
     * If the function is `null` any response will be considered as *successful*.
     *
     * @param {AxiosInstance} axios - Axios instance
     * @param {PendingRequestsDict} pendingRequests  - dictionary with pending request cancel functions
     * @param {ValidateResponseFunc} validateFunc - function that decides whether a response is *successful* or *failed*
     * @param {AxiosRequestConfig} configs  - Axios configs
     */
    (axios: AxiosInstance, pendingRequests: PendingRequestsDict, validateFunc: ValidateResponseFunc, configs: AxiosRequestConfig): ApiRequest;

    /**
     * Attaches callback to all given events.
     * Supported event names: `"onOk"`, `"onFail"`, `"onCancel"`, `"onError"`, `"onStatus={status}"`.
     * All unsupported event names will be ignored.
     *
     * @param {EventCallbackFunc} callback
     * @param {...string} eventNames
     * @returns {ApiRequest} the same request
     */
    onAny(callback: EventCallbackFunc, ...eventNames: string[]): ApiRequest;

    /**
     * Adds callback to *successful* response.
     *
     * @param {EventCallbackFunc} callback
     * @returns {ApiRequest} the same request
     */
    onOk(callback: EventCallbackFunc): ApiRequest;

    /**
     * Adds callback to *failed* response.
     *
     * @param {EventCallbackFunc} callback
     * @returns {ApiRequest} the same request
     */
    onFail(callback: EventCallbackFunc): ApiRequest;

    /**
     * Adds callback to any response.
     *
     * @param {EventCallbackFunc} callback
     * @returns {ApiRequest} the same request
     */
    onResponse(callback: EventCallbackFunc): ApiRequest;

    /**
     * Adds callback to request cancellation.
     *
     * @param {EventCallbackFunc} callback
     * @returns {ApiRequest} the same request
     */
    onResponse(callback: EventCallbackFunc): ApiRequest;

    /**
     * Adds callback function that will be called on exception rise.
     *
     * @param {EventCallbackFunc} callback
     * @returns {ApiRequest} the same request
     */
    onError(callback: EventCallbackFunc): ApiRequest;

    /**
     * Adds callback that will be fired last on any request result.
     *
     * @param {EventCallbackFunc} callback
     * @returns {ApiRequest} the same request
     */
    then(callback: EventCallbackFunc): ApiRequest;

    /**
     * Adds callback to response with exact status code.
     *
     * @param {EventCallbackFunc} callback
     * @param {...number} statuses
     * @returns {ApiRequest} the same request
     */
    onStatus(callback: EventCallbackFunc, ...statuses: number[]): ApiRequest;

    /**
     * Adds callback that will be fired on any not Ok results:
     * + fail
     * + error
     * + cancel
     *
     * @param {function} callback
     * @returns {ApiRequest} the same request
     */
    onAnyError(callback: EventCallbackFunc): ApiRequest;

    /**
     * Cancels requests if it is in pending state.
     */
    cancel(): void;

    /**
     * Creates and performs http request.
     * Cancels previous pending requests with the same method, url and identifier.
     *
     * Returns Canceler function if `promise` is set to false.
     * Otherwise returns a Promise:
     * + `onOk` event will resolve the Promise with a data returned by the last onOk handler.
     * + `onFail` event will reject the Promise with an error with `isFail` property set `true` and `data` property with a data returned by the last `onFail` handler.
     * + `onCancel` event will reject the Promise with an error with `isCancel` property set `true` and `data` property with a data returned by the last `onCancel` handler.
     * + `onError` error will reject the Promise with a data returned by the last `onError` handler.
     *
     * @param {string|number} identifier - some identifier
     * @param {boolean} promise
     * @returns {Canceler} request cancel function
     */
    startSingle(identifier?: string, promise?: boolean): Canceler

    /**
     * Performs http request.
     *
     * Returns Canceler function if `promise` is set to false.
     * Otherwise returns a Promise:
     * + `onOk` event will resolve the Promise with a data returned by the last onOk handler.
     * + `onFail` event will reject the Promise with an error with `isFail` property set `true` and `data` property with a data returned by the last `onFail` handler.
     * + `onCancel` event will reject the Promise with an error with `isCancel` property set `true` and `data` property with a data returned by the last `onCancel` handler.
     * + `onError` error will reject the Promise with a data returned by the last `onError` handler.
     *
     * @param {string|number} identifier - some identifier
     * @param {boolean} promise
     * @returns {Canceler|Promise} request cancel function, or Promise
     */
    start(identifier?: string, promise?: boolean): Canceler;
}

export interface ApiConnector {
    (configs?: AxiosRequestConfig, validateFunc?: ValidateResponseFunc): ApiConnector;

    validateFunc: ValidateResponseFunc;
    axios: AxiosInstance;

    /**
     * Creates GET request.
     *
     * @param {string} url - API endpoint url
     * @param {{}} params - request uri parameters
     * @param {AxiosRequestConfig} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    reqGet(url: string, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    /**
     * Creates POST request.
     *
     * @param {string} url - API endpoint url
     * @param {{}} data - request body data
     * @param {{}} params - request uri parameters
     * @param {AxiosRequestConfig} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    reqPost(url: string, data?: any, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    /**
     * Creates PATCH request.
     *
     * @param {string} url - API endpoint url
     * @param {{}} data - request body data
     * @param {{}} params - request uri parameters
     * @param {AxiosRequestConfig} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    reqPatch(url: string, data?: any, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    /**
     * Creates PUT request.
     *
     * @param {string} url - API endpoint url
     * @param {{}} data - request body data
     * @param {{}} params - request uri parameters
     * @param {AxiosRequestConfig} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    reqPut(url: string, data?: any, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    /**
     * Creates DELETE request.
     *
     * @param {string} url - API endpoint url
     * @param {{}} params - request uri parameters
     * @param {AxiosRequestConfig} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    reqDelete(url: string, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    /**
     * Creates ApiRequest
     *
     * @param {AxiosRequestConfig} configs - Axios configs
     * @returns {ApiRequest} request promise
     */
    request(configs?: AxiosRequestConfig): ApiRequest;
}

interface ApiConnectorStatic extends ApiConnector {
    create(configs?: AxiosRequestConfig, validateFunc?: ValidateResponseFunc): ApiConnector;
}

declare const Default: ApiConnectorStatic;

export default Default;
