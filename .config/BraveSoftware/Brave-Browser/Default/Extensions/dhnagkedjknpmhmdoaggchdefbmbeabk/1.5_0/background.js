'use strict';

/* DATE UTILITY FUNCTIONS */

function addZero(i) {
  if (i < 10) {
      i = "0" + i;
  }
  return i;
}

function getActualHour() {
 let d = new Date();
 let h = addZero(d.getHours());
 let m = addZero(d.getMinutes());
 let s = addZero(d.getSeconds());
return h + ":" + m + ":" + s;
}

function getActualDate() {
  let d = new Date();
  let day = addZero(d.getDate());
  let month = addZero(d.getMonth()+1);
  let year = addZero(d.getFullYear());
return day + ". " + month + ". " + year;
}

/* END OF DATE UTILITY FUNCTIONS */

//this function convert the bytes into a readable format GB / Mb
function ConvertBytes(bytes) {
  let exp = Math.log(bytes) / Math.log(1024) | 0;
  let result = (bytes / Math.pow(1024, exp)).toFixed(2);
  return result + ' ' + (exp == 0 ? 'bytes': 'KMGTPEZY'[exp - 1] + 'B');
}

function ConvertGBtoBytes(gbValue) {
  return gbValue * 1024 * 1024 * 1024
}

//current available system memory
function getAvailableSystemMemory() {
  return new Promise( resolve => { 
    chrome.system.memory.getInfo(function(memoryInfo) {
      let availableMem=memoryInfo.availableCapacity; 
      resolve(availableMem);
    });
  });
}

//total system memory
var totalSystemMemory = new Promise( resolve => { 
    chrome.system.memory.getInfo(function(memoryInfo) {
      let totalSysMem=memoryInfo.capacity; 
      resolve(totalSysMem);
    });
 }); 

//default values
var keepPinnedTabs=true;
var discardOnNewTabOpen=true;
var timeOutSetting=10; //10 mins
var memoryPollingInterval=5; // 5 minutes
var memThreshold = totalSystemMemory.then(function (data) { memThreshold = 0.22*data; });

///////// EXTENSION INSTALLER LISTENER /////////
chrome.runtime.onInstalled.addListener(function() {
  //default values
  let keepPinnedTabs=true;
  let discardOnNewTabOpen=true;
  let timeOutSetting=10; //10 mins
  let memoryPollingInterval=5; // 5 minutes
 // let memThreshold = totalSystemMemory.then(function (data) { memThreshold = 0.22*data; });

  chrome.storage.sync.set({'memThreshold': memThreshold}, function() {   
    //console.log(getActualHour() + " => Extension installed -> Set default memThreshold = "+memThreshold); 
   });
  chrome.storage.sync.set({'timeOutSetting': timeOutSetting}, function() {  
    //console.log(getActualHour() + " => Extension installed -> Set default timeout = "+timeOutSetting+" minutes"); 
   });
  chrome.storage.sync.set({'memoryPollingSetting': memoryPollingInterval}, function() { 
    //console.log(getActualHour() + " => Extension installed -> Set default memory polling = " +memoryPollingInterval +" minutes"); 
   });
  chrome.storage.sync.set({'keepPinnedTabs': keepPinnedTabs}, function() { 
    //console.log(getActualHour() + " => Extension installed -> Set keepPinnedTabs = ",keepPinnedTabs);  
   });
  chrome.storage.sync.set({'discardOnNewTabOpen': discardOnNewTabOpen}, function() {
    //console.log(getActualHour() + " => Extension installed -> Set discardOnNewTabOpen = ",discardOnNewTabOpen);  
   });

});  


