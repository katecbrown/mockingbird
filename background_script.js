// Called when the user clicks on the browser action -- shim script
// to load our dependencies
clientPreview = 'http://clientpreview.saymedia.com';

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(
    {
      "file": "zepto.min.js"
    },
    function() {
        chrome.tabs.executeScript(
            {"file": "mockingbirdAction.js"}
        );
    });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "getHash") {
        console.log('Lookup received for ' + request.fcid + ' from ' + sender.tab);
        window.Zepto.ajax({
            type: 'GET',
            url: clientPreview + '/api/store-by-fcid',
            data: {'fcid': request.fcid},
            success: function(data) {
                sendResponse(data);
            },
            error: function(xhr, type) {
                console.log(xhr);
                console.log(type);
            }
       });
    }
    return true;
  }
);
