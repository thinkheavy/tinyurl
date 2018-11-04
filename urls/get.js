'use strict';

const storage = require('../storage');
const utils = require('../utils');

module.exports.get = (event, context, callback) => {
  storage.getItem(event.pathParameters.shortCode).then(item=>{
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(item),
    });
  }).catch(error=>{
    utils.makeErrorResponse(error, callback);
  });
};
