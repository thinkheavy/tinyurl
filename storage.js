'use strict';

const validUrl = require('valid-url');
const shortid = require('shortid');
const AWS = require('aws-sdk');
const { makeError } = require('./utils');

const TableName = process.env.DYNAMODB_TABLE;
let dynamo = new AWS.DynamoDB.DocumentClient();

// Set the active DynamoDB Client, allows hotswapping for unit testing.
module.exports.setClient = newDynamo => {
  dynamo = newDynamo;
};

// Try and find an existing Short URL or create a new one
module.exports.findOrCreateItem = url => {

  if(!validUrl.isUri(url)){
    return Promise.reject( makeError('The URL provided is not well formed.', 400) );
  }

  return getItemByUrl(url).then(item=>{
    if(item) return item;

    return createItem(url).then(item=>{
      if(item) return item;
      throw makeError('Error Creating Short URL.');
    });
  });

};


// Save a new Short URL
const createItem = url => {
  const now = new Date().getTime();

  const Item = {
    shortCode: shortid.generate(),
    url,
    visits: 0,
    createdAt: now,
    viewedAt: now,
  };

  // Setup the query
  const params = { TableName, Item };

  // Try and save the Url
  return dynamo.put(params).promise().then(()=>Item);
};

// Try and find an item by URL
const getItemByUrl = module.exports.getItemByUrl = url => {
  const params = {
    TableName,
    FilterExpression: '#url = :url',
    ExpressionAttributeValues: {
      ":url": url
    },
    ExpressionAttributeNames: {
      "#url": 'url'
    }
  };

  return dynamo.scan(params).promise().then(result => (result.Items && result.Items.length) ? result.Items[0] : null );
};


// Get a ShortCode
module.exports.getItem = shortCode => {
  const params = {
    TableName,
    Key: {
      shortCode: shortCode
    }
  };

  return dynamo.get(params).promise().then(result => {
    if(!result.Item) throw makeError('Could not find Short URL', 404);

    return result.Item;
  });
};


// Visit a ShortCode, and by doing so increment the visits and update the viewedAt timestamp
module.exports.visitItem = shortCode => {
  const now = new Date().getTime();

  const params = {
    TableName,
    Key: {
      shortCode: shortCode,
    },
    ConditionExpression: 'attribute_exists(#url)', // Only update if exists!
    ExpressionAttributeNames: {
      '#visits': 'visits',
      '#viewedAt': 'viewedAt',
      '#url': 'url',
    },
    ExpressionAttributeValues: {
      ':visits': 1,
      ':viewedAt': now
    },
    UpdateExpression: 'SET #viewedAt = :viewedAt ADD #visits :visits',
    ReturnValues: 'ALL_NEW',
  };

  return dynamo.update(params).promise().then(result=>result.Attributes).catch(error=>{
    throw makeError('Could not find Short URL.', 404);
  });
};


// Deletes an item
module.exports.deleteItem = shortCode => {
  const params = {
    TableName,
    Key: {
      shortCode: shortCode
    }
  };

  return dynamo.delete(params).promise();
};
