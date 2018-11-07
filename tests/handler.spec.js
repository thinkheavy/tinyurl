'use strict';

require('./config');

const LambdaTester = require('lambda-tester');
const { expect } = require('chai');
const storage = require('../storage');
var AWS = require('aws-sdk');

const handler = require( '../handler' );

// defaults to test with
const testURL = 'https://www.melodyvr.co.uk';
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

  it('should find or Save a URL', done => {
    return LambdaTester( handler.create )
      .event( {body: JSON.stringify({ url: testURL })} )
      .expectResult( function( result ) {
          expect(result).to.exist;
          expect(result.statusCode).to.equal(200);

          const body = JSON.parse(result.body);
          expect(body.shortCode).to.be.a('string');
          expect(body.url).to.equal(testURL);
          expect(body.visits).to.be.a('number');
          expect(body.createdAt).to.be.a('number');
          expect(body.viewedAt).to.be.a('number');
      })
      .verify( done );
  });

  it('should reuse existing ShortCodes', done => {
    storage.findOrCreateItem(testURL).then(item => {
      expect(item).to.exist;
      expect(item.shortCode).to.be.a('string');
      return LambdaTester( handler.create )
        .event( {body: JSON.stringify({ url: testURL })} )
        .expectResult( function( result ) {
            expect(result).to.exist;
            expect(result.statusCode).to.equal(200);

            const body = JSON.parse(result.body);
            expect(body.shortCode).to.equal(item.shortCode);
        })
        .verify( done );
    });
  });

  it('should check for a bad URL', done => {
    return LambdaTester( handler.create )
      .event( {body: JSON.stringify({ url: badTestURL })} )
      .expectResult( function( result ) {
          expect(result).to.exist;
          expect(result.statusCode).to.equal(400);
      })
      .verify( done );
  });

  it('should check for an empty string URL', done => {
    return LambdaTester( handler.create )
      .event( {body: JSON.stringify({ url: emptyTestURL })} )
      .expectResult( function( result ) {
          expect(result).to.exist;
          expect(result.statusCode).to.equal(400);
      })
      .verify( done );
  });

  it('should check for an undefined URL', done => {
    return LambdaTester( handler.create )
      .event( {body: JSON.stringify({})} )
      .expectResult( function( result ) {
          expect(result).to.exist;
          expect(result.statusCode).to.equal(400);
      })
      .verify( done );
  });

  it('should check for corrupt JSON', done => {
    return LambdaTester( handler.create )
      .event( {body: 'no json here' } )
      .expectResult( function( result ) {
          expect(result).to.exist;
          expect(result.statusCode).to.equal(400);
      })
      .verify( done );
  });

});


describe('Interacting with Short URLs', () => {

  let item;
  beforeAll(() => storage.findOrCreateItem(testURL).then(i=>{item=i}) );

  it('should get a URL using a ShortCode', done => {
    return LambdaTester( handler.stats )
      .event( {pathParameters: {shortCode:item.shortCode} } )
      .expectResult( function( result ) {
        expect(result).to.exist;
        expect(result.statusCode).to.equal(200);

        const body = JSON.parse(result.body)
        expect(body.url).to.equal(testURL);
        expect(body.shortCode).to.equal(item.shortCode);
        expect(body.visits).to.be.a('number');
      })
      .verify( done );
  });

  it('should error and return 404 when visiting a missing ShortCode', done => {
    return LambdaTester( handler.visit )
      .event( {pathParameters: {shortCode:badShortcode} } )
      .expectResult( function( result ) {
          expect(result).to.exist;
          expect(result.statusCode).to.equal(404);
      })
      .verify( done );
  });


});
