const csv = require('csv-parse');
const fs = require('fs');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const lodash = require('lodash');

// This function parses the CSV and returns the parsed data
function parseCSV(file) {
  return new Promise(function(resolve, reject) {
    var parser = csv({
        delimiter: ','
      },
      function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
        parser.end();
      });
    fs.createReadStream(file).pipe(parser);
  });
}

// This function does the scanning for mixed content errors using puppeteer
const scanMixedContent = async (urls) => {
  const browser = await puppeteer.launch({
    headless: true
  })
  const page = await browser.newPage()

  // Get a handle for the client used by the page object to communicate with
  // the browser through the DevTools protocol
  const devToolsClient = page._client

  let failedRequests = new Map()
  let mixedContentIssues = new Set()

  // Event fired when a request fired by the page failed
  page.on('requestfailed', request => {
    // Store a reference to that request, we'll need to get more information
    // about Mixed Content errors later
    failedRequests.set(request._requestId, {
      url: request.url(),
      resourceType: request.resourceType(),
      method: request.method()
    });
  });
  page.on('close', request => {
    return failedRequests;
  });

  // If a request failed due to a Mixed Content issue, log it
  page._client.on('Network.loadingFailed', event => {
    if (Object.is(event.blockedReason, 'mixed-content')) {
      mixedContentIssues.add(event.requestId)
    }
  });

  //await page.goto(urls.forEach() => (url){
await urls.forEach( async url => {
 try {await page.goto(url);
 }
 catch (errors){
   console.log(errors)
 };
});




  for (let requestId of mixedContentIssues) {
    const {
      method,
      url,
      resourceType
    } = failedRequests.get(requestId)
    //console.log(`Mixed Content warning when sending ${method} request to ${url} (${resourceType})`)
  }
  browser.close();
  return failedRequests;
}

// This is where the magic happens

// first parse the CSV
parseCSV("./containerTagUrls.csv").then((data) => {
  const sites = data.filter(site => site[1].startsWith('https'));
  return sites;
}, (reason) => {
  // if there is an error parsing CSV
  console.error(reason);
}).then(sites => {
  // fetch all sites and return a single promise when all are complete
  // return both the CSV data and the responses
  return Promise.all(sites.map(async site => {
    try {
      const response = await fetch(site[1], {
        redirect: 'follow',
        follow: 1
      });
      return {
        response: response,
        siteName: site[0],
        url: site[1]
      }
    } catch (error) {
      if (error.type == 'max-redirect') {
        return {
          response: {
            status: 'max-redirect'
          },
          siteName: site[0],
          url: site[1]
        }
      }
      console.log(error);
    }

  })).then((responses) => {
    //console.log(responses);
    return {
      responses: responses
    };
  });
}).then(data => {
  //console.log(data);
  // determine the status code response of each site and track them
  const results = {};

  data.responses.forEach(item => {
    const fetchResponse = item.response;
    // if the status doesn't exist in the object yet, add it with an empty array
    if (!results[fetchResponse.status]) {
      results[fetchResponse.status] = [];
    }

    // add the url to array of urls under this status code
    // make a json object that has the siteName and the Url to push on the results array.
    results[fetchResponse.status].push({
      siteName: item.siteName,
      url: item.url
    });
  });
  console.log(results);
  return results;
}).then(results => {
  // Take the results based on status code run the results through
  // the puppeteer mixed content errors script
  //console.log('final results:', results);
  const urls = [
    'https://pe.intentiq.com/profiles_engine/ProfilesEngineServlet?at=2&mi=10&dpt=',
    'https://d3ir0rz7vxwgq5.cloudfront.net/mwData.min.js',
    'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html'
  ];
  return scanMixedContent(urls);
}).then((mixedContentErrors) => {
  console.log(mixedContentErrors);
}).catch((error) => {
  console.error('Encountered an error while doing this thang:');
  console.error(error);
});
//Next step...Make sure we return all data we need in promise chain
