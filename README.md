# MelodyVR Code Test
Technical test for MelodyVR. A URL shortener api using the Serverless Framework, AWS Lambda and DynamoDB.

### Pre-requisites
* Node 8 or above
* NPM
* Serverless Framework

Clone the project, be sure to run:
```
npm install
sls dynamodb install
```

### Tests

Local tests have been created using Jest and Chai and require a local DynamoDB server. To start a local DynamoDB server run:
```
sls dynamodb start --migrate
```

Then you can run the tests by running:
```
npm test
```

### Endpoints
**POST /**

Creates a new ShortCode for the specified URL.

BODY
```
{
    url: 'https://melodyvr.com'
}
```

*SUCCESS EXAMPLE*
```
{
    "url": "https://melodyvr.com",
    "shortCode": "eOl14do_5",
    "visits": 0,
    "createdAt": 1541297180379,
    "viewedAt": 1541301980526
}
```

*FAIL EXAMPLE*
```
{
    "error": "The URL provided is not well formed."
}
```


**GET /{shortCode}**

Redirects to a URL from a ShortCode, increments the visits and sets a new viewedAt timestamp.

*SUCCESS EXAMPLE*
User is redirected to the URL for the ShortCode.

*FAIL EXAMPLE*
```
{
    "error": "Could not find Short URL"
}
```

**GET /{shortCode}/stats**

Displays the stats for a given ShortCode.

*SUCCESS EXAMPLE*
```
{
    "shortCode": "eOl14do_5",
    "createdAt": 1541297180379,
    "viewedAt": 1541301980526,
    "url": "https://melodyvr.com/",
    "visits": 13
}
```

*FAIL EXAMPLE*
```
{
    "success": false,
    "error": "Could not find Short URL"
}
```
