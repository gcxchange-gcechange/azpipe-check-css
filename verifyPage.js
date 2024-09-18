const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const userEmail = '';
const userPass = '';
const loginPage = 'https://devgcx.sharepoint.com/';
var countMFA = 0;

// A CSS selector that will be checked exists to verify the page has finished loading. 
const elementOnPageLoad = '#O365_MainLink_NavMenu';

// Add all the pages you want tested here
const urls = [
  'https://devgcx.sharepoint.com/'
];

// Helper function to extract width and height from the filename
const getDimensionsFromFileName = (fileName) => {
  const match = fileName.match(/(\d+)x(\d+)\.txt/);
  if (match) {
      return {
          width: parseInt(match[1], 10),
          height: parseInt(match[2], 10)
      };
  }
  return null;
};

const createScreenArrayFromFiles = () => {
  const result = [];

  // Read the folder and process each .txt file
  fs.readdirSync('./selectors').forEach(file => {
      if (path.extname(file) === '.txt') {
          const dimensions = getDimensionsFromFileName(file);

          if (dimensions) {
              // Read the file content (CSS selectors)
              const filePath = path.join('./selectors', file);
              const selectors = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

              // Add the object to the result array
              result.push({
                  width: dimensions.width,
                  height: dimensions.height,
                  selectors: selectors
              });
          }
      }
  });

  return result;
};

// Create the test specs from the files defined in the selectors folder
const testSpecs = createScreenArrayFromFiles();

// Use puppeteer to go through the initial login process
const login = async (page) => {
  try {
    await Promise.all([
      page.goto(loginPage, { waitUntil: 'networkidle2' }),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
    ]);

    // email
    // await Promise.all([
    //   page.waitForSelector(`input[type="email"]`),
    //   page.type('input[type="email"]', userEmail),
    //   page.click('input[type="submit"]')
    // ]);
    await page.waitForSelector(`input[type="email"]`);
    await page.type('input[type="email"]', userEmail);
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' });

    // password
    // await Promise.all([
    //   page.waitForSelector('input[type="password"]', { visible: true }),
    //   page.type('input[type="password"]', userPass),
    //   page.click('input[type="submit"]'),
    //   page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
    // ]);
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', userPass);
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' });

    await skipMFA(page, countMFA++);
  }
  catch(e) {
    console.error(`Failed to login: ${e.message}`);
  }
}

// Use puppeteer to skip MFA setup (this can happen multiple times)
const skipMFA = async (page, attempts) => {
  try {
    if (attempts > 10)
      throw new Error('Too many attempts to skip MFA, something is not working.');

    // next
    await Promise.all([
      page.waitForSelector('div#displayName.identity', { visible: true }),
      page.click('input[type="submit"]'),
      page.waitForResponse(response => response.url().includes('mysignins.microsoft.com')),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' }),
      page.waitForSelector('hr.ms-Divider + div > a')
    ]);

    // skip setup
    await Promise.all([
      page.waitForSelector('span.ms-tenantName', { visible: true }),
      page.waitForSelector('.ms-Card', { visible: true }),
      page.click('hr.ms-Divider + div > a'),
      page.waitForResponse(response => response.url().includes('/ProcessAuth')),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
    ]);

    // stay signed in
    await Promise.all([
      page.waitForSelector('input[type="checkbox"]', { visible: true }),
      page.click('input[type="checkbox"]'),
      page.click('input[type="submit"]'),
      page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle2' })
    ]);
  }
  catch (e) {
    console.error(`Failed to skip MFA after ${attempts} attempts.`);
  }
}

// The main puppeteer script to test our selectors for various page sizes
(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await login(page);

  page.on('framenavigated', async () => {
    let currentUrl = page.url();
    console.log('Navigated to: ', currentUrl);

    // If we get stuck in the cycle of having to enable MFA
    if (currentUrl.includes('login.microsoftonline.com')) {
      //await skipMFA(page, countMFA++);
    }
  });

  // Test for each page url
  for (let url of urls) {
	  
    console.log(`Checking URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Test for each screen size
    for (let spec of testSpecs) {
	    console.log(`Checking for screen size ${spec.width}x${spec.height}`);
      await page.setViewport({width: spec.width, height: spec.height});
	  
      // Wait for page to load
      let pageLoaded = await page.waitForSelector(elementOnPageLoad);
      if (pageLoaded == null)
        console.error(`Unable to verify page loaded. Coudln't find ${elementOnPageLoad}`);
	  
      let allSelectorsExist = true;
	  
      // Check the selectors
	    for (let selector of spec.selectors) {
        const elementExists = await page.waitForSelector(selector) !== null;

        if (elementExists) {
          console.log(`${url} @ ${spec.width}x${spec.height} ✅ Element found for selector: ${selector}`);
        } else {
          console.log(`${url} @ ${spec.width}x${spec.height} ❌ Element NOT found for selector: ${selector}`);
          allSelectorsExist = false;
        }
      }
	  
      if (!allSelectorsExist) {
        console.error(`Some elements were not found on ${url} at ${spec.width}x${spec.height}`);  
      }
    }
  }

  await browser.close();
})();