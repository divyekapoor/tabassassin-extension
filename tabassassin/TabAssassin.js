var backgroundPage = chrome.extension.getBackgroundPage();

//Calls a function on the background page to reopen a closed tab
function closedTabClicked() {
  backgroundPage.reopenTab(parseInt(this.id));
}

function minutesText(ticks) {
  return ticks ? ticks + 'minutes' : '< 1 minute';
}

function indexOfTab(tabId, tabs) {
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].id === tabId)
      return i;
  };

  return -1;
}

function populateTabsForWindow(windowInfo) {
  chrome.tabs.getAllInWindow(windowInfo.id, populateTabs);
}

// Displays the opened and closed tabs to the user. |tabs| is the list of
// tabs in this window. |tabs| is used to filter out tabs from other windows
// from openTabs/closedTabs.
function populateTabs(tabs) {
  var tabEntryTemplate = $('tabEntryTemplate');

  var openTabsList = document.querySelector('#openTabsSection .tabList');
  var openTabs = backgroundPage.openTabs.slice().sort(function(a, b) {
    return indexOfTab(a.tab.id, tabs) - indexOfTab(b.tab.id, tabs);
  });
  openTabs.forEach(function(tabInfo) {
    if (indexOfTab(tabInfo.tab.id, tabs) == -1)
      return;

    var openTab = tabEntryTemplate.cloneNode(true);
    openTab.id = tabInfo.tab.id;
    openTab.onclick = openTabClicked;

    openTab.querySelector('.tabTitle').textContent = tabInfo.tab.title;

    var displayText = tabInfo.tab.selected ? '[Active]' :
        '[Inactive for ' + minutesText(tabInfo.ticks) + ']';
    openTab.querySelector('.tabStatus').textContent = displayText;
    if (tabInfo.tab.selected)
      openTab.classList.add('selected');

    openTabsList.appendChild(openTab);
    openTab.hidden = false;
  });

  var closedTabsList = document.querySelector('#closedTabsSection .tabList');
  var lastClosedTab = null;
  backgroundPage.closedTabs.forEach(function(tabInfo) {
    if (indexOfTab(tabInfo.tab.id, tabs) == -1)
      return;

    var closedTab = tabEntryTemplate.cloneNode(true);
    closedTab.id = tabInfo.tab.id;
    closedTab.onclick = closedTabClicked;

    closedTab.querySelector('.tabTitle').textContent = tabInfo.tab.title;
    closedTab.querySelector('.tabStatus').textContent =
        '[Removed for ' + minutesText(tabInfo.ticks) + ']';

    // Reverse the order (most recently closed first).
    closedTabsList.insertBefore(closedTab, lastClosedTab);
    closedTab.hidden = false;
    lastClosedTab = closedTab;
  });
}

// Calls a function on the background page to focus on an open tab.
function openTabClicked() {
  backgroundPage.selectTab(parseInt(this.id));
}

// Removes a tab from the UI.
function removeTab(tabId) {
  var tabDiv = $(tabId);
  tabDiv.parentNode.removeChild(tabDiv);
}

window.onload = function() {
  chrome.windows.getCurrent(populateTabsForWindow);
}
