import {AxiosResponse, Canceler, AxiosRequestConfig, AxiosInstance} from "axios";

/**
 * Function that decides whether response is *successful* or *failed*,
 * accepts Axios response object, should return `true` if response is *successful*.
 */
export type ValidateResponseFunc<ResponseData> = (data: AxiosResponse<ResponseData>) => boolean;

/**
 * Dictionary with pending request cancel functions.
 * Keys are hashes of request method, url and id.
 * Values are dictionaries with request ts as keys and request cancel functions as values.
 *
 * @example
 * {
 *      someHashString: {
 *          1520000000: cancelFunction
 *          1520000001: cancelFunction
 *      }
 * }
 */
export type PendingRequestsDict = {
    [requestHash: string]: { [requestId: string]: Canceler };
}

export type EventCallbackFunc<DataIn, DataOut = DataIn> = (data: DataIn) => DataOut;

export type RequestEventNames = 'onOk' | 'onFail' | 'onCancel' | 'onError' | `onStatus=${number}`;

export type ApiRequestError<Fail, Cancel> = { isCancel: true, data: Cancel }
    | { isFail: true, data: Fail }
    | { data: any };

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
export interface ApiRequest<Ok, Fail=Ok, Cancel = any> {
    /**
     * Stores configurations and initializes callback pipes.
     * Validate function will be used to evaluate whether response is successful or not.
     * Axios response object will be passed to the function,
     * and if `true` is returned the response is said to be *successful*.
     * If the function is `null` any response will be considered as *successful*.
     *
     * @param axios - Axios instance
     * @param pendingRequests  - dictionary with pending request cancel functions
     * @param validateFunc - function that decides whether a response is *successful* or *failed*
     * @param configs  - Axios configs
     */
    <In>(
        axios: AxiosInstance,
        pendingRequests: PendingRequestsDict,
        validateFunc: ValidateResponseFunc<In>,
        configs: AxiosRequestConfig
    ): ApiRequest<In>;

    /**
     * Attaches the callback to all specified events.
     * Supported event names: `"onOk"`, `"onFail"`, `"onCancel"`, `"onError"`, `"onStatus={status}"`.
     * All unsupported event names will be ignored.
     * Returns the same request.
     */
    onAny<OkOut = Ok, FailOut = Fail, CancelOut = Cancel>(
        callback: EventCallbackFunc<Ok | Fail | Cancel | any, OkOut | FailOut | CancelOut>,
        ...eventNames: RequestEventNames[]
    ): ApiRequest<OkOut, FailOut, CancelOut>;

    /**
     * Adds callback to *successful* response.
     * Returns the same request.
     */
    onOk<OkOut = Ok>(callback: EventCallbackFunc<Ok, OkOut>)
        : ApiRequest<OkOut, Fail, Cancel>;

    /**
     * Adds callback to *failed* response.
     * Returns the same request.
     */
    onFail<FailOut = Fail>(callback: EventCallbackFunc<Fail, FailOut>)
        : ApiRequest<Ok, FailOut, Cancel>;

    /**
     * Adds callback to any response.
     * Returns the same request.
     */
    onResponse<Out = Ok | Fail>(callback: EventCallbackFunc<Ok | Fail, Out>)
        : ApiRequest<Out, Out, Cancel>;

    /**
     * Adds callback to request cancellation.
     * Returns the same request.
     */
    onCancel<CancelOut = Cancel>(callback: EventCallbackFunc<Cancel, CancelOut>)
        : ApiRequest<Ok, Fail, CancelOut>;

    /**
     * Adds callback function that will be called on exception rise.
     * Returns the same request.
     */
    onError(callback: EventCallbackFunc<any, any>): ApiRequest<Ok, Fail, Cancel>;

    /**
     * Adds callback that will be fired last on any request result.
     * Returns the same request.
     */
    then<Out = Ok | Fail | Cancel>(callback: EventCallbackFunc<Ok | Fail | Cancel, Out>)
        : ApiRequest<Out, Out, Out>;

    /**
     * Adds callback to response with exact status code.
     * Returns the same request.
     */
    onStatus(callback: EventCallbackFunc<Ok | Fail | Cancel, any>, ...statuses: number[])
        : ApiRequest<Ok, Fail, Cancel>;

    /**
     * Adds callback that will be fired on any not Ok results:
     * + fail
     * + error
     * + cancel
     *
     * Returns the same request.
     */
    onAnyError<Out = Fail | Cancel>(callback: EventCallbackFunc<Fail | Cancel | any, Out>)
        : ApiRequest<Ok, Out, Out>;

    /**
     * Cancels requests if it is in pending state.
     */
    cancel(): void;

    /**
     * Creates and performs http request.
     * Cancels previous pending requests with the same method, url and identifier.
     *
     * Possible promise outcomes:
     * + `onOk` event will resolve the Promise with a data returned by the last `onOk` handler.
     * + `onFail` event will reject the Promise with an error with `isFail` property set `true`
     * and `data` property with a data returned by the last `onFail` handler.
     * + `onCancel` event will reject the Promise with an error with `isCancel` property set `true`
     * and `data` property with a data returned by the last `onCancel` handler.
     * + `onError` error will reject the Promise with a data returned by the last `onError` handler.
     *
     * @param identifier - some identifier
     */
    startSingle(identifier?: string): Promise<Ok>;

    /**
     * Performs http request.
     *
     * Possible promise outcomes:
     * + `onOk` event will resolve the Promise with a data returned by the last `onOk` handler.
     * + `onFail` event will reject the Promise with an error with `isFail` property set `true`
     * and `data` property with a data returned by the last `onFail` handler.
     * + `onCancel` event will reject the Promise with an error with `isCancel` property set `true`
     * and `data` property with a data returned by the last `onCancel` handler.
     * + `onError` error will reject the Promise with a data returned by the last `onError` handler.
     *
     * @param identifier - some identifier
     */
    start(identifier?: string): Promise<Ok>;

