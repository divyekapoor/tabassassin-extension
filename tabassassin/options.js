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

function addToWhitelist()
{
  resetErrorMessages();

  var url = document.getElementById('whitelisturl').value;

  if (isUrl(url))
  {
    url = normalizeUrl(url);

    doesTabAssassinFolderExist(url)
  }
  else
  {
    document.getElementById('whitelisturl').className = 'whitelistUrlTextboxError';
    document.getElementById('whitelisturl').focus();
    document.getElementById('error').innerHTML = 'Not a valid website address.';
  }
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
  chrome.bookmarks.getChildren(tabAssassinFolder.id, function(whitelistedUrls)
  {
    var doesUrlExist = false;

    for (var i = 0; i < whitelistedUrls.length; i++)
    {
      if (whitelistedUrls[i].url == url)
      {
        doesUrlExist = true;
        break;
      }
      else
      {
        doesUrlExist = false;
      }
    }

    if (doesUrlExist == false)
    {
      chrome.bookmarks.create({'parentId' : tabAssassinFolder.id, 'title' : url, 'url' : url}, function(whitelistedUrl)
      {
        updateWhitelistedUrls();
      });

      displayWhitelistedUrl(url);
    }
    else
    {
      document.getElementById('whitelisturl').className = 'whitelistUrlTextboxError';
      document.getElementById('whitelisturl').focus();
      document.getElementById('error').innerHTML = 'That website address has already been added.';
    }
  });
}

function updateWhitelistedUrls()
{
  chrome.bookmarks.getChildren('2', function(bookmarks)
  {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    //If the Tab Assassin folder does exist
    if (tabAssassinFolder != null)
    {
      chrome.bookmarks.getChildren(tabAssassinFolder.id, function(whitelistedUrlBookmarks)
      {
        backgroundPage.whitelistedUrls = whitelistedUrlBookmarks;
      });
    }
  });
}

function displayWhitelistedUrl(url)
{
  var containerDiv = document.createElement('div');
  containerDiv.id = 'ContainerFor' + url;
  containerDiv.className = 'whitelistedUrlContainer';

  var textLabelContainerDiv = document.createElement('div');
  textLabelContainerDiv.className = 'whitelistedUrlTextLabelContainer';
  textLabelContainerDiv.innerHTML = url;

  var removeContainerDiv = document.createElement('div');
  removeContainerDiv.className = 'removeWhitelistedUrlContainer';

  var removeWhitelistedUrlImage = document.createElement('img');
  removeWhitelistedUrlImage.id = url;
  //removeWhitelistedUrlImage.className = 'removeWhitelistedUrlContainer';
  removeWhitelistedUrlImage.src = 'images/remove.png';
  removeWhitelistedUrlImage.alt = 'Remove';
  removeWhitelistedUrlImage.title = 'Remove';
  removeWhitelistedUrlImage.onmouseover = removeImageMouseOver;
  removeWhitelistedUrlImage.onmouseout = removeImageMouseOut;
  removeWhitelistedUrlImage.onmouseup = removeWhitelistedUrl;

  removeContainerDiv.appendChild(removeWhitelistedUrlImage);

  containerDiv.appendChild(textLabelContainerDiv);
  containerDiv.appendChild(removeContainerDiv);

  document.getElementById('urlWhitelist').insertBefore(containerDiv, document.getElementById('urlWhitelist').firstChild);
}

