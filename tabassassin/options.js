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

function createRemoveWhitelistButton(url) {
  var button = createNode('button');
  button.url_ = url;
  button.className = 'whitelistRemove';
  button.title = 'Remove';
  button.onclick = removeWhitelistedUrl;
  return button;
}

function addToWhitelist() {
  resetErrorMessages();

  var url = $('whitelisturl').value;

  if (isUrl(url)) {
    url = normalizeUrl(url);

    doesTabAssassinFolderExist(url)
  } else {
    $('whitelisturl').className = 'whitelistUrlTextboxError';
    $('whitelisturl').focus();
    $('error').textContent = 'Not a valid website address.';
  }

  $('whitelisturl').value = '';
  $('whitelisturl').blur();
}

function normalizeUrl(url)
{
  var pattern = '^(www.){1}([0-9A-Za-z]+\.)';

  //If the url does not include http:// add it
  if (url.match(pattern))
  {
    url = 'http://' + url;
  }

  if (url.charAt(url.length - 1) != '/')
  {
    url = url + '/';
  }

  return url;
}

function doesTabAssassinFolderExist(url)
{
  chrome.bookmarks.getChildren('2', function(bookmarks)
  {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    //If the MyTabs folder does not exist, create a MyTabs folder
    if (tabAssassinFolder == null)
    {
      //Create a MyTabs folder
      chrome.bookmarks.create({'parentId' : '2', 'title' : 'Tab Assassin'}, function(tabAssassinFolder)
      {
        console.log('Created a Tab Assassin folder.');
        //Created the Tab Assassin folder
        addUrlToWhitelist(tabAssassinFolder, url);
      });
    }
    else
    {
      addUrlToWhitelist(tabAssassinFolder, url);
    }
  });
}

function getBookmarkFolder(bookmarks, folderName)
{
  var bookmarkFolder;

  for (var i = 0; i < bookmarks.length; i++)
  {
    if (bookmarks[i].title == folderName && !bookmarks[i].url)
    {
      bookmarkFolder = bookmarks[i];
      break;
    }
  }

  return bookmarkFolder;
}

function addUrlToWhitelist(tabAssassinFolder, url)
{
  chrome.bookmarks.getChildren(tabAssassinFolder.id, function(whitelistedUrls) {
    var doesUrlExist = false;

    for (var i = 0; i < whitelistedUrls.length; i++) {
      if (whitelistedUrls[i].url == url) {
        doesUrlExist = true;
        break;
      } else {
        doesUrlExist = false;
      }
    }

    if (!doesUrlExist) {
      chrome.bookmarks.create({'parentId' : tabAssassinFolder.id,
                               'title' : url,
                               'url' : url},
        function(whitelistedUrl) {
          updateWhitelistedUrls();
        });

      displayWhitelistedUrl(url);
    } else {
      $('whitelisturl').className = 'whitelistUrlTextboxError';
      $('whitelisturl').focus();
      $('error').textContent = 'That website address has already been added.';
    }
  });
}

function updateWhitelistedUrls() {
  chrome.bookmarks.getChildren('2', function(bookmarks) {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    if (tabAssassinFolder) {
      chrome.bookmarks.getChildren(tabAssassinFolder.id,
        function(whitelistedUrlBookmarks) {
          backgroundPage.whitelistedUrls = whitelistedUrlBookmarks;
        });
    }
  });
}

function displayWhitelistedUrl(url) {
  var containerDiv = createNode('div');
  containerDiv.id = 'ContainerFor' + url;
  containerDiv.className = 'whitelistedUrlContainer';

  var textLabelContainerDiv = createNode('span');
  textLabelContainerDiv.textContent = url;
  containerDiv.appendChild(textLabelContainerDiv);

  containerDiv.appendChild(createRemoveWhitelistButton(url));

  $('urlWhitelist').appendChild(containerDiv);
}

function displayWhitelistedUrls() {
  chrome.bookmarks.getChildren('2', function(bookmarks)
  {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    //If the Tab Assassin folder does exist
    if (tabAssassinFolder != null)
    {
      chrome.bookmarks.getChildren(tabAssassinFolder.id,
        function(whitelistedUrls) {
          for (var i = 0; i < whitelistedUrls.length; i++) {
            displayWhitelistedUrl(whitelistedUrls[i].url);
          }

          backgroundPage.whitelistedUrls = whitelistedUrls;
        });
    }
  });
}

function removeWhitelistedUrl() {
  var url = this.url_;

  chrome.bookmarks.getChildren('2', function(bookmarks) {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    //If the Tab Assassin folder does exist
    if (tabAssassinFolder) {
      chrome.bookmarks.getChildren(tabAssassinFolder.id,
          function(whitelistedUrls) {
        for (var i = 0; i < whitelistedUrls.length; i++) {
          if (whitelistedUrls[i].url == url) {
            chrome.bookmarks.remove(whitelistedUrls[i].id, function() {
              updateWhitelistedUrls();
            });

           break;
          }
        }
      });
    }
  });

  $('urlWhitelist').removeChild($('ContainerFor' + url));
}

function isUrl(url) {
  var pattern = '^(http:\/\/www.|https:\/\/www.|www.){1}([0-9A-Za-z]+\.)';

  if (url.match(pattern))
    return true;
  else
    return false;
}

