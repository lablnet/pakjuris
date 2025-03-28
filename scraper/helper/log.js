const fs = require('fs');


/**
 * Logger utility to log messages to console and file
 * @type {{log: (function(...[*]): void), error: (function(...[*]): void), info: (function(...[*]): void), warn: (function(...[*]): void), _write: (function(*=, *=): void)}}
 * @example logger.log('Hello World');
 * 
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * @since v1.0.0
 */
const logger = {
    log: (...message) => logger._write('LOG', message),
    error: (...message) => logger._write('ERROR', message),
    info: (...message) => logger._write('INFO', message),
    warn: (...message) => logger._write('WARN', message),
    _write: (type, message) => {
        // if message is an array, convert it to a string
        if (Array.isArray(message)) {
            message = message.map((msg) => {
                if (typeof msg === 'object') {
                    return JSON.stringify(msg, null, 2);
                }
                return msg;
            });
        }
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} [${type}] ${message.join(' ')}\n`;
        switch (type) {
            case 'LOG':
                console.log(logMessage);
                break;
            case 'ERROR':
                console.error(logMessage);
                break;
            case 'INFO':
                console.info(logMessage);
                break;
            case 'WARN':
                console.warn(logMessage);
                break;
        }
        fs.appendFile('app.log', logMessage, (err) => {
            if (err) {
                console.error('Error writing log message:', err);
            }
        });
    }
}

module.exports = logger;