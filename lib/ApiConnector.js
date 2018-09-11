import Axios from 'axios';
import ApiRequest from './ApiRequest';

export default class ApiConnector {
  /**
   * Creates api connector instance
   * @param {AxiosRequestConfig} axiosConfigs - Axios configs
   * @param {Function} validateFunc - function that decides whether response is Ok or Failed,
   *                                  accepts Axios response object, should return true if response is Ok
   */
  constructor(axiosConfigs = {}, validateFunc = null) {
    this.validateFunc = validateFunc;
    this.axios = Axios.create(axiosConfigs);
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
   *
   * @param {string} url - API endpoint url
   * @param {{}} params - request uri parameters
   * @param {AxiosRequestConfig} axiosConfigs - Axios request configuration
   * @param {ApiRequestConfig} apiConfigs - ApiRequest configuration
   * @returns {ApiRequest} request promise
   */
  reqGet(url, params = {}, axiosConfigs = {}, apiConfigs = {}) {
    return this.request({
      method: 'GET', url, params, ...axiosConfigs,
    }, apiConfigs);
  }

  /**
   * Creates POST request.
   *
   * @param {string} url - API endpoint url
   * @param {{}} data - request body data
   * @param {{}} params - request uri parameters
   * @param {AxiosRequestConfig} axiosConfigs - Axios request configuration
   * @param {ApiRequestConfig} apiConfigs - ApiRequest configuration
   * @returns {ApiRequest} request promise
   */
  reqPost(url, data = undefined, params = {}, axiosConfigs = {}, apiConfigs = {}) {
    return this.request({
      method: 'POST', url, data, params, ...axiosConfigs,
    }, apiConfigs);
  }

  /**
   * Creates PATCH request.
   *
   * @param {string} url - API endpoint url
   * @param {{}} data - request body data
   * @param {{}} params - request uri parameters
   * @param {AxiosRequestConfig} axiosConfigs - Axios request configuration
   * @param {ApiRequestConfig} apiConfigs - ApiRequest configuration
   * @returns {ApiRequest} request promise
   */
  reqPatch(url, data = undefined, params = {}, axiosConfigs = {}, apiConfigs = {}) {
    return this.request({
      method: 'PATCH', url, data, params, ...axiosConfigs,
    }, apiConfigs);
  }

  /**
   * Creates PUT request.
   *
   * @param {string} url - API endpoint url
   * @param {{}} data - request body data
   * @param {{}} params - request uri parameters
   * @param {AxiosRequestConfig} axiosConfigs - Axios request configuration
   * @param {ApiRequestConfig} apiConfigs - ApiRequest configuration
   * @returns {ApiRequest} request promise
   */
  reqPut(url, data = undefined, params = {}, axiosConfigs = {}, apiConfigs = {}) {
    return this.request({
      method: 'PUT', url, data, params, ...axiosConfigs,
    }, apiConfigs);
  }

  /**
   * Creates DELETE request.
   *
   * @param {string} url - API endpoint url
   * @param {{}} params - request uri parameters
   * @param {AxiosRequestConfig} axiosConfigs - Axios request configuration
   * @param {ApiRequestConfig} apiConfigs - ApiRequest configuration
   * @returns {ApiRequest} request promise
   */
  reqDelete(url, params = {}, axiosConfigs = {}, apiConfigs = {}) {
    return this.request({
      method: 'DELETE', url, params, ...axiosConfigs,
    }, apiConfigs);
  }

  /**
   * Creates ApiRequest
   *
   * @param {AxiosRequestConfig} axiosConfigs - Axios configs
   * @param {ApiRequestConfig} apiConfigs - ApiRequest configuration
   * @returns {ApiRequest} request promise
   */
  request(axiosConfigs, apiConfigs) {
    const curConfigs = {
      axios: this.axios,
      validateFunc: this.validateFunc,
      ...apiConfigs,
    };
    return new ApiRequest(curConfigs.axios, this.pendingRequests, curConfigs.validateFunc, axiosConfigs);
  }
}
