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
    
    var mbMenu, mbCancel, mbPanel, previousCursor, previousBorder,
        previousElement, currentTarget, currentCover, mbMode = 'targeting',
        zMax = '2147483647', coveredIframes = {}, coveredObjects = {},
        document = window.document, myLib;
    // myLib will be set up as jQuery, if that's available; we will load
    // Zepto if it's not.
    var baseApp = '<base_app_url>';
    var pigeonUrl = '<pigeon_url>';
    var clientPreview = '<client_preview_url>';


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
            myLib = window.Zepto;
            mbSetup();
        } else {
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = chrome.extension.getUrl('zepto.min.js');
            console.log(script.src);
            script.onload = function() {
                myLib = window.Zepto;
                mbSetup();
            }
            head.appendChild(script);
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
        mbPanel.innerHTML = '<input type="text" id="mb-fcid">FCID</input><br/><input type="text" id="mb-x">Width</input><br/><input type="text" id="mb-y">Height</input><br/><button id="mb-panel-submit">Replace</button><br/><button id="mb-panel-cancel">Cancel</button>';

        var mbText = document.getElementById('mockingbird-text');
        mbText.innerHTML = 'Mockingbird is running!';

        mbCancel = document.createElement('a');
        mbCancel.innerHTML = "<span style='color: blue;'>Finished</span>";
        mbCancel.id = 'mockingbird-cancel';

        mbMenu.appendChild(mbCancel);

        document.firstElementChild.insertBefore(mbPanel);

        myLib("body").find("iframe").each(function(i, el) {
            var cover = document.createElement('div');

            var pos = myLib(el).offset();
            cover.id = 'IFRAMECOVER-' + i;
            coveredIframes[cover.id] = el;
            myLib(cover).css(pos);
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

        myLib("body").find("object").each(function(i, el) {
            var cover = document.createElement('div');
            var pos = myLib(el).offset();
            cover.id = 'OBJECTCOVER-' + i;
            coveredObjects[cover.id] = el;
            myLib(cover).css(pos);
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

        bindEvent(mbCancel, 'click', function() {
            mbMode = 'inactive';
            document.body.style.cursor = previousCursor;
            document.getElementById('mockingbird-panel').style.display = 'none';
            document.getElementById('mockingbird-menu').style.display = 'none';
            myLib(coveredIframes).each(function(i, which) {
                var cover = document.getElementById(which);
                if (cover) {
                    cover.parentNode.removeChild(cover);
                }
            });
            myLib(coveredObjects).each(function(i, which) {
                var cover = document.getElementById(which);
                if (cover) {
                    cover.parentNode.removeChild(cover);
                }
            });
        });

        bindEvent(document.getElementById('mb-panel-submit'), "click", function(ev) {
            // TODO: Valdiation here
            var w = myLib('#mb-x').val();
            var h = myLib('#mb-y').val();
            var fcid = myLib('#mb-fcid').val();
            myLib('#mockingbird-panel').hide();
            replaceTarget(fcid, w, h);
            myLib('#mockingbird-menu').show();
        });

        var replaceTarget = function(fcid, w, h) {
            myLib.ajax({
                type: 'GET',
                url: clientPreview + '/api/store-by-fcid?fcid=' + fcid,
                dataType: 'jsonp',
                success: function(data){
                    var modelHash = JSON.parse(data).hash;
                    var randomHexTag = new Date().getTime();
                    // TODO: Make this user-configurable? Or dependent on
                    // the mockingbird version running?
                    var scriptUrl = pigeonUrl+"/preview?model_id="+modelHash+"&tech=display&dim="+w+"x"+h+"&tag=ai"+randomHexTag;
                    var scriptTag = document.createElement('script');
                    scriptTag.src = scriptUrl.replace(/\&/g, '&amp;');
                    mbMode = 'targeting';
                    currentTarget.parentNode.insertBefore(scriptTag, currentTarget);
                    currentCover.parentNode.removeChild(currentCover);
                    currentTarget.parentNode.removeChild(currentTarget);
                }, // End ajax success function
                error: function(xhr, type){
                    // TODO SBC
                }
            });
        }

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
            myLib('#mb-x').val('');
            myLib('#mb-y').val('');
            myLib('#mb-fcid').val('');
            panel.style.display = "inline";
        }

        console.log("Mockingbird: Ready");

    } // End setup method

    mbInit();

}(this));

