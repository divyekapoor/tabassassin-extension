var backgroundPage = chrome.extension.getBackgroundPage();

//Calls a function on the background page to reopen a closed tab
function closedTabClicked() {
  backgroundPage.reopenTab(parseInt(this.id));
}

// Displays the opened and closed tabs to the user.
function populateTabs() {
  var tabEntryTemplate = $('tabEntryTemplate');
  var openTabsSection = $('openTabsSection');

  backgroundPage.openTabs.forEach(function(tabInfo) {
    var openTab = tabEntryTemplate.cloneNode(true);
    openTab.id = tabInfo.tab.id;
    openTab.onclick = openTabClicked;

    openTab.querySelector('.tabTitle').textContent = tabInfo.tab.title;

    var displayText = tabInfo.tab.selected ? '[Active]' :
        '[Inactive for ' + (tabInfo.ticks || '< 1') + ' minutes]';
    openTab.querySelector('.tabStatus').textContent = displayText;

    openTabsSection.appendChild(openTab);
    openTab.hidden = false;
  });

  var closedTabsSection = $('closedTabsSection');
  backgroundPage.closedTabs.forEach(function(tabInfo) {
    var closedTab = tabEntryTemplate.cloneNode(true);
    closedTab.id = tabInfo.tab.id;
    closedTab.onclick = closedTabClicked;

    closedTab.querySelector('.tabTitle').textContent = tabInfo.tab.title;

    closedTab.querySelector('.tabStatus').textContent =
        '[Closed for ' + (tabInfo.ticks || '< 1') + ' minutes]';

    closedTabsSection.appendChild(closedTab);
    closedTab.hidden = false;
  });
}

//Calls a function on the background page to focus on an open tab
function openTabClicked() {
  backgroundPage.selectTab(parseInt(this.id));
}

//Removes a tab from the UI
function removeTab(tabId) {
  var tabDiv = $(tabId);
  tabDiv.parentNode.removeChild(tabDiv);
}

window.onload = populateTabs;
