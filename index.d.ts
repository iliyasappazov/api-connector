import {AxiosResponse, Canceler, AxiosStatic as Axios, AxiosRequestConfig} from "axios/index.d.ts";

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
     * @param {Axios} axios - Axios instance
     * @param {PendingRequestsDict} pendingRequests  - dictionary with pending request cancel functions
     * @param {ValidateResponseFunc} validateFunc - function that decides whether a response is *successful* or *failed*
     * @param {AxiosRequestConfig} configs  - Axios configs
     */
    (axios: Axios, pendingRequests: PendingRequestsDict, validateFunc: ValidateResponseFunc, configs: AxiosRequestConfig): ApiRequest;

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
     * Creates and performs http request.
     * Cancels previous pending requests with the same method, url and identifier.
     *
     * @param {string} identifier - some identifier
     * @returns {Canceler} request cancel function
     */
    startSingle(identifier?: string): Canceler

    /**
     * Performs http request.
     *
     * @returns {Canceler} request cancel function
     */
    start(): Canceler;
}

export interface ApiConnector {
    (validateFunc?: ValidateResponseFunc, configs?: AxiosRequestConfig): ApiConnector;

    validateFunc: ValidateResponseFunc;
    axios: Axios;

    apiGet(url: string, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    apiPost(url: string, data?: any, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    apiPatch(url: string, data?: any, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    apiPut(url: string, data?: any, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    apiDelete(url: string, params?: any, configs?: AxiosRequestConfig): ApiRequest;

    request(configs?: AxiosRequestConfig): ApiRequest;
}

interface ApiConnectorStatic extends ApiConnector {
    create(validateFunc?: ValidateResponseFunc, configs?: AxiosRequestConfig): ApiConnector;
}

declare const Default: ApiConnectorStatic;

export default Default;
