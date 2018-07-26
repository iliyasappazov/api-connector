import {ApiConnector} from "./apiConnector";

class ApiConnectorStatic extends ApiConnector {
    /**
     * Creates api connector instance
     * @param {Function} validateFunc - function that decides whether response is Ok or Failed,
     *                                  accepts Axios response object, should return true if response is Ok
     * @param configs {{}} - Axios configs
     * @return ApiConnector
     */
    create(validateFunc = null, configs = {}) {
        return new ApiConnector(validateFunc, configs);
    }
}

const defaultConnector = new ApiConnectorStatic();
export default defaultConnector;