///////// MESSAGE RECEIVED LISTENER /////////
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    let tabSender=sender.tab;
      if (request.cmd == "TimeOutExpired") {
       if(!tabSender.active && !tabSender.audible && !tabSender.discarded && !tabSender.pinned) {
		     chrome.tabs.discard(tabSender.id,function() { 
            //console.log(getActualHour() + " => Tab Inactivity - TimeOutExpired - Discarded tab : "+ tabSender.url + " Id : "+tabSender.id ); 
          });
       }
       else {
        if(tabSender.pinned && !keepPinnedTabs) 
          chrome.tabs.discard(tabSender.id,function() { 
             //console.log(getActualHour() + " => Tab Inactivity - TimeOutExpired - Discarded tab : "+ tabSender.url + " Id : "+tabSender.id ); 
          });
       }
     }
	  // this is just to read messages. Commenting as there's no logic								  
    //if (request.cmd == "TimeOutSet") { } 
    //if (request.cmd == "TimeOutRemoved") { } 							  
    if (request.cmd == "DiscardAll") {
        chrome.tabs.query( {} , function(tabs) {
          tabs.forEach(tab => {
            if(!tab.active && !tab.audible && !tab.discarded && !tab.pinned ) {
              chrome.tabs.discard(tab.id,function() { })
            }
            else {
              if(tab.pinned && !keepPinnedTabs) 
                chrome.tabs.discard(tab.id,function() { });
             }
          });
        });
    } 
    if (request.cmd == "RestoreAll") {
      chrome.tabs.query( {} , function(tabs) {
        tabs.forEach(tab => {
          if(!tab.active && !tab.audible && tab.discarded) {
            chrome.tabs.reload(tab.id, {}, function() { })
          }
        });
      });
    } 
  });


 ///////// NEW TAB CREATED LISTENER  /////////
   chrome.tabs.onCreated.addListener(function() {
    getAvailableSystemMemory().then(function(data) {
     let memAvailable = data;
     /// CHANGE
     /// ***************** I THINK THIS FUNCTION NEEDS TO BE MODIFIED TO GET THE  memThreshold  FROM STORAGE BEFORE USING IT
     /// UPDATE : this seems to work fine, so no need to change it
        
     //console.log(getActualHour() + " => New Tab Created - Mem Available = "+ memAvailable + " Mem Threshold  = "+memThreshold, " discardOnNewTabOpen flag= ",discardOnNewTabOpen, " keepPinnedTabs flag = ",keepPinnedTabs ); 
     
     if( memAvailable <= memThreshold) {
      chrome.tabs.query( {} , function(tabs) {
                tabs.forEach(tab => {
           if(discardOnNewTabOpen && !tab.active && !tab.discarded && !tab.audible && !tab.pinned)  {
            /// CHANGE
            /// ***************** I THINK THIS FUNCTION NEEDS TO BE MODIFIED TO GET THE  discardOnNewTabOpen AND keepPinnedTabs FROM STORAGE BEFORE USING IT
           /// UPDATE : this seems to work fine, so no need to change it
            chrome.tabs.discard(tab.id,function() { 
              //console.log(getActualHour() + " => New Tab Created - Discarding => Tab id= ",tab.id," Mem Available = "+ memAvailable + " Mem Threshold  = "+memThreshold, " discardOnNewTabOpen flag= ",discardOnNewTabOpen ); 
             });
           }
           else {
            if(discardOnNewTabOpen && tab.pinned && !keepPinnedTabs) 
              chrome.tabs.discard(tab.id,function() { 
                //console.log(getActualHour() + " => New Tab Created - Discarding => Tab id= ",tab.id," Mem Available = "+ memAvailable + " Mem Threshold  = "+memThreshold, " discardOnNewTabOpen flag= ",discardOnNewTabOpen, " keepPinnedTabs flag = ",keepPinnedTabs ); 
             });
           }
         });
      });
     
      //resetting the memory polling alarm, as all the tabs have been discarded at this point
      chrome.alarms.clear("MemoryPollingAlarm", (wasCleared) => { 
        ////console.log(getActualHour() + " => New Tab Created - MemoryPollingAlarm reset => memoryPollingInterval = "+ memoryPollingInterval); 
        chrome.alarms.create("MemoryPollingAlarm", {"periodInMinutes":memoryPollingInterval}  );
      });
    }
   });
  });
 
