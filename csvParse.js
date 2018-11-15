const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

async function parseCsv(inFile) {
  const siteUrls = [];
  return await readFile(inFile, function(err, data) {
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
    console.log(siteUrls);
    return siteUrls;
  });
}

module.exports = {
  parseCsv
};


// const fs = require('fs');
// const util = require('util');
//
// // Convert fs.readFile into Promise version of same
// const readFile = util.promisify(fs.readFile);
//
// async function getStuff() {
//   return await readFile('test');
// }
//
// // Can't use `await` outside of an async function so you need to chain
// // with then()
// getStuff().then(data => {
//   console.log(data);
// })
