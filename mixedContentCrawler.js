// Node modules
const puppeteer = require('puppeteer')
const fs = require('fs');
const parse = require('csv-parse')
const EXAMPLE_URL = 'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html';

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false
  })

  const page = await browser.newPage()
  // Get a handle for the client used by the page object to communicate with
  // the browser through the DevTools protocol
  const devToolsClient = page._client

  let failedRequests = new Map()
  let mixedContentIssues = new Set()

  // Event fired when a request fired by the page failed
  page.on('requestfailed', request => {
    const {
      url,
      resourceType,
      method
    } = request
    // Store a reference to that request, we'll need to get more information
    // about Mixed Content errors later
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
  //This is where were reading the csv file
  fs.readFile("./containerTagUrls_smaller.csv", 'utf8', function(err, contents) {
   //console.log("contents 1 :: " + contents);
    parse(contents, function(err, output) {
      var count = 5;
      output.forEach(async function(value) {
        var URI = value.toString().split(",")[1];
        if (URI != null && URI.startsWith("https") && count > 0) {
          //count = count -1;
          //console.log("URI :: " + URI);
          const pagee = await browser.newPage()
          pagee.goto(URI);

          // Event fired when a request fired by the page failed

          pagee.on('requestfailed', request => {
            const {
              url,
              resourceType,
              method
            } = request
            // Store a reference to that request, we'll need to get more information
            // about Mixed Content errors later
            console.log("checking url " + request.url());
            failedRequests.set(request._requestId, {
              url: request.url(),
              resourceType: request.resourceType(),
              method: request.method()
            })
          })
          // If a request failed due to a Mixed Content issue, log it
          pagee._client.on('Network.loadingFailed', event => {
            if (Object.is(event.blockedReason, 'mixed-content')) {
              mixedContentIssues.add(event.requestId)
              console.log("mixed-content event :: " + event);
            }
          })
          console.log('closing page...');
            await pagee.close();
            console.log('page closed.');
        }

      });
    })

  });
  //console.log(failedRequests, 'failedRequests');
  //console.log(mixedContentIssues, 'mixedContentIssues');
  for (let requestId of mixedContentIssues) {
    const {
      method,
      url,
      resourceType
    } = failedRequests.get(requestId)
    //console.log(`Mixed Content warning when sending ${method} request to ${url} (${resourceType})`)
    console.log("Mixed Content warning when sending ", failedRequests.get(requestId))

  }

  //await browser.close();

}
try {
  main()
} catch (error) {
  console.error(error)
}
