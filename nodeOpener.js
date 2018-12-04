// Node modules
const opn = require('opn');
const fs = require('fs');
const parse = require('csv-parse')
//const EXAMPLE_URL = 'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html';

const main = async () => {
  fs.readFile("./containerTagUrls.csv", 'utf8', function(err, contents) {
    //console.log("contents 1 :: " + contents);
    parse(contents, function(err, output) {
      var count = 0;
      output.forEach(async function(value) {
        var URI = value.toString().split(",")[1];
        if (URI != null && URI.startsWith("https")) {

        await opn(URI, {app: ['google chrome', '--incognito']});

        }

      });
    })
  });

}
try {
  main()
} catch (error) {
  console.error(error)
}
