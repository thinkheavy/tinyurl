'use strict';

require('./config');

const { expect } = require('chai');
const storage = require('../storage');
var AWS = require('aws-sdk');

// defaults to test with
const testURL = 'https://www.melodyvr.co.uk';
const badTestURL = 'bad';
const emptyTestURL = '';
const badShortcode = 'bad';


beforeAll(() => {
  return new Promise((resolve, reject) => {
    // Set local Dynamo Client to local server
    const dynamo = new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    });
    storage.setClient(dynamo);

    // Clear the test data
    storage.getItemByUrl(testURL).then(item => {
      if(!item) return resolve();
      storage.deleteItem(item.shortCode).then(result => {
        resolve();
      });
    });
  });
});

afterAll(() => {
  // Restore the default client
  const dynamo = new AWS.DynamoDB.DocumentClient();
  storage.setClient(dynamo);
});


describe('Saving Short URLs', () => {

  it('Should find or Save a URL', done => {
    storage.findOrCreateItem(testURL).then(result => {
      expect(result).to.exist;
      expect(result.shortCode).to.be.a('string');
      expect(result.url).to.equal(testURL);
      expect(result.visits).to.be.a('number');
      expect(result.createdAt).to.be.a('number');
      expect(result.viewedAt).to.be.a('number');
      done();
    });
  });

  it('Should reuse existing ShortCodes', done => {
    storage.findOrCreateItem(testURL).then(result => {
      expect(result).to.exist;
      expect(result.shortCode).to.be.a('string');
      storage.findOrCreateItem(testURL).then(item => {
        expect(item).to.exist;
        expect(item.shortCode).to.equal(result.shortCode);
        done();
      });
    });
  });

  it('Should check for a bad URL', done => {
    storage.findOrCreateItem(badTestURL).then(result => {
      done('Should have errored creating item!');
    }).catch(error=>{
      done();
    });
  });

  it('Should check for an empty string URL', done => {
    storage.findOrCreateItem(emptyTestURL).then(result => {
      done('Should have errored creating item!');
    }).catch(error=>{
      done();
    });
  });

  it('Should check for an undefined URL while creating', done => {
    storage.findOrCreateItem().then(result => {
      done('Should have errored creating item!');
    }).catch(error=>{
      done();
    });
  });

});


describe('Interacting with Short URLs', () => {

  it('Should get a URL using a ShortCode', done => {
    storage.findOrCreateItem(testURL).then(item => {
      storage.getItem(item.shortCode).then(result => {
        expect(result).to.exist;
        expect(result.url).to.equal(testURL);
        expect(result.shortCode).to.equal(item.shortCode);
        expect(result.visits).to.be.a('number');
        done();
      });
    });
  });

  it('Should get a URL using a URL', done => {
    storage.findOrCreateItem(testURL).then(item => {
      storage.getItemByUrl(testURL).then(result => {
        expect(result).to.exist;
        expect(result.url).to.equal(testURL);
        done();
      });
    });
  });

  it('Should increment visits and set new viewedAt when visited', done => {
    storage.findOrCreateItem(testURL).then(item => {
      expect(item.visits).to.be.a('number');
      storage.visitItem(item.shortCode).then(result => {
        expect(result).to.exist;
        expect(result.visits).to.be.a('number');
        expect(result.visits).to.equal(item.visits+1);
        expect(result.viewedAt).to.not.equal(item.viewedAt);
        done();
      });
    });
  });

  it('Should error and return 404 when visiting a missing ShortCode', done => {
    storage.visitItem(badShortcode).then(item => {
      done('Should have errored finding item!');
    }).catch((error)=>{
      expect(error.statusCode).to.equal(404);
      done();
    });
  });

});
