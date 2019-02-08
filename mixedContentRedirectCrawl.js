const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const lodash = require('lodash');
const parseCSV = require('./parseCSV').parseCSV;



// This function does the scanning for mixed content errors using puppeteer
const scanMixedContent = async (sites) => {
  const browser = await puppeteer.launch({
    headless: true
  })
  const page = await browser.newPage()

  // Get a handle for the client used by the page object to communicate with
  // the browser through the DevTools protocol
  const devToolsClient = page._client

  let failedRequests = new Map()
  let mixedContentIssues = new Set()
  let currentRunSite  = '';

  // Event fired when a request fired by the page failed
  page.on('requestfailed', request => {
    //console.log(request);
    // Store a reference to that request, we'll need to get more information
    // about Mixed Content errors later
    const siteIndex = lodash.findIndex(sites, function(o) { return o.siteName == currentRunSite });
sites[siteIndex].mixedContent.push({
  url: request.url(),
  resourceType: request.resourceType(),
  method: request.method()
});
    // failedRequests.set(currentRunSite, {
    //   url: request.url(),
    //   resourceType: request.resourceType(),
    //   method: request.method()
    // });
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

  for (let i = 0; i < sites.length; i++) {
    console.log(sites[i]);
    const { url, status, siteName } = sites[i];
    currentRunSite = siteName;
    if (status < 400) {
      console.log(`attempting to scan mixed content errors for ${siteName}`)
      const promise = page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.goto(`${url}`);
      await promise;
    }

  }

  // for (let requestId of mixedContentIssues) {
  //   console.log(failedRequests);
  //   const {
  //     method,
  //     url,
  //     resourceType
  //   } = failedRequests.get(requestId);
  //   //console.log(`Mixed Content warning when sending ${method} request to ${url} (${resourceType})`)
  // }
  browser.close();
  return sites;
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
    const [siteName, url] = site;
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        follow: 1
      });
      return {
        response: response,
        siteName,
        url
      }
    } catch (error) {
      if (error.type == 'max-redirect') {
        return {
          response: {
            status: 'too many re-directs'
          },
          siteName,
          url
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
  // determine the status code response of each site and track them
  const results = [];
  data.responses.forEach(item => {
    const fetchResponse = item.response;
    // add the url to array of urls under this status code
    // make a json object that has the siteName and the Url to push on the results array.
    results.push({
      siteName: item.siteName,
      url: item.url,
      status: fetchResponse.status,
      mixedContent: []
    });
  });
  //console.log(results);
  return results;
}).then(results => {








  // Take the results based on status code run the results through
  // the puppeteer mixed content errors script
  //console.log('final results:', results);
  const google = [{
    siteName: 'google',
    url: 'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html',
    status: 200,
    mixedContent: []
  }]
  console.log('- - - -  scanning urls for mixed content errors');
  return scanMixedContent(results);
}).then((mixedContentErrors) => {
  console.log(mixedContentErrors);
}).catch((error) => {
  console.error('Encountered an error while doing this thang:');
  console.error(error);
});
//Next step...Make sure we return all data we need in promise chain
