// The cache of currently open tabs and their inactive durations (only counting
// while chrome is in use).
var openTabs = new Array();

// Closed tabs and their closed durations (likewise, only counting while chrome
// is in use).
var closedTabs = new Array();

// In milliseconds, the polling interval to perform updates. This is also the
// length of a 'tick'.
var updateTabsInterval = 1000; //60000;

// In minutes, the amount of time to wait before closing a tab.
var inactiveThreshold;

// In minutes, the amount of time to wait before 'forgetting' a closed tab.
var storeClosedTabsThreshold;

// An array of URLs that will never be closed.
var whitelistedUrls = new Array();

var detachedTab;

// Gets the TabAssassin UI (browser action bubble view).
function getBubbleView() {
  var viewTabUrl = chrome.extension.getURL('TabAssassin.html');
  var views = chrome.extension.getViews();
  for (var j = 0; j < views.length; j++) {
    if (views[j].location.href == viewTabUrl)
      return views[j];
  }
}

// Returns the tabInfo in array |tabs| with |id|.
function getTabById(tabs, id) {
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].tab.id == id)
      return tabs[i];
  }

  return null;
}

chrome.tabs.onCreated.addListener(function(tab) {
  openTabs.push(new TabInfo(tab));
  var bubbleView = getBubbleView();
  if (bubbleView)
    bubbleView.addedTab(tab);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  openTabs = openTabs.filter(function(tabInfo) {
    return tabInfo.tab.id != tabId;
  });
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  var tabInfo = getTabById(openTabs, tabId);
  tabInfo.tab = tab;
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
  var tabInfo = getTabById(openTabs, tabId);
  tabInfo.ticks = 0;
});

/*
chrome.tabs.onMoved.addListener(function(tabId, moveInfo)
{
  //Do nothing.  We don't care about moved tabs... do we?
});
*/

chrome.tabs.onAttached.addListener(function(tabId, attachInfo) {
  var tabInfo = getTabById(openTabs, tabId);
  tabInfo.detached = false;
  tabInfo.ticks = 0;
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo) {
  var tabInfo = getTabById(openTabs, tabId);
  tabInfo.detached = true;
});

function getBookmarkFolder(bookmarks, folderName) {
  var bookmarkFolder;

  for (var i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].title == folderName && !bookmarks[i].url) {
      bookmarkFolder = bookmarks[i];
      break;
    }
  }

  return bookmarkFolder;
}

// A timed event that checks to see if any tabs have been 'inactive'.
// Inactive tabs are closed, removed from an array of open tabs and added to
// an array of closed tabs.
function updateTabs() {
  openTabs.forEach(function(tabInfo) {
    if (tabInfo.ticks >= inactiveThreshold &&
        !tabInfo.tab.selected &&
        !tabInfo.tab.pinned &&
        !isWhitelisted(tabInfo.tab.url) &&
        !tabInfo.detached) {
      closedTabs.push(new TabInfo(tabInfo.tab));
      chrome.tabs.remove(tabInfo.tab.id);
    }

    if (!tabInfo.tab.selected)
      tabInfo.ticks++;
  });

  closedTabs = closedTabs.filter(function(tabInfo) {
    return tabInfo.ticks < storeClosedTabsThreshold;
  });
  closedTabs.forEach(function(tabInfo) {
    tabInfo.ticks++;
  });

  setTimeout('updateTabs()', updateTabsInterval);
}

// Focuses an open tab selected from the bubble UI.
function selectTab(tabId) {
  chrome.tabs.update(tabId, {selected : true});
}

// Reopens an assassinated tab selected from the Tab Assassin UI
function reopenTab(tabId) {
  var tab = getTabById(closedTabs, tabId);
  closedTabs = closedTabs.filter(function(closedTab) {
    return closedTab.tab.id != tabId;
  });

  var bubbleView = getBubbleView();
  if (bubbleView)
    bubbleView.removeTab(tabId);
  chrome.tabs.create({url : tab.url});
}

// An object containing the tab and its age.  FIXME: the rest of the
// code treats the tab object as if it were its own, which
// fortunately seems to be true (it appears to be ephemeral from
// Chrome's POV) but is perhaps not to be relied on?
function TabInfo(tab) {
  // A copy of the tab's metadata.
  this.tab = tab;
  // The number of times in a row that we've polled and this tab has been
  // inactive.
  this.ticks = 0;
  // Whether the tab is detached (i.e. dragging).
  this.detached = false;
}

function isWhitelisted(url) {
  return whitelistedUrls.indexOf(url) != -1;
}

function updateWhitelistedUrls() {
  chrome.bookmarks.getChildren('2', function(bookmarks) {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    // If the Tab Assassin folder does exist
    if (tabAssassinFolder) {
      chrome.bookmarks.getChildren(tabAssassinFolder.id,
          function(whitelistedUrlBookmarks) {
            whitelistedUrls = whitelistedUrlBookmarks;
          });
    }
  });
}

// Sets threshold constants to their defaults, or from settings.
function setThresholds() {
  inactiveThreshold = localStorage['inactiveThreshold'] || 60;
  storeClosedTabsThreshold = localStorage['storeClosedTabsThreshold'] || 1440;
}

// When the extension initialized, the tab of tabs in all windows are added to
// an array of open tabs.
function initialize() {
  chrome.windows.getAll({'populate' : true}, function(windows) {
    for(var i = 0; i < windows.length; i++) {
      for(var j = 0; j < windows[i].tabs.length; j++) {
        openTabs.push(new TabInfo(windows[i].tabs[j]));
      }
    }
  });

  setThresholds();
  updateWhitelistedUrls();
  updateTabs();
}

initialize();
