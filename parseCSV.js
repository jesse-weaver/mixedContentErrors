const csv = require('csv-parse');
const fs = require('fs');

// This function parses the CSV and returns the parsed data
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

module.exports = {
  parseCSV
};
