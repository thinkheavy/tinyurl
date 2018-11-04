'use strict';

module.exports.makeErrorResponse = (error, callback) => {
  callback(null, {
    statusCode: error.statusCode || 501,
    headers: { 'Content-Type': 'text/plain' },
    body: error.message,
  });
};
