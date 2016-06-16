function isAndroid(){
        return navigator.userAgent.indexOf("Android") > 0;
}

function isiOS(){
        return ( navigator.userAgent.indexOf("iPhone") > 0 || navigator.userAgent.indexOf("iPad") > 0 || navigator.userAgent.indexOf("iPod") > 0); 
}

function  FileManager()  {
  this._fileSystem = null;
  this._root = null;
  this._dict = null;
  this._data = null;
  this.currentDir = null;
  this.parentDir = null;
  this.selectedFiles = [];
  this.warn("created FileManager object");
  $('#backBtn').hide();
  this.enableFileSystems();
  //
  this.operation = "manage";
  this.selectMode = "multi";
  this.selectedCallback = null;
  this.activeItem = null; // The clicked item
  this.activeItemType = null; // d-directory, f-file
  this.clipboardItem = null; // file or directory for copy or move 
  this.clipboardAction = null; // c-copy, m-move
};

FileManager.prototype.warn = function(message) {
  CifJs.warn(message);
}
FileManager.prototype.info = function(message) {
  CifJs.info(message);
}

/* get the root file system */
FileManager.prototype.enableFileSystems = function() {
    var fm = this;
    window.requestFileSystem(window.PERSISTENT, 0,
        function(fileSystem){ // success get file system
            fm._fileSystem = fileSystem;
            fm._root = fileSystem.root;  // "/"
            fm.warn("File system root: " +fm._root.toURL()); 
          if (isAndroid() ) {   
            var folder = new DirectoryEntry({fullPath: 'content://www'});
            fm.warn("haha: " + folder.fullPath + " : " + folder.toURL()); 
            //fm.mapDataDictFolders(folder);
            this.currentDir = folder;
           } else if (isiOS()) {
              //var folder = new DirectoryEntry({fullPath: 'cdvfile://localhost/persistent'});
              folder = fm._root;
              if (folder) {
                fm.currentDir = folder;
                fm.mapDataDictFolders(folder);
              } else {
                fm.warn("can't get persistent folder");
              }
           }
        }, function(evt){ // error get file system
            fm.warn("Error " + evt.target.error.code);
            CifJs.log("File System Error: "+evt.target.error.code);
        }
    );

};


FileManager.prototype.mapDataDictFolders = function(parentF) {
  var fm = this;
  var directoryReader = parentF.createReader();
  directoryReader.readEntries(function(entries){
    var dirArr = new Array();
    var fileArr = new Array();
    for(var i=0; i<entries.length; ++i){ // sort entries
      var entry = entries[i];
//        fm.warn("file: " + entry.name);
      if( entry.isDirectory && entry.name == 'data' )  {
         fm.warn("Found existing data folder");
          fm._data = entry;
      }
      if( entry.isDirectory && entry.name == 'dict' )  {
        fm.warn("Found existing dict folder");
        fm._dict = entry;
      }
    }

  var data; 
  if (! fm._data) {
     var dataSrc = null;
     cordova.filesystem.getDirectoryForPurpose('app-bundle',
             { create: false, exclusive: true},
         function(p1) {
          try {
           fm.warn("found www directory." + p1.toURL());
           
            var dataSrc = p1.getDirectory('www/data',
               { create: false},
                 function (p2) {
                    fm.warn("found www/data folder" + p2.toURL());
                    
            p2.copyTo(parentF, 'data',
          function(parent) {
            fm.warn("coppied www data directory." + parent.toURL());
          }, function(error) {
           fm.warn("Unable to copy www/data directory: " + error.code);
          } );
                    
                 }, function (error) {
                    fm.warn("no  www/data folder");
                 } );
            
           } catch(e) {
              fm.warn("ddb " +  e);
           }
         }, function(error) {
           fm.warn("Unable to find source data directory: " + error.code);
        } );
  }
  var dict; 
  if (! fm._dict) {
     var dataSrc = null;
     cordova.filesystem.getDirectoryForPurpose('app-bundle',
             { create: false, exclusive: true},
         function(p1) {
          try {
           fm.warn("found www directory." + p1.toURL());
           
            var dataSrc = p1.getDirectory('www/dict',
               { create: false},
                 function (p2) {
                    fm.warn("found www/dict folder" + p2.toURL());
                    
            p2.copyTo(parentF, 'dict',
          function(parent) {
            fm.warn("coppied www dict directory." + parent.toURL());
          }, function(error) {
           fm.warn("Unable to copy www/dict directory: " + error.code);
          } );
                    
                 }, function (error) {
                    fm.warn("no  www/dict folder");
                 } );
            
           } catch(e) {
              fm.warn("ddb " +  e);
           }
         }, function(error) {
           fm.warn("Unable to find source dict directory: " + error.code);
        } );
  }
  });
};


