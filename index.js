const fs = require('fs');
const my_scraper = require('./scrape')
const shell = require('shelljs');

(async () => {
  const sites = fs
    .readFileSync('./input.txt')
    .toString()
    .split(/\r?\n/)
    .filter(String);

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    console.log({ site });
    
    my_scraper(site)
    console.log('\n\n');
    // await main(site);
    
    // Don't need to use shell, we can import   
    // await shell.exec(`node scrape.js ${site}`);
  }
})();
