
//import statements
const lodash = require('lodash');
const {
  scanMixedContent
} = require('./utils/scanMixedContentFunction');
const {
  ERROR_CODES,
  formatData,
  fetchSites
} = require('./utils/utils');
const {
  getPubs, insertStatus, insertSiteScan, getSiteScan
} = require('./utils/dbutils');


const main = async () => {
  let sites;

  insertSiteScan(['scan sites']);
  const siteScanRecord = await getSiteScan();
  const siteScanId = siteScanRecord[0].siteScanId;


  console.log('site scan id in your face: ', siteScanId);

  // get all publishers from the database
  const dbresults = await getPubs();

  // throw new Error('what??');

  // fetch each site and determine the status or if it has too many redirects
  const responses = await fetchSites(dbresults);
  const fetchResults = [];
  const dataInsertValues = [];

  responses.forEach(item => {
    const fetchResponse = item.response;
    // set up array for the database inserts
    dataInsertValues.push([
      item.id,
      siteScanId,
      (Number.isInteger(fetchResponse.status) ? fetchResponse.status : -1),
      (!Number.isInteger(fetchResponse.status) ? fetchResponse.status : null)
    ]);

    // make a json object that has the siteName and the Url to push on the results array.
    fetchResults.push({
      id: item.id,
      siteName: item.siteName,
      url: item.url,
      status: fetchResponse.status,
      mixedContent: []
    });

  });

  // inserts status codes into the database
  insertStatus(dataInsertValues);

  // scan each site for mixed content errors
  const results = await scanMixedContent(fetchResults);
  const sorted = lodash.sortBy(results, [function(o) {
    return String(o.status);
  }]);

  // only report the sites that have issues
  const alertUrls = await sorted.filter(site => {
    return site.status >= 400 ||
      site.mixedContent.length > 0 || ERROR_CODES.includes(site.status);
  });
  const formattedOutput = await formatData(alertUrls);
  console.log(formattedOutput.toString());
}

try {
  main();
} catch (error) {
  console.log(error);
}
