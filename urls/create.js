'use strict';

const storage = require('../storage');
const utils = require('../utils');

module.exports.create = (event, context, callback) => {
  // Has the url even been passed in?
  if(!event.queryStringParameters || !event.queryStringParameters.url){
    const error = new Error('Invalid request, please make sure you send a url parameter.');
    error.statusCode = 400;
    return utils.makeErrorResponse(error, callback);
  }
  storage.findOrCreateItem(event.queryStringParameters.url).then(item=>{
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(item),
    });
  }).catch(error=>{
    utils.makeErrorResponse(error, callback);
  });
};