/*
 * This is called in response to external program passing
 * of a CIF file to CifJs and calling our global func handleOpenURL() 
 */
FileManager.prototype.loadURL = function(url, callback) {
  window.resolveLocalFileSystemURL(url, function(fileEntry) {
      callback([fileEntry]);
  });
};

FileManager.prototype.choose = function(mode, filetype, callback) {
  this.operation = "choose";
  this.selectMode = mode; // single || multi
  this.selectFileType = filetype; // cif || dic  
  this.selectedFiles = [];
  this.selectedCallback = callback;
  this.manage();
};

FileManager.prototype.getSelectedFiles = function() {
  var interval1 = setInterval(function() {
    $.mobile.loadingMessage = "loading file ...";
    $.mobile.loading('show'); // show loading message
     clearInterval(interval1);
  },1);
  this.selectMode = null; 
  this.selectFileType = null;  
  var files = this.selectedFiles;
  this.selectedFiles = [];
  this.operation = "manage";
  return this.selectedCallback(files);
};


/* 
 * provide a file browser
 */
FileManager.prototype.manage = function() {
  var fm = this;
  if (this.currentDir) {
     this.listDir(this.currentDir);
     this.clickItemAction();
     return;
  }
    window.requestFileSystem(window.PERSISTENT, 0,
        function(fileSystem){ // success got file system
            fm.listDir(fm.currentDir);
            fm.clickItemAction();
        }, function(evt){ // error get file system
            fm.warn("File System Error: "+evt.target.error.code);
        }
    );
};


/* show the content of a directory */
FileManager.prototype.listDir = function(directoryEntry) {
 var fm = this;
    if( !directoryEntry.isDirectory ) CifJs.log('listDir incorrect type');
    var interval1 = setInterval(function() {
      $.mobile.loadingMessage = "directory listing ...";
      $.mobile.loading('show'); // show loading message
      clearInterval(interval1);
    },1);
  
     
    // currentDir = directoryEntry; // set current directory
    directoryEntry.getParent(function(par){ // success get parent
        var parentDir = par; // set parent directory
        if( (parentDir.name == 'sdcard' && currentDir.name != 'sdcard') ||
             parentDir.name != 'sdcard' )  $('#backBtn').show();
        fm.parentDir = parentDir;
    }, function(error){ // error get parent
        CifJs.log('Get parent error: '+error.code);
    });
    this.currentDir = directoryEntry; // now it is.
     
    var directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(function(entries){
        var dirContent = $('#dirContent');
        dirContent.empty(); //erase previous listing
        dirContent.prev().replaceWith('<h2>Folder: ' +directoryEntry.name + '</h2>');

        var dirArr = new Array();
        var fileArr = new Array();
        for(var i=0; i<entries.length; ++i){ // sort entries
            var entry = entries[i];
            if( entry.isDirectory && entry.name[0] != '.' ) dirArr.push(entry);
            else if( entry.isFile && entry.name[0] != '.' ) fileArr.push(entry);
        }
        var sortedArr = dirArr.concat(fileArr); // sorted entries

        var tablegen = null;
        var checkit = '';
        if (fm.operation == "manage") {
          checkit = '<td><input type="checkbox"/></td>';
          tablegen = '<table><thead><th><input type="checkbox"/></th><th /><th style="width:150px;text-align:right;">size</th><th>modified</th></thead><tbody></tbody></table>'
        } else  if (fm.selectMode == "multi") {
          checkit = '<td><input type="checkbox"/></td>';
          tablegen = '<table><thead><th><input type="checkbox"/></th><th /><th style="width:150px;text-align:right;">size</th><th>modified</th></thead><tbody></tbody></table>'
         
        } else  if (fm.selectMode == "single") {
          checkit = '<td></td>';
          tablegen = '<table><thead><th></th><th /><th style="width:150px;text-align:right;">size</th><th>modified</th></thead><tbody></tbody></table>'
        } else {
           alert("ddb:" + fm.operation + ":" + fm.selectMode+ ":");
        }

        //var uiBlock = ['a','b','c','d'];
        var tbody = $(tablegen)
	        .appendTo(dirContent)
     	    .find('tbody'); 
        for(var i=0; i<sortedArr.length; ++i){ // show directories
          var entry = sortedArr[i];
          //var blockLetter = uiBlock[i%4];
          //fm.info(entry.name);
          try {
            if( entry.isDirectory ) {
	            tbody.append('<tr><td><input type="checkbox"/></td>' +
              '<td><a class="folder" href="#"><img src="img/folder.png"/> ' +
              entry.name + '</div></td>'+ '<td>' +  '</td><td>' + 
                    '</td></tr>');
        	  } else if( entry.isFile ) {
	           entry.file(function(file){
	            tbody.append('<tr>' + checkit +
              '<td><a href="#" class="file" ><img src="img/file.png"/> ' + 
              file.name + '</div></td>'+ '<td style="text-align:right;">' + file.size + '</td><td style="padding-left:20px;">' + 
              fm.formatTime(file.lastModifiedDate) + '</td></tr>');
	        }, function(error){
		        alert(error);
	        });
            }
          } catch(e) { alert(e);}
        }
    var interval2 = setInterval(function() {
      $.mobile.loadingMessage = "directory listing ...";
        $.mobile.loading('hide'); // hide loading message
      clearInterval(interval2);
    },1);
    }, function(error){
            fm.warn(" error " + error);
        CifJs.log('listDir readEntries error: '+error.code);
    });
}

