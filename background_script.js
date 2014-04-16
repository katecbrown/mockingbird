// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Mockingbird activated on: ' + tab.url);
  chrome.tabs.executeScript({
      "file": "mockingbirdAction.js"
  });
});