    //
    // /**
    //  * Creates and performs http request.
    //  * Cancels previous pending requests with the same method, url and identifier.
    //  *
    //  * Returns Canceler function if `promise` is set to false.
    //  * Otherwise returns a Promise:
    //  * + `onOk` event will resolve the Promise with a data returned by the last `onOk` handler.
    //  * + `onFail` event will reject the Promise with an error with `isFail` property set `true` and `data` property with a data returned by the last `onFail` handler.
    //  * + `onCancel` event will reject the Promise with an error with `isCancel` property set `true` and `data` property with a data returned by the last `onCancel` handler.
    //  * + `onError` error will reject the Promise with a data returned by the last `onError` handler.
    //  *
    //  * @param {string|number} identifier - some identifier
    //  * @param {boolean} promise
    //  * @returns {Canceler} request cancel function
    //  */
    // startSingle(identifier?: string, promise?: boolean): Canceler<T>
    //
    // /**
    //  * Performs http request.
    //  *
    //  * Returns Canceler function if `promise` is set to false.
    //  * Otherwise returns a Promise:
    //  * + `onOk` event will resolve the Promise with a data returned by the last `onOk` handler.
    //  * + `onFail` event will reject the Promise with an error with `isFail` property set `true` and `data` property with a data returned by the last `onFail` handler.
    //  * + `onCancel` event will reject the Promise with an error with `isCancel` property set `true` and `data` property with a data returned by the last `onCancel` handler.
    //  * + `onError` error will reject the Promise with a data returned by the last `onError` handler.
    //  *
    //  * @param {string|number} identifier - some identifier
    //  * @param {boolean} promise
    //  * @returns {Canceler|Promise} request cancel function, or Promise
    //  */
    // start(identifier?: string, promise?: boolean): Canceler<T>;
}

export type ApiRequestConfig<ResponseData> = {
    axios: AxiosInstance;
    validateFunc: ValidateResponseFunc<ResponseData>;
}

export interface ApiConnector<ApiResponseData = any> {
    (axiosConfigs?: AxiosRequestConfig, validateFunc?: ValidateResponseFunc<ApiResponseData>)
        : ApiConnector<ApiResponseData>;

    validateFunc: ValidateResponseFunc<ApiResponseData>;
    axios: AxiosInstance;

    /**
     * Creates GET request.
     *
     * @param url - API endpoint url
     * @param params - request uri parameters
     * @param axiosConfigs - Axios request configuration
     * @param apiConfigs - Axios request configuration
     */
    reqGet<ResponseData = ApiResponseData>(
        url: string,
        params?: any,
        axiosConfigs?: AxiosRequestConfig,
        apiConfigs?: ApiRequestConfig<ResponseData>
    ): ApiRequest<AxiosResponse<ResponseData>>;

    /**
     * Creates POST request.
     *
     * @param url - API endpoint url
     * @param data - request body data
     * @param params - request uri parameters
     * @param axiosConfigs - Axios request configuration
     * @param apiConfigs - Axios request configuration
     */
    reqPost<ResponseData = ApiResponseData>(
        url: string,
        data?: any,
        params?: any,
        axiosConfigs?: AxiosRequestConfig,
        apiConfigs?: ApiRequestConfig<ResponseData>
    ): ApiRequest<AxiosResponse<ResponseData>>;

    /**
     * Creates PATCH request.
     *
     * @param url - API endpoint url
     * @param data - request body data
     * @param params - request uri parameters
     * @param axiosConfigs - Axios request configuration
     * @param apiConfigs - Axios request configuration
     */
    reqPatch<ResponseData = ApiResponseData>(
        url: string,
        data?: any,
        params?: any,
        axiosConfigs?: AxiosRequestConfig,
        apiConfigs?: ApiRequestConfig<ResponseData>
    ): ApiRequest<AxiosResponse<ResponseData>>;

    /**
     * Creates PUT request.
     *
     * @param url - API endpoint url
     * @param data - request body data
     * @param params - request uri parameters
     * @param axiosConfigs - Axios request configuration
     * @param apiConfigs - Axios request configuration
     */
    reqPut<ResponseData = ApiResponseData>(
        url: string,
        data?: any,
        params?: any,
        axiosConfigs?: AxiosRequestConfig,
        apiConfigs?: ApiRequestConfig<ResponseData>
    ): ApiRequest<AxiosResponse<ResponseData>>;

    /**
     * Creates DELETE request.
     *
     * @param url - API endpoint url
     * @param params - request uri parameters
     * @param axiosConfigs - Axios request configuration
     * @param apiConfigs - Axios request configuration
     */
    reqDelete<ResponseData = ApiResponseData>(
        url: string,
        params?: any,
        axiosConfigs?: AxiosRequestConfig,
        apiConfigs?: ApiRequestConfig<ResponseData>
    ): ApiRequest<AxiosResponse<ResponseData>>;

    /**
     * Creates ApiRequest
     *
     * @param axiosConfigs - Axios request configuration
     * @param apiConfigs - Axios request configuration
     */
    request<ResponseData = ApiResponseData>(
        axiosConfigs?: AxiosRequestConfig,
        apiConfigs?: ApiRequestConfig<ResponseData>
    ): ApiRequest<AxiosResponse<ResponseData>>;
}

export interface ApiConnectorStatic extends ApiConnector {
    create<ResponseData = any>(
        axiosConfigs?: AxiosRequestConfig,
        validateFunc?: ValidateResponseFunc<ResponseData>
    ): ApiConnector<ResponseData>;
}

declare const Default: ApiConnectorStatic;

export default Default;
