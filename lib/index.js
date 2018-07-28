import {ApiConnector} from "./apiConnector";

class ApiConnectorStatic extends ApiConnector {
    /**
     * Creates api connector instance
     * @param configs {{}} - Axios configs
     * @param {Function} validateFunc - function that decides whether response is Ok or Failed,
     *                                  accepts Axios response object, should return true if response is Ok
     * @return ApiConnector
     */
    create(configs = {}, validateFunc = null) {
        return new ApiConnector(validateFunc, configs);
    }
}

const defaultConnector = new ApiConnectorStatic();
export default defaultConnector;
