'use strict';

require('./config');

const { expect } = require('chai');
const storage = require('../storage');
var AWS = require('aws-sdk');

// defaults to test with
const testURL = 'https://www.microsoft.co.uk';
const badTestURL = 'bad';
const emptyTestURL = '';
const badShortcode = 'bad';


beforeAll(async () => {
  const dynamo = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
  storage.setClient(dynamo);

  // Clear the test data
  const item = await storage.getItemByUrl(testURL)
  if(!item) return;

  await storage.deleteItem(item.shortCode);
});

afterAll(() => {
  // Restore the default client
  const dynamo = new AWS.DynamoDB.DocumentClient();
  storage.setClient(dynamo);
});


describe('Saving Short URLs', () => {

  it('should find or Save a URL', async () => {
    const result = await storage.findOrCreateItem(testURL);
    expect(result).to.exist;
    expect(result.shortCode).to.be.a('string');
    expect(result.url).to.equal(testURL);
    expect(result.visits).to.be.a('number');
    expect(result.createdAt).to.be.a('number');
    expect(result.viewedAt).to.be.a('number');
  });

  it('should reuse existing ShortCodes', async () => {
    const result = await storage.findOrCreateItem(testURL);
    expect(result).to.exist;
    expect(result.shortCode).to.be.a('string');

    const item = await storage.findOrCreateItem(testURL);
    expect(item).to.exist;
    expect(item.shortCode).to.equal(result.shortCode);
  });


  it('should check for a bad URL', async () => {
    try{
      const result = await storage.findOrCreateItem(badTestURL);
    }catch(e){
      return;
    }
    throw new Error('Should have errored creating item!');
  });

  it('should check for an empty string URL', async () => {
    try{
      const result = await storage.findOrCreateItem(emptyTestURL);
    }catch(e){
      return;
    }
    throw new Error('Should have errored creating item!');
  });

  it('should check for an undefined URL while creating', async () => {
    try{
      const result = await storage.findOrCreateItem();
    }catch(e){
      return;
    }
    throw new Error('Should have errored creating item!');
  });

});

//
describe('Interacting with Short URLs', () => {

  let item;
  beforeAll(() => storage.findOrCreateItem(testURL).then(i=>{item=i}) );

  it('should get a URL using a ShortCode', async () => {
    const result = await storage.getItem(item.shortCode);
    expect(result).to.exist;
    expect(result.url).to.equal(testURL);
    expect(result.shortCode).to.equal(item.shortCode);
    expect(result.visits).to.be.a('number');
  });

  it('should get a URL using a URL', async () => {
    const result = await storage.getItemByUrl(testURL);
    expect(result).to.exist;
    expect(result.url).to.equal(testURL);
  });

  it('should increment visits and set new viewedAt when visited', async () => {
    expect(item.visits).to.be.a('number');
    const result = await storage.visitItem(item.shortCode);
    expect(result).to.exist;
    expect(result.visits).to.be.a('number');
    expect(result.visits).to.equal(item.visits+1);
    expect(result.viewedAt).to.not.equal(item.viewedAt);
  });

  it('should error and return 404 when visiting a missing ShortCode', async () => {
    try{
      const result = await storage.visitItem(badShortcode);
    }catch(e){
      return;
    }
    throw new Error('Should have errored finding item!');
  });

});
