const fetch = require('node-fetch');
const parseCSV = require('./parseCSV').parseCSV;
const Table = require('cli-table');
const lodash = require('lodash');
const chalk = require('chalk');
const scanMixedContent = require('./scanMixedContentFunction').scanMixedContent;



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
  const google = {
    siteName: 'google',
    url: 'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html',
    status: 200,
    mixedContent: []
  }
  //console.log('- - - -  scanning urls for mixed content errors');
  results.unshift(google);
  return scanMixedContent(results);
}).then((mixedContentErrors) => {
  const sorted = lodash.sortBy(mixedContentErrors, [function(o) {
    return String(o.status);
  }]);

  const table = new Table({
    head: ['site-name', 'url', 'status', 'mixed-content'],
    colWidths: [55, 55, 25, 55]
  });
  const alertUrls = sorted.filter(site => {
    return site.status >= 400 || site.status == 'too many re-directs' || site.mixedContent.length > 0;
  });

  const formatted = alertUrls.map(obj => {
    let status = obj.status;
    let siteName = obj.siteName;

    if (status == 'too many re-directs') {
      status = chalk.yellow(status);
      siteName = chalk.yellow(siteName);
    }

    if (status >= 400) {
      status = chalk.red(status);
      siteName = chalk.red(siteName);
    } else status = chalk.green(status);
    siteName = chalk.green(siteName);

    return [siteName, obj.url, status, JSON.stringify(obj.mixedContent)];
  });
  formatted.forEach(item => {
    table.push(item);
  });
  // table is an Array, so you can `push`, `unshift`, `splice` and friends

  console.log(table.toString());
}).catch((error) => {
  console.error('Encountered an error while doing this thang:');
  console.error(error);
});
//Next step...Make sure we return all data we need in promise chain
