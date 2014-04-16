// Called when the user clicks on the browser action -- shim script
// to load our dependencies
chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Mockingbird activated on: ' + tab.url);
  if (window.Zepto) {
    console.log('Mockingbird using available Zepto');
  } else {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = chrome.extension.getURL('zepto.min.js');
    script.onload = function() {
        console.log('Mockingbird has loaded Zepto');
        loadMockingbird();
    }
    head.appendChild(script);
  }
});

function loadMockingbird() {
  chrome.tabs.executeScript(
    {
      "file": "zepto.min.js"
    },
    function() {
        chrome.tabs.executeScript(
            {"file": "mockingbirdAction.js"}
        );
    });
};
