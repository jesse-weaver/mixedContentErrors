const Table = require('cli-table');
const chalk = require('chalk');
const fetch = require('node-fetch');

const fetchSites = (sites) => {
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
      };
    } catch (error) {
      if (error.type == 'max-redirect') {
        return {
          response: {
            status: 'too many re-directs'
          },
          siteName,
          url
        };
      }
      if (['ECONNREFUSED', 'ENOTFOUND', 'CERT_HAS_EXPIRED'].includes(error.code)) {
        return {
          response: {
            status: error.code
          },
          siteName,
          url
        };
      }
      console.log(error);
    }
  }));
}

const formatData = (sites) => {
  const table = new Table({
    head: ['site-name', 'url', 'status', 'mixed-content'],
    colWidths: [50, 80, 20, 30]
  });

  const formatted = sites.map(obj => {
    let {
      siteName,
      url,
      status,
      mixedContent
    } = obj;
    if (obj.status == 'too many re-directs') {
      siteName = chalk.yellow(obj.siteName);
      url = chalk.yellow(obj.url);
      status = chalk.yellow(obj.status);
    } else if (obj.status >= 400) {
      siteName = chalk.red(obj.siteName);
      url = chalk.red(obj.url);
      status = chalk.red(obj.status);
    } else {
      siteName = chalk.green(obj.siteName);
      url = chalk.green(obj.url);
      status = chalk.green(obj.status);
    }
    return [siteName, url, status, JSON.stringify(mixedContent)];
  });
  formatted.forEach(item => {
    table.push(item);
  });
  return table;
}

module.exports = {
  formatData,
  fetchSites
};
