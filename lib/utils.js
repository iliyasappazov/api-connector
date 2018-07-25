/**
 * Pipe allows to build conveyor of handler functions to process any data.
 * Pipe passes data through all handler functions in such a way that each handler takes a data from the previous handler's output.
 */
export class Pipe {
    constructor(){
        this._pipe = [];
    }

    /**
     * Attaches a handler function to the pipe.
     *
     * @param {function} handler
     */
    join(handler) {
        this._pipe.append(handler);
    }

    /**
     * Sequentially calls handler functions from the pipe.
     * The first handler function is called with the given data object.
     * Each subsequent handler takes a data from the previous handler's output.
     *
     * @param {*} data - data to be passed to the first handler.
     */
    process(data) {
        this._pipe.forEach((cb) => data = cb(data));
    }
}


export function hashCode(str) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
