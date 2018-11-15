// Node modules
const puppeteer = require('puppeteer')
import parseCsv from './parseCsv';
console.log(parseCsv);
const EXAMPLE_URL = 'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html';
//const EXAMPLE_URL = 'https://mattjamesvisuals.com'

const main = async () => {
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  const siteUrls = await parseCsv("./containerTagUrls.csv");

  // Get a handle for the client used by the page object to communicate with
  // the browser through the DevTools protocol
  const devToolsClient = page._client

  let failedRequests = new Map()
  let mixedContentIssues = new Set()

  // Event fired when a request fired by the page failed
  page.on('requestfailed', request => {
    const {url, resourceType, method} = request
    // Store a reference to that request, we'll need to get more information
    // about Mixed Content errors later
    console.log(request.url());
    failedRequests.set(request._requestId, {
      url: request.url(),
      resourceType: request.resourceType(),
      method: request.method()
    })
  })

  // If a request failed due to a Mixed Content issue, log it
  page._client.on('Network.loadingFailed', event => {
    if (Object.is(event.blockedReason, 'mixed-content')) {
      mixedContentIssues.add(event.requestId)
      console.log(event);
    }
  })

  await page.goto(EXAMPLE_URL)
  //console.log(failedRequests, 'failedRequests');
  //console.log(mixedContentIssues, 'mixedContentIssues');
  for (let requestId of mixedContentIssues) {
    const {method, url, resourceType} = failedRequests.get(requestId)
    //console.log(`Mixed Content warning when sending ${method} request to ${url} (${resourceType})`)
    console.log(`Mixed Content warning when sending `,failedRequests.get(requestId))

  }
  browser.close()
}
try {
  main()
} catch(error) {
  console.error(error)
}
