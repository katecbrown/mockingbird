(function(window, undefined) {
    "use strict";
    /*
     * MOCKINGBIRD
     *
     * Choose an element; fill in an FCID; make a call to Client Preview to
     * get a script tag; substitute it for the element. Wash, rinse, repeat
     * as needed.
     *
     * Handles loading Zepto.js (if not already available) for AJAX functionality
     * (part of mb-injection.js), and we are officially only Chrome on Mac.
     */
    
    var mbMenu, mbCancel, mbInsert, mbPanel, previousCursor, previousBorder,
        previousElement, currentTarget, currentCover, mbMode = 'targeting',
        zMax = '2147483647', coveredIframes = {}, coveredObjects = {},
        document = window.document;

    var pigeonUrl = 'http://ads.saymedia.com';
    var clientPreview = 'http://clientpreview.saymedia.com';


    // Utility methods
    var bindEvent = function(el, event, handler) {
      if (el.addEventListener){
        el.addEventListener(event, handler, false); 
      } else if (el.attachEvent){
        el.attachEvent('on'+event, handler);
      }
    }

    // Make sure we have Zepto.js to hand -- for whatever reasons, using jQuery
    // doesn't seem to do the trick. Additionally, set up our "menu" panel
    // that says we are loading/running.
    var mbInit = function() {

        mbMenu = document.createElement('div');
        mbMenu.id = 'mockingbird-menu';
        mbMenu.style.position = "fixed";
        mbMenu.style.padding = "10px";
        mbMenu.style.left = "10px";
        mbMenu.style.top = "10px";
        mbMenu.style.zIndex = zMax;
        mbMenu.style.backgroundColor = "#ddd";
        var mbText = document.createElement('span');
        mbText.id = 'mockingbird-text';
        mbText.style.paddingRight = "4em";
        mbMenu.appendChild(mbText);
        document.firstElementChild.insertBefore(mbMenu);
        
        if (window.Zepto) {
            console.log('Mockingbird using available Zepto');
            mbSetup();
        } else {
            alert('Something went wrong loading Zepto');
        }
    }

    // All the actual work
    var mbSetup = function() {
        previousCursor = document.body.style.cursor;

        mbPanel = document.createElement('div');
        mbPanel.id = 'mockingbird-panel';
        mbPanel.style.height = "250px";
        mbPanel.style.width = "300px";
        mbPanel.style.position = "fixed";
        mbPanel.style.left = "10px";
        mbPanel.style.top = "10px";
        mbPanel.style.margin = "auto";
        mbPanel.style.backgroundColor = "rgba(0,0,0,.8)";
        mbPanel.style.color = "#fff";
        mbPanel.style.zIndex = zMax;
        mbPanel.style.display= "none";
        var inner = '';
        inner += '<input type="text" id="mb-fcid">FCID</input><br/>';
        inner += '<input type="text" id="mb-x">Width</input><br/>';
        inner += '<input type="text" id="mb-y">Height</input><br/>';
        inner += '<button id="mb-panel-submit">Replace</button><br/>';
        inner += '<button id="mb-panel-remove">Remove</button><br/>';
        inner += '<button id="mb-panel-cancel">Cancel</button>';
        mbPanel.innerHTML = inner;

        var mbText = document.getElementById('mockingbird-text');
        mbText.innerHTML = 'Mockingbird is running!';

        mbInsert = document.createElement('a');
        mbInsert.innerHTML = "<span style='color: blue;'>Insert an Ad</span>";
        mbInsert.id = 'mockingbird-insert';

        mbCancel = document.createElement('a');
        mbCancel.innerHTML = "<span style='color: blue;'>Finished</span>";
        mbCancel.id = 'mockingbird-cancel';

        mbMenu.appendChild(mbCancel);

        document.firstElementChild.insertBefore(mbPanel);

        window.Zepto("body").find("iframe").each(function(i, el) {
            var cover = document.createElement('div');

            var pos = window.Zepto(el).offset();
            cover.id = 'IFRAMECOVER-' + i;
            coveredIframes[cover.id] = el;
            window.Zepto(cover).css(pos);
            cover.style.position = "absolute";
            cover.style.zIndex = zMax;
            bindEvent(cover, 'mouseover', function() {
                if (mbMode === "targeting") {
                    cover.style.backgroundColor = "orange";
                    currentCover = cover;
                }
            });
            bindEvent(cover, 'mouseout', function() {
                if (mbMode === "targeting") {
                    cover.style.backgroundColor = "transparent";
                    currentCover = undefined;
                }
            });
            bindEvent(cover, 'click', function(ev) {
                ev.preventDefault();
                mbMode = "targeted";
                currentTarget = coveredIframes[cover.id];
                setTarget(currentTarget);
            });
            document.firstElementChild.insertBefore(cover);
        });

        window.Zepto("body").find("object").each(function(i, el) {
            var cover = document.createElement('div');
            var pos = window.Zepto(el).offset();
            cover.id = 'OBJECTCOVER-' + i;
            coveredObjects[cover.id] = el;
            window.Zepto(cover).css(pos);
            cover.style.position = "absolute";
            cover.style.zIndex = zMax;
            bindEvent(cover, 'mouseover', function() {
                if (mbMode === "targeting") {
                    cover.style.backgroundColor = "orange";
                    currentCover = cover;
                }
            });
            bindEvent(cover, 'mouseout', function() {
                if (mbMode === "targeting") {
                    cover.style.backgroundColor = "transparent";
                    currentCover = undefined;
                }
            });
            bindEvent(cover, 'click', function(ev) {
                ev.preventDefault();
                mbMode = 'targeted';
                currentTarget = coveredObjects[cover.id];
                setTarget(currentTarget);
            });
            document.firstElementChild.insertBefore(cover);
        });

        bindEvent(body, 'click', function() {
            if (mbMode === 'insert') {

            }
        });

        bindEvent(mbInsert, 'click', function() {
            mbMode = 'insert';
            document.body.style.cursor = 'target';
        });

        bindEvent(mbCancel, 'click', function() {
            mbMode = 'inactive';
            document.body.style.cursor = previousCursor;
            document.getElementById('mockingbird-panel').style.display = 'none';
            document.getElementById('mockingbird-menu').style.display = 'none';
            window.Zepto(coveredIframes).each(function(i, which) {
                var cover = document.getElementById(which);
                if (cover) {
                    cover.parentNode.removeChild(cover);
                }
            });
            window.Zepto(coveredObjects).each(function(i, which) {
                var cover = document.getElementById(which);
                if (cover) {
                    cover.parentNode.removeChild(cover);
                }
            });
        });

        bindEvent(document.getElementById('mb-panel-remove'), "click", function(ev) {
            currentCover.parentNode.removeChild(currentCover);
            currentTarget.parentNode.removeChild(currentTarget);
            window.Zepto('#mockingbird-panel').hide();
            window.Zepto('#mockingbird-menu').show();
            mbMode = "targeting";
        });

        bindEvent(document.getElementById('mb-panel-submit'), "click", function(ev) {
            // TODO: Valdiation here
            var w = window.Zepto('#mb-x').val();
            var h = window.Zepto('#mb-y').val();
            var fcid = window.Zepto('#mb-fcid').val();
            window.Zepto('#mockingbird-panel').hide();
            replaceTarget(fcid, w, h);
            window.Zepto('#mockingbird-menu').show();
            mbMode = "targeting";
        });

        var replaceTarget = function(fcid, w, h) {
            chrome.runtime.sendMessage(
                {action:"getHash", fcid: fcid},
                function(response) {
                    var randomHexTag = new Date().getTime();
                    if (typeof(response) === "string") {
                        try {
                            response = JSON.parse(response);
                        } catch(e) {
                            1;
                        }
                    }
                    var scriptUrl = pigeonUrl+"/preview?model_id="+response.hash+"&tech=display&dim="+w+"x"+h+"&tag=ai"+randomHexTag;
                    // returning true is required to keep the channel active
                    var scriptTag = document.createElement('script');
                    scriptTag.src = scriptUrl.replace(/\&/g, '&amp;');
                    console.log(scriptTag.src);
                    currentTarget.parentNode.insertBefore(scriptTag, currentTarget);
                    currentCover.parentNode.removeChild(currentCover);
                    currentTarget.parentNode.removeChild(currentTarget);
                    mbMode = 'targeting';
                    return true;
                }
            );
        };

        bindEvent(document.getElementById('mb-panel-cancel'), 'click', function() {
            var menu = document.getElementById("mockingbird-menu");
            menu.style.display = "inline";
            var panel = document.getElementById("mockingbird-panel");
            panel.style.display = "none";
            mbMode = "targeting";
        });

        /*
        var interior = document.documentElement.outerHTML;
        console.log(interior);
        */

        var setTarget = function(el) {
            var menu = document.getElementById("mockingbird-menu");
            menu.style.display = "none";
            var panel = document.getElementById("mockingbird-panel");
            window.Zepto('#mb-x').val('');
            window.Zepto('#mb-y').val('');
            window.Zepto('#mb-fcid').val('');
            panel.style.display = "inline";
        }

        console.log("Mockingbird: Ready");

    } // End setup method

    mbInit();

}(this));

