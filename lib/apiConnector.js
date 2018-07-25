import Axios from "axios";
import ApiRequest from "./apiRequest";

export default class ApiConnector {
    /**
     * Creates api connector instance
     * @param {Function} validateFunc - function that decides whether response is Ok or Failed,
     *                                  accepts Axios response object, should return true if response is Ok
     * @param configs {{}} - Axios configs
     */
    constructor(validateFunc = null, configs = {}) {
        this.validateFunc = validateFunc;
        this.axios = Axios.create(configs);
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
        this.pendingRequests = {};
    }

    /**
     * Creates GET request.
     * @param {string} url - API endpoint url
     * @param {{}} params - request uri parameters
     * @param {{}} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    apiGet(url, params = {}, configs = {}) {
        return this.request({method: "GET", url, params, ...configs});
    }

    /**
     * Creates POST request.
     * @param {string} url - API endpoint url
     * @param {{}} data - request body data
     * @param {{}} params - request uri parameters
     * @param {{}} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    apiPost(url, data = undefined, params = {}, configs = {}) {
        return this.request({method: "POST", url, data, params, ...configs});
    }

    /**
     * Creates PATCH request.
     * @param {string} url - API endpoint url
     * @param {{}} data - request body data
     * @param {{}} params - request uri parameters
     * @param {{}} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    apiPatch(url, data, params = {}, configs = {}) {
        return this.request({method: "PATCH", url, data, params, ...configs});
    }

    /**
     * Creates PUT request.
     * @param {string} url - API endpoint url
     * @param {{}} data - request body data
     * @param {{}} params - request uri parameters
     * @param {{}} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    apiPut(url, data = undefined, params = {}, configs = {}) {
        return this.request({method: "PUT", url, data, params, ...configs});
    }

    /**
     * Creates DELETE request.
     * @param {string} url - API endpoint url
     * @param {{}} params - request uri parameters
     * @param {{}} configs - Axios request configuration
     * @returns {ApiRequest} request promise
     */
    apiDelete(url, params = {}, configs = {}) {
        return this.request({method: "DELETE", url, params, ...configs});
    }

    /**
     * Creates ApiRequest
     *
     * @param {{}} configs - Axios configs
     * @returns {ApiRequest} request promise
     */
    request(configs) {
        return new ApiRequest(this.axios, this.pendingRequests, this.validateFunc, configs);
    }
}
