const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://mattsovrntest.blogspot.com/2018/02/blog-post.html');
  await page.screenshot({path: 'matttest2.png'});

  await browser.close();
})();