function displayWhitelistedUrls()
{
  chrome.bookmarks.getChildren('2', function(bookmarks)
  {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    //If the Tab Assassin folder does exist
    if (tabAssassinFolder != null)
    {
      chrome.bookmarks.getChildren(tabAssassinFolder.id, function(whitelistedUrls)
      {
        for (var i = 0; i < whitelistedUrls.length; i++)
        {
          var containerDiv = document.createElement('div');
          containerDiv.id = 'ContainerFor' + whitelistedUrls[i].url;
          containerDiv.className = 'whitelistedUrlContainer';

          var textLabelContainerDiv = document.createElement('div');
          textLabelContainerDiv.className = 'whitelistedUrlTextLabelContainer';
          textLabelContainerDiv.innerHTML = whitelistedUrls[i].url;

          var removeContainerDiv = document.createElement('div');
          removeContainerDiv.className = 'removeWhitelistedUrlContainer';

          var removeWhitelistedUrlImage = document.createElement('img');
          removeWhitelistedUrlImage.id = whitelistedUrls[i].url;
          //removeWhitelistedUrlImage.className = 'removeWhitelistedUrlContainer';
          removeWhitelistedUrlImage.src = 'images/remove.png';
          removeWhitelistedUrlImage.alt = 'Remove';
          removeWhitelistedUrlImage.title = 'Remove';
          removeWhitelistedUrlImage.onmouseover = removeImageMouseOver;
          removeWhitelistedUrlImage.onmouseout = removeImageMouseOut;
          removeWhitelistedUrlImage.onmouseup = removeWhitelistedUrl;

          removeContainerDiv.appendChild(removeWhitelistedUrlImage);

          containerDiv.appendChild(textLabelContainerDiv);
          containerDiv.appendChild(removeContainerDiv);

          document.getElementById('urlWhitelist').insertBefore(containerDiv, document.getElementById('urlWhitelist').firstChild);

          backgroundPage.whitelistedUrls = whitelistedUrls;
        }
      });
    }
  });
}

function removeWhitelistedUrl()
{
  var url = this.id;

  chrome.bookmarks.getChildren('2', function(bookmarks)
  {
    var tabAssassinFolder = getBookmarkFolder(bookmarks, 'Tab Assassin');

    //If the Tab Assassin folder does exist
    if (tabAssassinFolder != null)
    {
      chrome.bookmarks.getChildren(tabAssassinFolder.id, function(whitelistedUrls)
      {
        for (var i = 0; i < whitelistedUrls.length; i++)
        {
          if (whitelistedUrls[i].url == url)
          {
            chrome.bookmarks.remove(whitelistedUrls[i].id, function()
            {
              updateWhitelistedUrls();
            });

      break;
          }
        }
      });
    }
  });

  document.getElementById('urlWhitelist').removeChild(document.getElementById('ContainerFor' + url));
}

function isUrl(url)
{
  var pattern = '^(http:\/\/www.|https:\/\/www.|www.){1}([0-9A-Za-z]+\.)';

  if (url.match(pattern))
  {
    return true;
  }
  else
  {
    return false;
  }
}

// Saves options to localStorage.
function saveOptions()
{
  if(validateForm())
  {
    var inactiveTime = document.getElementById('inactiveTime').value;
    localStorage['inactiveTime'] = inactiveTime;

    if (document.getElementById('inactivityMinutes').selected)
    {
      inactiveTime = inactiveTime;
      localStorage['inactivityMinutesSelected'] = 'true';
      localStorage['inactivityHoursSelected'] = 'false';
      localStorage['inactivityDaysSelected'] = 'false';

    }
    else if (document.getElementById('inactivityHours').selected)
    {
      inactiveTime = inactiveTime*60;
      localStorage['inactivityMinutesSelected'] = 'false';
      localStorage['inactivityHoursSelected'] = 'true';
      localStorage['inactivityDaysSelected'] = 'false';
    }
    else if (document.getElementById('inactivityDays').selected)
    {
      inactiveTime = inactiveTime*24*60;
      localStorage['inactivityMinutesSelected'] = 'false';
      localStorage['inactivityHoursSelected'] = 'false';
      localStorage['inactivityDaysSelected'] = 'true';
    }

    localStorage['inactiveThreshold'] = inactiveTime;

    var closedTime = document.getElementById('closedTime').value;
    localStorage['closedTime'] = closedTime;

    if (document.getElementById('closedMinutes').selected)
    {
      closedTime = closedTime;
      localStorage['closedMinutesSelected'] = 'true';
      localStorage['closedHoursSelected'] = 'false';
      localStorage['closedDaysSelected'] = 'false';
    }
    else if (document.getElementById('closedHours').selected)
    {
      closedTime = closedTime*60;
      localStorage['closedMinutesSelected'] = 'false';
      localStorage['closedHoursSelected'] = 'true';
      localStorage['closedDaysSelected'] = 'false';
    }
    else if (document.getElementById('closedDays').selected)
    {
      closedTime = closedTime*24*60;
      localStorage['closedMinutesSelected'] = 'false';
      localStorage['closedHoursSelected'] = 'false';
      localStorage['closedDaysSelected'] = 'true';
    }

    localStorage['storeClosedTabsThreshold'] = closedTime;

    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.refreshIntervals();

    var status = document.getElementById('status');
    status.className = 'noError';
    status.innerHTML = 'Options Saved.';
    setTimeout(function()
    {
      status.innerHTML = '';
    }, 750);
  }
}

