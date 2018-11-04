'use strict';

const storage = require('../storage');
const utils = require('../utils');

module.exports.create = (event, context, callback) => {
  // Has the url even been passed in?
  if(!event.body){
    const error = new Error('Invalid request, please make sure you send a url.');
    error.statusCode = 400;
    return utils.makeErrorResponse(error, callback);
  }

  let body;
  try{
    body = JSON.parse(event.body);
  }catch(e){
    const error = new Error('Invalid request, make sure you are sending JSON.');
    error.statusCode = 400;
    return utils.makeErrorResponse(error, callback);
  }

  storage.findOrCreateItem(body.url).then(item=>{
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(item),
    });
  }).catch(error=>{
    utils.makeErrorResponse(error, callback);
  });
};
