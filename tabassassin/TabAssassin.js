var backgroundPage = chrome.extension.getBackgroundPage();

//Adds a tab to the UI
function addedTab(tab) {
  var container = $("container");
  var closedTabHeader = $("closedTabsHeader");

  var openTab = createNode("div");
  openTab.id = tab.id;
  openTab.className = "tab";
  openTab.onclick = openTabClicked;
  openTab.innerHTML = tab.title;

  container.insertBefore(openTab, closedTabHeader);
}

//Calls a function on the background page to reopen a closed tab
function closedTabClicked() {
  backgroundPage.reopenTab(parseInt(this.id));
}

// Displays the opened and closed tabs to the user
function display() {
  var container = createNode("div");
  container.id = "container";

  var openTabHeader = createNode("div");
  openTabHeader.id = "openTabsHeader";
  openTabHeader.className = "header";
  openTabHeader.innerHTML = "Open tabs";

  container.appendChild(openTabHeader);

  var openTabRuler = createNode("div");
  openTabRuler.id = "openTabRuler";
  openTabRuler.className = "hr";

  container.appendChild(openTabRuler);

  backgroundPage.openTabs.forEach(function(tab) {
    var openTab = createNode("div");
    openTab.id = tab.tab.id;
    openTab.className = "tab";
    openTab.onclick = openTabClicked;
    openTab.innerHTML = tab.tab.title;

    container.appendChild(openTab);

    var openTabStatus = createNode("div");
    openTabStatus.className = "tabStatus";
    openTabStatus.innerHTML = "[Inactive for " + tab.ticks + " minutes]";
    /*
    if (backgroundPage.openTabs[i].tab.selected == true) {
     openTabStatus.innerHTML = "[Inactive for 0 minutes]";
    } else {
     openTabStatus.innerHTML = "[Inactive for " +
         backgroundPage.openTabs[i].ticks + " minutes]";
    }
    */

    container.appendChild(openTabStatus);
  });

  if(!backgroundPage.openTabs.length) {
    var noOpenTabsMessage = createNode("div");
    noOpenTabsMessage.id = "closedTabsHeader";
    noOpenTabsMessage.className = "message";
    noOpenTabsMessage.innerHTML = "There are no opens tabs. Impossible!";

    container.appendChild(noOpenTabsMessage);
  }

  var closedTabHeader = createNode("div");
  closedTabHeader.id = "closedTabsHeader";
  closedTabHeader.className = "header";
  closedTabHeader.innerHTML = "Assassinated tabs";
  container.appendChild(closedTabHeader);

  var closedTabRuler = createNode("div");
  closedTabRuler.id = "closedTabRuler";
  closedTabRuler.className = "hr";

  container.appendChild(closedTabRuler);

  if (backgroundPage.closedTabs.length > 0) {
    for (var i = 0; i < backgroundPage.closedTabs.length; i++) {
      var closedTab = createNode("div");
      closedTab.id = backgroundPage.closedTabs[i].tab.id;
      closedTab.className = "tab";
      closedTab.onclick = closedTabClicked;
      closedTab.innerHTML = backgroundPage.closedTabs[i].tab.title;

      container.appendChild(closedTab);

      var closedTabStatus = createNode("div");
      closedTabStatus.className = "tabStatus";
      closedTabStatus.innerHTML = "[Closed for " +
          backgroundPage.closedTabs[i].ticks + " minutes]";

      container.appendChild(closedTabStatus);
    }
  } else {
    var noClosedTabsMessage = createNode("div");
    noClosedTabsMessage.id = "closedTabsHeader";
    noClosedTabsMessage.className = "message";
    noClosedTabsMessage.innerHTML = "There are no closed tabs.";

    container.appendChild(noClosedTabsMessage);
  }

  document.body.appendChild(container);
}

//Calls a function on the background page to focus on an open tab
function openTabClicked() {
  backgroundPage.selectTab(parseInt(this.id));
}

//Removes a tab from the UI
function removeTab(tabId) {
  var container = $("container");
  var tabDiv = $(tabId);
  container.removeChild(tabDiv);

  if (backgroundPage.closedTabs.length == 0) {
    var noClosedTabsMessage = createNode("div");
    noClosedTabsMessage.id = "closedTabsHeader";
    noClosedTabsMessage.className = "message";
    noClosedTabsMessage.innerHTML = "There are no closed tabs.";

    container.appendChild(noClosedTabsMessage);
  }
}

window.onload = display;