function validateForm()
{
  var inactiveTime = document.getElementById('inactiveTime').value;

  if (typeof inactiveTime == 'undefined' || inactiveTime == null || inactiveTime.length == 0)
  {
    errorMessage('The time a tab can be inactive before it is closed cannot be empty.')
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

  var closedTime = document.getElementById('closedTime').value;

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

function isDigit(c)
{
  if (parseInt(c) >= 0 && parseInt(c) <= 9)
  {
    return true;
  }
  else
  {
    return false;
  }
}

function errorMessage(message)
{
  var status = document.getElementById('status');
  status.className = 'error';
  status.innerHTML = message;
}

function prepForInput()
{
  var url = document.getElementById('whitelisturl').value;

  if (url == 'e.g. www.google.com')
  {
    document.getElementById('whitelisturl').value = '';
  }
}

function resetErrorMessages()
{
  document.getElementById('whitelisturl').className = '';
  document.getElementById('error').innerHTML = '';
}

// Restores select box state to saved value from localStorage.
function restoreOptions()
{
  var inactiveTime = localStorage['inactiveTime'];
  if (inactiveTime != null)
  {
    document.getElementById('inactiveTime').value = inactiveTime;
  }
  else
  {
    document.getElementById('inactiveTime').value = 1;
  }

  var inactivityMinutesSelected = localStorage['inactivityMinutesSelected'];
  var inactivityHoursSelected = localStorage['inactivityHoursSelected'];
  var inactivityDaysSelected = localStorage['inactivityDaysSelected'];

  if(inactivityMinutesSelected == 'true')
  {
    document.getElementById('inactivityMinutes').selected = true;
  }
  else if(inactivityHoursSelected == 'true')
  {
    document.getElementById('inactivityHours').selected = true;
  }
  else if(inactivityDaysSelected == 'true')
  {
    document.getElementById('inactivityDays').selected = true;
  }
  else
  {
    document.getElementById('inactivityHours').selected = true;
  }

  var closedTime = localStorage['closedTime'];
  if (closedTime != null)
  {
    document.getElementById('closedTime').value = closedTime;
  }
  else
  {
    document.getElementById('closedTime').value = 1;
  }

  var closedMinutesSelected = localStorage['closedMinutesSelected'];
  var closedHoursSelected = localStorage['closedHoursSelected'];
  var closedDaysSelected = localStorage['closedDaysSelected'];

  if(closedMinutesSelected == 'true')
  {
    document.getElementById('closedMinutes').selected = true;
  }
  else if(closedHoursSelected == 'true')
  {
    document.getElementById('closedHours').selected = true;
  }
  else if(closedDaysSelected == 'true')
  {
    document.getElementById('closedDays').selected = true;
  }
  else
  {
    document.getElementById('closedDays').selected = true;
  }

  displayWhitelistedUrls();
}

function removeImageMouseOver()
{
  this.src = 'images/removeOnHover.png';
}

function removeImageMouseOut()
{
  this.src = 'images/remove.png';
}

window.onload = function() {
  $('whitelisturl').onclick = prepForInput;
  $('saveDiv').querySelector('button').onclick = saveOptions;
  $('whiteListedUrlInputContainer').querySelector('button').onclick =
      addToWhitelist;

  restoreOptions();
}
