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
module.exports.findOrCreateItem = async url => {
  if(!validUrl.isUri(url)) throw makeError('The URL provided is not well formed.', 400);

  const existingItem = await getItemByUrl(url);
  if(existingItem) return existingItem;

  const newItem = await createItem(url);
  if(newItem) return newItem;

  throw makeError('Error Creating Short URL.');
};


// Save a new Short URL
const createItem = async url => {
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
  await dynamo.put(params).promise();

  return Item;
};

// Try and find an item by URL
const getItemByUrl = module.exports.getItemByUrl = async url => {
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

  const { Items } = await dynamo.scan(params).promise();

  return (Items && Items.length) ? Items[0] : null;
};


// Get a ShortCode
module.exports.getItem = async shortCode => {
  const params = {
    TableName,
    Key: {
      shortCode: shortCode
    }
  };

  const result = await dynamo.get(params).promise();
  if(!result.Item) throw makeError('Could not find Short URL', 404);
  return result.Item;
};


// Visit a ShortCode, and by doing so increment the visits and update the viewedAt timestamp
module.exports.visitItem = async shortCode => {
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

  try {
    const result = await dynamo.update(params).promise();
    return result.Attributes;
  } catch (error) {
    throw makeError('Could not find Short URL.', 404);
  }
};


// Deletes an item
module.exports.deleteItem = async shortCode => {
  const params = {
    TableName,
    Key: {
      shortCode: shortCode
    }
  };

  await dynamo.delete(params).promise();
};
