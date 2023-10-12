const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
require('colors');

const deleteFolder = (path) => {
  try {
    fs.rmdirSync(path, { recursive: true });
  } catch (error) {
    console.log(error);
    console.log(
      `Unable to delete folder: ${path}\nFolder is  either busy or not exists.`
        .yellow
    );
  }
};

/**
 * Return all files in the directory including subfolders
 * @param {string} dir Directory to recursively find files
 * @returns {Array<string>}
 */
const walk = function (dir) {
  let results = [];
  let list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
};

/**
 * Return all html file paths in the given folder
 * @param {string} folderPath Path of the cloned website folder
 * @returns {Array<string>}
 */
const getHtmlFiles = (folderPath) => {
  const files = walk(folderPath).filter((file) =>
    String(file).endsWith('.html')
  );

  return files;
};

const replaceExternalLinks = (filePath) => {
  const domain = path.dirname(filePath);

  const _replace = (prop) => {
    if (prop.includes(domain)) {
      return prop;
    }

    const regex = /(<a[^>]*href=")(?<uri>[^/][^"]*)(")/;
    const uri = regex.exec(prop).groups.uri;

    let isUrl = false;
    try {
      const _tmp = new URL(uri);
      isUrl = true;

      // if(prop.includes())

      return prop.replace(/(<a[^>]*href=")([^/][^"]*)(")/g, '$1/$3');
    } catch (error) {
      return prop;
    }
  };

  let html = fs.readFileSync(filePath).toString();
  html = html.replace(/(<a[^>]*href=")([^/][^"]*)(")/g, _replace);
  fs.writeFileSync(filePath, html);
};

/**
 * Point all internal/external links to /
 * @param {string} filePath
 */

const modifyLinks = (filePath, baseURL) => {
  if (fs.existsSync(filePath)) {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // Normalize the baseURL to ensure consistency
    const baseURLObj = new URL(baseURL);

    // Modify href attributes
    $('a').each(function () {
      const href = $(this).attr('href');

      // Normalize href as well
      const hrefObj = new URL(href, baseURL);

      if (hrefObj.href === baseURLObj.href) {
        // If href is equal to baseURL, change it to index.html
        $(this).attr('href', 'index.html');
      } else if (hrefObj.protocol === 'http:' || hrefObj.protocol === 'https:') {
        if (hrefObj.hostname === baseURLObj.hostname) {
          const pathParts = hrefObj.pathname.split('/').filter(Boolean);
          const lastPart = pathParts[pathParts.length - 1];
          $(this).attr('href', `${lastPart}.html`);
        } else {
          $(this).attr('href', '#');
        }
      } else {
        const currentPathname = hrefObj.pathname.replace(/^\/|\/$/g, ''); // Remove leading and trailing slashes
        if (!currentPathname.endsWith('.html')) {
          $(this).attr('href', currentPathname + '.html');
        }
      }
    });

    // Save the modified HTML content back to the file
    fs.writeFileSync(filePath, $.html());
    console.log(`Modified hrefs in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
};

const deleteMetaTags = (filePath) => {
  var $ = cheerio.load(fs.readFileSync(filePath));

  $('meta').each((index, elem) => {
    if (!['description', 'viewport'].includes($(elem).attr('name'))) {
      $(elem).attr('content', '');
    }
  });

  fs.writeFileSync(filePath, $.html());
};

const processIndex = (file) => {
  replaceExternalLinks(file);
  deleteMetaTags(file);
};

const processOthers = (files, url) => {
  files.forEach((file) => {
    modifyLinks(file,url);
    deleteMetaTags(file);
  });
};

const create404Page = (folderPath) => {
  const notFoundPage = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Not Found</title></head><body><h1>Page Not Found</h1></body></html>`;
  fs.writeFileSync(path.join(folderPath, '404.html'), notFoundPage);
};

const processSite = (folderPath, url) => {
  const files = getHtmlFiles(folderPath);
  const index = path.join(folderPath, 'index.html');
  others = files.map((x) => path.normalize(x));
  others = others.filter((file) => file != index);

  processIndex(index);
  processOthers(others, url);

  create404Page(folderPath);
};

// processSite('./nodejs.org/');

module.exports = { deleteFolder, processSite };
