const puppeteer = require('puppeteer');
const lodash = require('lodash');

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
  let currentRunSite = '';

  // Event fired when a request fired by the page failed
  page.on('requestfailed', request => {
    // Store a reference to that request, we'll need to get more information
    // about Mixed Content errors later
    const siteIndex = lodash.findIndex(sites, function(o) {
      return o.siteName == currentRunSite
    });
    sites[siteIndex].mixedContent.push({
      url: request.url(),
      resourceType: request.resourceType(),
      method: request.method()
    });

  });
  page.on('close', request => {
    return failedRequests;
  });
  page.on('error', error => {
    console.log('itsallfekied');
    console.log(error);
  });

  // If a request failed due to a Mixed Content issue, log it
  page._client.on('Network.loadingFailed', event => {
    if (Object.is(event.blockedReason, 'mixed-content')) {
      mixedContentIssues.add(event.requestId)
    }
  });

  for (let i = 0; i < 5; i++) {
    const {
      url,
      status,
      siteName
    } = sites[i];
    currentRunSite = siteName;
    if (status < 400) {
      console.log(`attempting to scan mixed content errors for ${siteName}`)
      const promise = page.waitForNavigation({
        waitUntil: 'networkidle2'
      });
      await page.goto(`${url}`);
      await promise;
    }

  }


  browser.close();
   return sites;
}

module.exports = {
  scanMixedContent
};
