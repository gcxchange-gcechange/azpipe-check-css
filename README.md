# azpipe-check-css
A pipeline to check the CSS on various SharePoint pages to verify selectors are still valid.

### Setup
- Add the SharePoint URLs you want to test to the **urls** array in [verifyPage.js](https://github.com/gcxchange-gcechange/azpipe-check-css/blob/main/verifyPage.js)
	- Example `'https://devgcx.sharepoint.com/'`
- Add a .txt file with the named format `widthxheight.txt` to the [selectors folder](https://github.com/gcxchange-gcechange/azpipe-check-css/blob/main/selectors)
	- Each selector should be on a new line within the text file.

### Run Locally
Using Node.js v18.x, run the command `npm install`, then `node verifyPage.js`