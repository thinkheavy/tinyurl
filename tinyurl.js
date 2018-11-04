'use strict';

const storage = require('./storage');
const { makeError, makeErrorResponse, makeOkResponse, makeRedirectResponse } = require('./utils');

module.exports.create = (event, context, callback) => {
  // Has the url even been passed in?
  if(!event.body){
    const error = makeError('Invalid request, please make sure you send a url.', 400);
    return makeErrorResponse(error, callback);
  }

  let body;
  try{
    body = JSON.parse(event.body);
  }catch(e){
    const error = makeError('Invalid request, make sure you are sending JSON.', 400);
    return makeErrorResponse(error, callback);
  }

  storage.findOrCreateItem(body.url).then(item=>{
    makeOkResponse(item, callback);
  }).catch(error=>{
    makeErrorResponse(error, callback);
  });
};

module.exports.stats = (event, context, callback) => {
  storage.getItem(event.pathParameters.shortCode).then(item=>{
    makeOkResponse(item, callback);
  }).catch(error=>{
    makeErrorResponse(error, callback);
  });
};

module.exports.visit = (event, context, callback) => {
  storage.visitItem(event.pathParameters.shortCode).then(item=>{
    makeRedirectResponse(item.url, callback);
  }).catch((error)=>{
    makeErrorResponse(error, callback);
  });
};
