//this function convert the bytes into a readable format GB / Mb but doesn't add the symbol at the end
function ConvertBytes(bytes) {
  let exp = Math.log(bytes) / Math.log(1024) | 0;
  let result = (bytes / Math.pow(1024, exp)).toFixed(1);
  return result;
}

function ConvertGBtoBytes(gbValue) {
  return gbValue * 1024 * 1024 * 1024
}

let btnSave = document.getElementById('btnSave');

btnSave.onclick=function() { 

  let memVal = document.getElementById('memUserSetting').value;
  let timeVal = document.getElementById('timeUserSetting').value;
  let pollVal = document.getElementById('memoryPollingUserSetting').value;
  let keepPinnedTabVal = document.getElementById('keepPinnedTabSwitchUserSetting').checked;
  let discardOnNewTabOpenVal = document.getElementById('discardOnNewTabOpenUserSetting').checked;
  
  if(memVal!="") {
    var memValinGB=parseFloat(memVal);
    memVal= ConvertGBtoBytes(memValinGB);
    chrome.storage.sync.set({memThreshold: memVal}, function() { });
  }
  
  if(timeVal!="") {
    timeVal=parseInt(timeVal);
     chrome.storage.sync.set({timeOutSetting: timeVal}, function() { });
  }
 
  if(pollVal!="") {
   pollVal=parseInt(pollVal);
   chrome.storage.sync.set({memoryPollingSetting: pollVal}, function() {  });
  }

  chrome.storage.sync.set({keepPinnedTabs: keepPinnedTabVal}, function() { });
  chrome.storage.sync.set({discardOnNewTabOpen: discardOnNewTabOpenVal}, function() { });
  
}

let btnDiscardAll = document.getElementById('btnDiscardAll');

btnDiscardAll.onclick=function() { 
  chrome.runtime.sendMessage({cmd: "DiscardAll"},{ });
};

let btnRestoreAll = document.getElementById('btnRestoreAll');

btnRestoreAll.onclick=function() { 
  chrome.runtime.sendMessage({cmd: "RestoreAll"},{ });
};

window.addEventListener('load', function() {
  let inputMemCtrl = document.getElementById('memUserSetting');
  let inputTimeCtrl = document.getElementById('timeUserSetting');
  let inputMemPollCtrl = document.getElementById('memoryPollingUserSetting');
  let keepPinnedTabsCtrl = document.getElementById('keepPinnedTabSwitchUserSetting')
  let discardOnNewTabOpenCtrl = document.getElementById('discardOnNewTabOpenUserSetting')

  chrome.storage.sync.get('memThreshold', (result) => inputMemCtrl.value=ConvertBytes(result.memThreshold) );
  chrome.storage.sync.get('timeOutSetting', (result) => inputTimeCtrl.value=result.timeOutSetting );
  chrome.storage.sync.get('memoryPollingSetting', (result) => inputMemPollCtrl.value=result.memoryPollingSetting );
  chrome.storage.sync.get('keepPinnedTabs', (result) => keepPinnedTabsCtrl.checked=result.keepPinnedTabs );
  chrome.storage.sync.get('discardOnNewTabOpen', (result) => discardOnNewTabOpenCtrl.checked=result.discardOnNewTabOpen );

  
}, true);
