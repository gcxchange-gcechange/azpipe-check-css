# azpipe-check-css
A pipeline to check the CSS on various SharePoint pages to verify selectors are still valid.

### Setup
- Add the SharePoint URLs you want to test to the **urls** array in [verifyPage.js](https://github.com/gcxchange-gcechange/azpipe-check-css/blob/main/verifyPage.js)
	- Example `'https://devgcx.sharepoint.com/'`
- Add any screen sizes you want to test to the **screenSizes** array in [verifyPage.js](https://github.com/gcxchange-gcechange/azpipe-check-css/blob/main/verifyPage.js). 
	- The array expects objects formatted like `{ width: 1920, height: 1080 }`
- Add the CSS selectors you want to verify to the [selectors.txt](https://github.com/gcxchange-gcechange/azpipe-check-css/blob/main/selectors.txt). 
	- Each selector should be on a new line within the file.