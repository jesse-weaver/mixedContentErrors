const lodash = require('lodash');
const {
  scanMixedContent
} = require('./scanMixedContentFunction');
const {
  formatData,
  fetchSites
} = require('./utils');
const {
  getPubs, insertStatus
} = require('./dbutils');


const main = async () => {
  let sites;


  const dbresults = await getPubs();
  //!!!!input status codes, mixed content errors into database !!!!
  // fetch each site and determine the status or if it has too many redirects

  const responses = await fetchSites(dbresults);
  const fetchResults = [];
  const dataInsertValues = [];

  responses.forEach(item => {
    const fetchResponse = item.response;
    // add the url to array of urls under this status code
    // make a json object that has the siteName and the Url to push on the results array.
    dataInsertValues.push([
      item.id,
      fetchResponse.status,
      (fetchResponse.status == 'too many re-directs' ? 1 : 0)
    ]);
    fetchResults.push({
      id: item.id,
      siteName: item.siteName,
      url: item.url,
      status: fetchResponse.status,
      mixedContent: []
    });

  });
  //console.log(fetchResults);
  insertStatus(dataInsertValues);

  //throw new Error('whoopsie');
  // scan each site for mixed content errors
  const results = await scanMixedContent(fetchResults);
  const sorted = lodash.sortBy(results, [function(o) {
    return String(o.status);
  }]);

  // only report the sites that have issues
  const alertUrls = await sorted.filter(site => {
    return site.status >= 400 ||
      site.mixedContent.length > 0 || ['ECONNREFUSED', 'ENOTFOUND', 'CERT_HAS_EXPIRED', 'too many re-directs'].includes(site.status);
  });
  const table = await formatData(alertUrls);
  console.log(table.toString());
}

try {
  main();
} catch (error) {
  console.log('Ooops!');
  console.log(error);
}
