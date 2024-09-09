const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

const urls = [
  'https://devgcx.sharepoint.com/'
];

// Read selectors from the file
const readSelectors = (filePath) => {
  return new Promise((resolve, reject) => {
    const selectors = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    rl.on('line', (line) => {
      selectors.push(line.trim());
    });

    rl.on('close', () => {
      resolve(selectors);
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
};

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Read CSS selectors from the file
  const selectors = await readSelectors('selectors.txt');

  // Test for each page url
  for (let url of urls) {
	  
	console.log(`Checking URL: ${url}`);
	
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Different screen sizes
    const screenSizes = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];

	// Test for each screen size
    for (let size of screenSizes) {
	  console.log(`Checking for screen size ${size.width}x${size.height}`);
      await page.setViewport(size);
	  
      let allSelectorsExist = true;
	  
	  for (let selector of selectors) {
        const elementExists = await page.$(selector) !== null;

        if (elementExists) {
          console.log(`✅ Element found for selector: ${selector} at ${size.width}x${size.height}`);
        } else {
          console.error(`❌ Element NOT found for selector: ${selector} at ${size.width}x${size.height}`);
          allSelectorsExist = false;
        }
      }
	  
	  if (!allSelectorsExist) {
		console.error(`Some elements were not found on ${url} at ${size.width}x${size.height}`);  
	  }
    }
  }

  await browser.close();
})();