/* Copyright 2011 Google Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. */

var backgroundPage = chrome.extension.getBackgroundPage();

// Calls a function on the background page to reopen a closed tab
function closedTabClicked() {
  backgroundPage.reopenTab(parseInt(this.id));
}

function minutesText(ticks) {
  if (ticks >= 120)
    return Math.floor(ticks / 60) + ' hours ago';

  return ticks ? ticks + ' minutes ago' : '< 1 minute ago';
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
    openTab.style.backgroundImage =
        'url(chrome://favicon/' + tabInfo.tab.url + ')';

    openTab.querySelector('.tabTitle').textContent = tabInfo.tab.title;

    var displayText = tabInfo.tab.selected ? 'In use' :
        tabInfo.tab.pinned ? 'Pinned' :
        'Last used ' + minutesText(tabInfo.ticks);
    openTab.querySelector('.tabStatus').textContent = displayText;
    if (tabInfo.tab.selected)
      openTab.classList.add('selected');

    openTabsList.appendChild(openTab);
    openTab.hidden = false;
  });

  var closedTabsList = document.querySelector('#closedTabsSection .tabList');
  var lastClosedTab = null;
  backgroundPage.closedTabs.forEach(function(tabInfo) {
    if (tabInfo.tab.windowId != tabs[0].windowId)
      return;

    var closedTab = tabEntryTemplate.cloneNode(true);
    closedTab.id = tabInfo.tab.id;
    closedTab.onclick = closedTabClicked;
    closedTab.style.backgroundImage =
        'url(chrome://favicon/' + tabInfo.tab.url + ')';

    closedTab.querySelector('.tabTitle').textContent = tabInfo.tab.title;
    closedTab.querySelector('.tabStatus').textContent =
        'Removed ' + minutesText(tabInfo.ticks);

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
