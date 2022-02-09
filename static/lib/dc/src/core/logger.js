/**
 * Provides basis logging and deprecation utilities
 */
export class Logger {

    constructor () {
        /**
         * Enable debug level logging. Set to `false` by default.
         * @name enableDebugLog
         * @memberof Logger
         * @instance
         */
        this.enableDebugLog = false;

        this._alreadyWarned = {};
    }

    /**
     * Put a warning message to console
     * @example
     * logger.warn('Invalid use of .tension on CurveLinear');
     * @param {String} [msg]
     * @returns {Logger}
     */
    warn (msg) {
        if (console) {
            if (console.warn) {
                console.warn(msg);
            } else if (console.log) {
                console.log(msg);
            }
        }

        return this;
    }

    /**
     * Put a warning message to console. It will warn only on unique messages.
     * @example
     * logger.warnOnce('Invalid use of .tension on CurveLinear');
     * @param {String} [msg]
     * @returns {Logger}
     */
    warnOnce (msg) {
        if (!this._alreadyWarned[msg]) {
            this._alreadyWarned[msg] = true;

            logger.warn(msg);
        }

        return this;
    }

    /**
     * Put a debug message to console. It is controlled by `logger.enableDebugLog`
     * @example
     * logger.debug('Total number of slices: ' + numSlices);
     * @param {String} [msg]
     * @returns {Logger}
     */
    debug (msg) {
        if (this.enableDebugLog && console) {
            if (console.debug) {
                console.debug(msg);
            } else if (console.log) {
                console.log(msg);
            }
        }

        return this;
    }
}

export const logger = new Logger();