FileManager.prototype.formatTime= function(utc) {
  var date = new Date(utc);
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var time = date.toLocaleTimeString();
  if (time) time= time.substring(0,8);
  return year + "-" +month + "-" + day + "-" + time;
}



/* show the content of a directory */
FileManager.prototype.listDir2 = function(directoryEntry) {
 var fm = this;
    if( !directoryEntry.isDirectory ) CifJs.log('listDir incorrect type');
    $.mobile.loading('show'); // show loading message
  
     
    // currentDir = directoryEntry; // set current directory
    directoryEntry.getParent(function(par){ // success get parent
        var parentDir = par; // set parent directory
        if( (parentDir.name == 'sdcard' && currentDir.name != 'sdcard') ||
             parentDir.name != 'sdcard' )  $('#backBtn').show();
        fm.parentDir = parentDir;
    }, function(error){ // error get parent
        CifJs.log('Get parent error: '+error.code);
    });
    this.currentDir = directoryEntry; // now it is.
  
    var directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(function(entries){
        var dirContent = $('#dirContent');
        dirContent.empty();
         
        var dirArr = new Array();
        var fileArr = new Array();
        for(var i=0; i<entries.length; ++i){ // sort entries
            var entry = entries[i];
            if( entry.isDirectory && entry.name[0] != '.' ) dirArr.push(entry);
            else if( entry.isFile && entry.name[0] != '.' ) fileArr.push(entry);
        }
         
        var sortedArr = dirArr.concat(fileArr); // sorted entries
        var uiBlock = ['a','b','c','d'];
         
        for(var i=0; i<sortedArr.length; ++i){ // show directories
            var entry = sortedArr[i];
            var blockLetter = uiBlock[i%4];
//fm.warn("file "+entry.name);
            CifJs.log(entry.name);
            if( entry.isDirectory )
                dirContent.append('<div class="ui-block-'+blockLetter+'"><div class="folder"><p>'+entry.name+'</p></div></div>');
            else if( entry.isFile )
                dirContent.append('<div class="ui-block-'+blockLetter+'"><div class="file"><p>'+entry.name+'</p></div></div>');
        }
        $.mobile.loading('hide'); // hide loading message
    }, function(error){
            fm.warn(" error " + error);
        CifJs.log('listDir readEntries error: '+error.code);
    });
}


/* read from file */
FileManager.prototype.readFile = function(fileEntry) {
	if( !fileEntry.isFile ) console.log('readFile incorrect type');

	  $.mobile.loading('show'); // show loading message
	fileEntry.file(function(file){
		var reader = new FileReader();
		reader.onloadend = function(evt) {
            console.log("Read as data URL");
//            console.log(evt.target.result); // show data from file into console
    };
    reader.readAsDataURL(file);
        
       
          $.mobile.loading('hide'); // show loading message
        // dialog with file details
        $('#file_details').html('<p><strong>Name:</strong> '+file.name+
        						'</p><p><strong>Type:</strong> '+file.type+
        						'</p><p><strong>Last Modified:</strong> '+new Date(file.lastModifiedDate)+
        						'</p><p><strong>Size:</strong> '+file.size);
        $('#get_file_details').trigger('click');
	}, function(error){
		console.log(evt.target.error.code);
	});
}

/* open item */
FileManager.prototype.openItem = function(type) {
	if( type == 'd' ){
		this.listDir(this.activeItem);
	} else if(type == 'f'){
    this.getSelectedFiles();
		//this.readFile(this.activeItem);
	} else {
    alert("wtf? '" + type +"'");
  }
}

/* get active item  */
FileManager.prototype.getActiveItem = function(name, type) {
  var fm = this;
	if( type == 'd' && this.currentDir != null ){
		this.currentDir.getDirectory(name, {create:false},
			function(dir){ // success find directory
				fm.activeItem = dir;
				fm.activeItemType = type;
        fm.openItem(type);
			}, 
			function(error){ // error find directory
				fm.warn('Unable to find directory: '+error.code);
			}
		);
	} else if(type == 'f' && this.currentDir != null){
		this.currentDir.getFile(name, {create:false},
			function(file){ // success find file
				fm.activeItem = file;
				fm.activeItemType = type;
        fm.selectedFiles.push(file);
        fm.openItem(type);
			},
			function(error){ // error find file
				fm.warn('Unable to find file: '+error.code);
			}
		);
	} else {
    alert("unexpected situation " + type + " : " + this.currentDir + " : " + name);
  }
}