// Saves options to localStorage.
function saveOptions() {
  if(validateForm()) {
    var inactiveTime = $('inactiveTime').value;
    localStorage['inactiveTime'] = inactiveTime;

    if ($('inactivityMinutes').selected) {
      inactiveTime = inactiveTime;
      localStorage['inactivityMinutesSelected'] = 'true';
      localStorage['inactivityHoursSelected'] = 'false';
      localStorage['inactivityDaysSelected'] = 'false';
    } else if ($('inactivityHours').selected) {
      inactiveTime = inactiveTime*60;
      localStorage['inactivityMinutesSelected'] = 'false';
      localStorage['inactivityHoursSelected'] = 'true';
      localStorage['inactivityDaysSelected'] = 'false';
    } else if ($('inactivityDays').selected) {
      inactiveTime = inactiveTime*24*60;
      localStorage['inactivityMinutesSelected'] = 'false';
      localStorage['inactivityHoursSelected'] = 'false';
      localStorage['inactivityDaysSelected'] = 'true';
    }

    localStorage['inactiveThreshold'] = inactiveTime;

    var closedTime = $('closedTime').value;
    localStorage['closedTime'] = closedTime;

    if ($('closedMinutes').selected) {
      closedTime = closedTime;
      localStorage['closedMinutesSelected'] = 'true';
      localStorage['closedHoursSelected'] = 'false';
      localStorage['closedDaysSelected'] = 'false';
    } else if ($('closedHours').selected) {
      closedTime = closedTime*60;
      localStorage['closedMinutesSelected'] = 'false';
      localStorage['closedHoursSelected'] = 'true';
      localStorage['closedDaysSelected'] = 'false';
    } else if ($('closedDays').selected) {
      closedTime = closedTime*24*60;
      localStorage['closedMinutesSelected'] = 'false';
      localStorage['closedHoursSelected'] = 'false';
      localStorage['closedDaysSelected'] = 'true';
    }

    localStorage['storeClosedTabsThreshold'] = closedTime;

    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.setThresholds();

    var status = $('status');
    status.className = 'noError';
    status.textContent = 'Options Saved.';
    status.classList.remove('hiddenStatus');
    window.setTimeout(function() {
      status.classList.add('hiddenStatus')
    }, 0);
  }
}

function validateForm()
{
  var inactiveTime = $('inactiveTime').value;

  if (!inactiveTime) {
    errorMessage(
        'The time a tab can be inactive before it is closed cannot be empty.');
    return false;
  }

  for (var i = 0; i < inactiveTime.length; i++)
  {
    if (false == isDigit(inactiveTime.charAt(i)))
    {
      errorMessage('The time a tab can be inactive before it is closed must be a number.');
      return false;
    }
  }

  var closedTime = $('closedTime').value;

  if (typeof closedTime == 'undefined' || closedTime == null || closedTime.length == 0)
  {
    errorMessage('The time a tab can be closed before it is removed cannot be empty.');
    return false;
  }

  for (var i = 0; i < closedTime.length; i++)
  {
    if (false == isDigit(closedTime.charAt(i)))
    {
      errorMessage('The time a tab can be closed before it is remove must be a number.');
      return false;
    }
  }

  return true;
}

function isDigit(c) {
  return parseInt(c) >= 0 && parseInt(c) <= 9;
}

function errorMessage(message)
{
  var status = $('status');
  status.className = 'error';
  status.textContent = message;
  status.classList.remove('hiddenStatus');
  window.setTimeout(function() {
    status.classList.add('hiddenStatus')
  }, 0);
}

function resetErrorMessages()
{
  $('whitelisturl').className = '';
  $('error').textContent = '';
}

// Restores select box state to saved value from localStorage.
function restoreOptions() {
  var inactiveTime = localStorage['inactiveTime'];
  if (inactiveTime != null)
    $('inactiveTime').value = inactiveTime;
  else
    $('inactiveTime').value = 1;

  var inactivityMinutesSelected = localStorage['inactivityMinutesSelected'];
  var inactivityHoursSelected = localStorage['inactivityHoursSelected'];
  var inactivityDaysSelected = localStorage['inactivityDaysSelected'];

  if(inactivityMinutesSelected == 'true')
    $('inactivityMinutes').selected = true;
  else if(inactivityHoursSelected == 'true')
    $('inactivityHours').selected = true;
  else if(inactivityDaysSelected == 'true')
    $('inactivityDays').selected = true;
  else
    $('inactivityHours').selected = true;

  var closedTime = localStorage['closedTime'];
  if (closedTime != null)
    $('closedTime').value = closedTime;
  else
    $('closedTime').value = 1;

  var closedMinutesSelected = localStorage['closedMinutesSelected'];
  var closedHoursSelected = localStorage['closedHoursSelected'];
  var closedDaysSelected = localStorage['closedDaysSelected'];

  if(closedMinutesSelected == 'true')
    $('closedMinutes').selected = true;
  else if(closedHoursSelected == 'true')
    $('closedHours').selected = true;
  else if(closedDaysSelected == 'true')
    $('closedDays').selected = true;
  else
    $('closedDays').selected = true;

  displayWhitelistedUrls();
}

window.onload = function() {
  $('saveDiv').querySelector('button').onclick = saveOptions;

  var addWhitelistButton =
      $('whiteListedUrlInputContainer').querySelector('button');
  addWhitelistButton.onclick = addToWhitelist;
  $('whitelisturl').onkeydown = function(e) {
    if (e.keyIdentifier == 'Enter')
      this.parentNode.querySelector('button').click();
  };

  restoreOptions();
}
