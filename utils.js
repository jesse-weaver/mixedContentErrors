const Table = require('cli-table');
const chalk = require('chalk');
const fetch = require('node-fetch');

//requets each site to determine the status code
const fetchSites = (sites) => {
  return Promise.all(sites.map(async site => {
    const {id, name, url} = site;
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        follow: 3
      });
      return {
        response,
        id,
        siteName: name,
        url
      };
    } catch (error) {
      if (error.type == 'max-redirect') {
        return {
          response: {
            status: 'too many re-directs'
          },
          id,
          siteName: name,
          url
        };
      }
      if (['ECONNREFUSED', 'ENOTFOUND', 'CERT_HAS_EXPIRED'].includes(error.code)) {
        return {
          response: {
            status: error.code
          },
          id,
          siteName: name,
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
    colWidths: [25, 25, 25, 25]
  });

  const formatted = sites.map(obj => {
    let {
      id,
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
