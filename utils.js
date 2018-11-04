'use strict';

module.exports.makeErrorResponse = (error, callback) => {
  callback(null, {
    statusCode: error.statusCode || 501,
    body: JSON.stringify({error:error.message})
  });
};
