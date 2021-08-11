/**
 * Pipe allows to build conveyor of handler functions to process any data.
 * Pipe passes data through all handler functions in such a way that each handler takes a data from the previous handler's output.
 */
export class Pipe {
  constructor() {
    this.pipe = [];
    this.curData = null;
    this.curStep = 0;
  }

  /**
   * Attaches a handler function to the pipe.
   *
   * @param {function} handler
   * @return {Pipe}
   */
  join(handler) {
    this.pipe.push(handler);
    return this;
  }

  /**
   * Sequentially calls handler functions from the pipe.
   * The first handler function is called with the given data object.
   * Each subsequent handler takes a data from the previous handler's output.
   * If pipe has already been processed:
   * + calls only newly connected handlers
   * + ignores initialData parameter
   *
   * @param {*} initialData - data to be passed to the first handler.
   */
  process(initialData) {
    if (this.curStep === 0) {
      this.curData = initialData;
    }
    for (; this.curStep < this.pipe.length; this.curStep += 1) {
      this.curData = this.pipe[this.curStep](this.curData);
    }
  }
}

export function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i += 1) {
    /* eslint-disable no-bitwise */
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
    /* eslint-enable no-bitwise */
  }
  return hash;
}