///////// STORAGE CHANGE LISTENER /////////
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    
    for (var key in changes) {
      var storageChange = changes[key];
      
    if(key == "memoryPollingSetting" && storageChange.newValue != storageChange.oldValue ) {
      memoryPollingInterval=parseInt(storageChange.newValue);
	    //resetting the memory polling alarm, as all the memoryPollingValue has changed
      chrome.alarms.clear("MemoryPollingAlarm", (wasCleared) => { 
	      chrome.alarms.create("MemoryPollingAlarm", {"periodInMinutes":memoryPollingInterval}  );
      });
    }
    
    if(key == "timeOutSetting" && storageChange.newValue != storageChange.oldValue ) {
      timeOutSetting=parseInt(storageChange.newValue);
       chrome.tabs.query( {} , function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.reload(tab.id,{});
          });
        });
    }
    
    if(key == "memThreshold" && storageChange.newValue != storageChange.oldValue ) {
      memThreshold=parseFloat(storageChange.newValue); //no more actions needed? 
      //console.log(getActualHour() + " => Storage changed | memThreshold updated to: ",memThreshold);
    }

    if(key == "discardOnNewTabOpen" && storageChange.newValue != storageChange.oldValue ) {
      discardOnNewTabOpen=storageChange.newValue; 
      //console.log(getActualHour() + " => Storage changed | discardOnNewTabOpen updated to: ",discardOnNewTabOpen);
    }

    if(key == "keepPinnedTabs" && storageChange.newValue != storageChange.oldValue ) {
      keepPinnedTabs=storageChange.newValue; 
      //console.log(getActualHour() + " => Storage changed | keepPinnedTabs updated to: ",keepPinnedTabs);
    }

  }
});


///////// ALARM LISTENER /////////
chrome.alarms.onAlarm.addListener(function(alarm){
 
  chrome.storage.sync.get('memThreshold', function(result) { memThreshold = result.memThreshold; });
  chrome.storage.sync.get('memoryPollingSetting', function(result) {  memoryPollingInterval=result.memoryPollingSetting; });
  chrome.storage.sync.get('keepPinnedTabs', function(result) { keepPinnedTabs = result.keepPinnedTabs; });
  chrome.storage.sync.get('discardOnNewTabOpen', function(result) {  discardOnNewTabOpen=result.discardOnNewTabOpen; });

  getAvailableSystemMemory().then(function(data) {
   let memAvailable = data; 
    
    if( memAvailable <= memThreshold) {
       chrome.tabs.query( {} , function(tabs) {
         tabs.forEach(tab => {
          if(discardOnNewTabOpen && !tab.active && !tab.discarded && !tab.audible && !tab.pinned) {
             chrome.tabs.discard(tab.id,function() {  
		           //console.log(getActualHour() + " => Polling interval expired => Discarded tab = "+ tab.url + " Id = "+tab.id, " discardOnNewTabOpen flag= ",discardOnNewTabOpen, " keepPinnedTabs flag = ",keepPinnedTabs ); 
             })
          }
          else {
           if(discardOnNewTabOpen && tab.pinned && !keepPinnedTabs) 
            chrome.tabs.discard(tab.id,function() { 
              //console.log(getActualHour() + " => Polling interval expired => Discarded tab = "+ tab.url + " Id = "+tab.id, " discardOnNewTabOpen flag= ",discardOnNewTabOpen, " keepPinnedTabs flag = ",keepPinnedTabs ); 
           });
          }
          });
       });
    }
   
  });
  chrome.alarms.create("MemoryPollingAlarm", {"periodInMinutes":memoryPollingInterval}  );
  
 });

 chrome.alarms.create("MemoryPollingAlarm", {"periodInMinutes":memoryPollingInterval}  );
 