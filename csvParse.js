const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

async function parseCsv(inFile) {
  const siteUrls = [];
  return await readFile(inFile, "utf8", function(err, data) {
    if (err){
      console.error('could not read file properly', err);
      return;
    }
    var x = data.toString().split('\n');
    for (var i = 0; i < x.length; i++) {
      if (x[i] !== '') {
        y = x[i].split(',');
        siteUrls.push(y[1]);
      }
    }
    // console.log(siteUrls);
    return siteUrls;
  });
}

module.exports = {
  parseCsv
};
