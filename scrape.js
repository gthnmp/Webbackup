const fs = require('fs');
const path = require('path');
const scrape = require('website-scraper');
const { deleteFolder, processSite } = require('./src/utils');
const { deploy } = require('./src/vercel');

// let url = process.argv[2];

const my_scraper = async (url) => {
  try {
    url = new URL(url);

    const { origin, pathname, hostname } = url;
    
    const safeHostname = hostname.toLowerCase().replace(/\./g, '-');
    // const safeHostname = 'asd';

    console.log(`Scraping ${hostname}`.yellow);
    
    // delete if previously exist
    deleteFolder(path.join(__dirname, safeHostname));

    // Get the last subdirectory from the URL path
    const pathSegments = pathname.split('/').filter(segment => segment.trim() !== '');
    const lastSubdirectory = pathSegments.pop();
    
    const options = {
      urls: [
        origin,
        {url : `${origin}/${lastSubdirectory}`, filename:`${lastSubdirectory}.html`}
      ],
      directory: safeHostname,
      ignoreErrors: true,
      recursive: true,
      maxRecursiveDepth: 1,
      requestConcurrency: 10,
      urlFilter: (url) => {
        return url.indexOf(origin) === 0;
      }
    };

    // console.time(`${hostname} scraped`.green);
    const result = await scrape(options);
    console.log(result);
    // console.timeEnd(`${hostname} scraped`.green);

    // Replace meta tags in all .html files
    processSite(path.join(__dirname, safeHostname), origin);
    // console.time(`${hostname} processed`.green);

    // Upload to Hosting(Vercel)
    console.log(path.join(__dirname, safeHostname));
    //const deploymentResult = await deploy(
      //path.join(__dirname, safeHostname).toString(),
      //safeHostname
    //);

    //console.log({ deploymentResult });
    
    // delete after scrape
    //deleteFolder(path.join(__dirname, safeHostname));

    // exit
    process.exit(0);
    
  } catch (error) {
    console.log(error);
    console.log('Skipping'.red);
    process.exit(0);
  }
}

module.exports = my_scraper

// timeout
// setTimeout(() => {
//   try {
//     console.log('TIMEOUT. EXIT.'.bgRed.white);
//     deleteFolder(path.join(__dirname, safeHostname));
//     process.exit();
//   } catch (error) {
//     process.exit();
//   }
// }, 6000 * 1000); // 120 seconds
