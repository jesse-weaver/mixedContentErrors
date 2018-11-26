const {
  parseCsv
} = require("./csvParse.js");


parseCsv("./containerTagUrls.csv").then((result) => {
  console.log(result);
  console.log('turkey!');
//  result.forEach(function(element) {
//  console.log(element);
//  });
});
