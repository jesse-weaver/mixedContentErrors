//parse the .csv to get the url's
//batch 5 urls at a time
//run puppeteer in order to check for mixed content or *redirects until url's are done then close them then repeat for all url's
//cose script


const csv = require('csv-parse');
const fs = require('fs');
const fetch = require('node-fetch');

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


parseCSV("./containerTagUrls.csv").then((data) => {
  const sites = data.filter(site => site[1].startsWith('https'));
  return sites;
}, (reason) => {
  // if there is an error parsing CSV
  console.error(reason);
}).then(sites => {
  // fetch all sites and return and promisify all of them before next step
  return Promise.all(sites.map(site => fetch(site[1], { redirect: 'manual' })));
}).then(data => {
  // determine the status code response of each site and track them
  const results = {};
  data.forEach(item => {
    // if the status doesn't exist in the object yet, add it with an empty array
    if (!results[item.status]) {
      results[item.status] = [];
    }
    // add the url to array of urls under this status code
    results[item.status].push(item.url);
  });
  return results;
}).then(results => {
  // Take the results based on status code run the results through
  // the puppeteer mixed content errors script
  console.log('final results:', results);
});
