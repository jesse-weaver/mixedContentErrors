const lodash = require('lodash');
const { parseCSV } = require('./parseCSV');
const { scanMixedContent } = require('./scanMixedContentFunction');
const { formatData, fetchSites } = require('./utils');

const main = async () => {
  let sites;

  // parse the CSV to get the sites we are scanning
  try {
    const csvData = await parseCSV("./containerTagUrls.csv");
    sites = csvData.filter(site => site[1].startsWith('https'));
  } catch (csvParseError) {
    console.log('Could not parse CSV file', csvParseError);
  }

  // fetch each site and see if it works or has too many redirects
  const responses = await fetchSites(sites);
  const fetchResults = [];
  responses.forEach(item => {
    const fetchResponse = item.response;
    // add the url to array of urls under this status code
    // make a json object that has the siteName and the Url to push on the results array.
    fetchResults.push({
      siteName: item.siteName,
      url: item.url,
      status: fetchResponse.status,
      mixedContent: []
    });
  });

  // scan each site for mixed content errors
  const results = await scanMixedContent(fetchResults);
  const sorted = lodash.sortBy(results, [function(o) {
    return String(o.status);
  }]);

  // only report the sites that have issues
  const alertUrls = await sorted.filter(site => {
    return site.status >= 400 ||
      site.mixedContent.length > 0 ||
      ['ECONNREFUSED', 'ENOTFOUND', 'CERT_HAS_EXPIRED', 'too many re-directs' ].includes(site.status);
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