/* get clipboard item for copy or move */
FileManager.prototype.getClipboardItem = function(action) {
	if( this.activeItem != null) {
		this.clipboardItem = this.activeItem;
		this.clipboardAction = this.action;
	}
}

FileManager.prototype.clickItemAction = function() {
    var backBtn = $('#backBtn');
    var homeBtn = $('#homeBtn');
    var fm = this;
    backBtn.click(function(){ // go one level up
        if( fm.parentDir != null ) fm.listDir(fm.parentDir);
    });
     
    homeBtn.click(function(){ // go to root
        if( fm._root != null ) fm.listDir(fm._root);
    });
	$(document).on('click','.folder', function(){
		var name = $(this).text().trim();
		fm.getActiveItem(name, 'd',fm);
	});
	
	$(document).on('click','.file', function(){
		var name = $(this).text().trim();
		fm.getActiveItem(name, 'f');
	});
	
};
/*
 */

/* click actions */
FileManager.prototype.clickItemAction2 = function() {
  var fm = this;
	var backBtn = $('#backBtn');
	var homeBtn = $('#homeBtn');
	/* menu buttons */
	var menuDialog = $('#menuOptions');
	var openBtn = $('#openBtn');
	var copyBtn = $('#copyBtn');
	var moveBtn = $('#moveBtn');
	var pasteBtn = $('#pasteBtn');
	var deleteBtn = $('#deleteBtn');  
	
	$(document).on('click','.folder', function(){
		var name = $(this).text();
		fm.getActiveItem(name, 'd');
		$('#menu').trigger('click'); // menu dialog box
	});
	
	$(document).on('click','.file', function(){
		var name = $(this).text();
		fm.getActiveItem(name, 'f');
		$('#menu').trigger('click'); // menu dialog box
		// paste button always disabled for files
		pasteBtn.button('disable');
		pasteBtn.button('refresh');
	});
	
	backBtn.click(function(){ // go one level up
		if( fm.parentDir != null ) fm.listDir(fm.parentDir);
	});

// dont do this.
	homeBtn.click(function(){ // go to root
		if( fm._root != null ) fm.listDir(fm._root);
	});
	
	openBtn.click(function(){
		menuDialog.dialog('close');
    fm.openItem(fm.activeItemType);
	});
	
	copyBtn.click(function(){
		fm.getClipboardItem('c');
		menuDialog.dialog('close');
		pasteBtn.button('enable');
		pasteBtn.button('refresh');
	});
	
	moveBtn.click(function(){
		fm.getClipboardItem('m');
		menuDialog.dialog('close');
		pasteBtn.button('enable');
		pasteBtn.button('refresh');
	});
	
	pasteBtn.click(function(){
		if( fm.clipboardItem != null && fm.clipboardAction != null ){
			if(fm.clipboardAction == 'c'){ // copy item
				console.log('copy: '+fm.clipboardItem.name + ' to: '+fm.activeItem.name);
				fm.clipboardItem.copyTo(fm.activeItem,clipboardItem.name,
					function(fileCopy){
						console.log('copy success! '+fileCopy.name);
						openBtn.trigger('click');
					}, function(error){
						console.log('copy error: '+error.code);
					}
				);
			} else if(fm.clipboardAction == 'm'){ // move item
				console.log('move: '+fm.clipboardItem.name + ' to: '+fm.activeItem.name);
				clipboardItem.moveTo(fm.activeItem,fm.clipboardItem.name,
					function(fileCopy){
						console.log('move success! '+fileCopy.name);
						openBtn.trigger('click');
					}, function(error){
						console.log('move error: '+error.code);
					}
				);
			}
		}
	});
	
	deleteBtn.click(function(){
		if( fm.activeItem != null && fm.activeItemType != null){
			if(fm.activeItemType=='d'){
				fm.activeItem.removeRecursively(function(){
					console.log('removed recursively with success');
					menuDialog.dialog('close');
					fm.listDir(fm.currentDir);
				}, function(error){
					console.log('remove recursively error: '+error.code);
				});
			} else if(fm.activeItemType=='f'){
				fm.activeItem.remove(function(){
					console.log('removed recursively with success');
					menuDialog.dialog('close');
					fm.listDir(fm.currentDir);
				}, function(error){
					console.log('remove recursively error: '+error.code);
				});
			}
		}
	});
}
