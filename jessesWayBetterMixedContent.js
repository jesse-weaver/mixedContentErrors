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
  console.error(reason); // error;
}).then(sites => {
  return Promise.all(sites.map(site => fetch(site[1])));
}).then(data => {
  const results = {};
  data.forEach(item => {
    if (!results[item.status]) {
      results[item.status] = [item.url];
    } else {
      results[item.status].push(item.url);
    }
  });
  return results;
}).then(results => {
  //run puppeter for mixed content errors.
  console.log('final results:', results);
});
