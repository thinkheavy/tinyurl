'use strict';

const storage = require('../storage');
const utils = require('../utils');

module.exports.visit = (event, context, callback) => {
  storage.visitItem(event.pathParameters.shortCode).then(item=>{
    callback(null, {
      statusCode: 302,
      headers: {
        Location: item.url
      }
    });
  }).catch((error)=>{
    utils.makeErrorResponse(error, callback);
  });
};
