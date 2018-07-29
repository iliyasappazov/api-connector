/**
 * Calls `request.start()` and returns Promise that will be resolved after request completed.
 *
 * @param {ApiRequest} request
 * @return {Promise} promise that will be returned on
 */
export function testRequest(request) {
    return new Promise((resolve, reject) => {
        request.then(resolve).start();
    });
}

/**
 * Calls `request.startSingle()` and returns Promise that will be resolved after request completed.
 *
 * @param {ApiRequest} request
 * @return {Promise} promise that will be returned on
 */
export function testRequestSingle(request) {
    return new Promise((resolve, reject) => {
        request.then(resolve).startSingle();
    });
}
