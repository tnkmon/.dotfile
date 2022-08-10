

var tId=0;

var timeoutVal=new Promise( resolve => { 
  chrome.storage.sync.get('timeOutSetting', function(result) {
    let timeout=parseInt(result.timeOutSetting);
      resolve(timeout);
  });
});

document.addEventListener('visibilitychange', function(){
  if (document.visibilityState === 'visible') {
     window.clearTimeout(tId);
  } else {
    timeoutVal.then(function (data) {
      data=data*60000; //minutes
      tId=window.setTimeout(function(){ chrome.runtime.sendMessage({cmd: "TimeOutExpired"},{ }); },data);
     });
  }
});








