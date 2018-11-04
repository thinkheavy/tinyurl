'use strict';

module.exports.makeError = (message, statusCode) => {
  const error = new Error(message);
  if(statusCode) error.statusCode = statusCode;
  return error;
};

module.exports.makeErrorResponse = (error, callback) => {
  callback(null, {
    statusCode: error.statusCode || 501,
    body: JSON.stringify({error:error.message})
  });
};

module.exports.makeOkResponse = (data, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(data),
  });
};

module.exports.makeRedirectResponse = (location, callback) => {
  callback(null, {
    statusCode: 302,
    headers: {
      Location: location
    }
  });
};
