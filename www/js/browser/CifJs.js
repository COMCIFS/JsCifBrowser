
if (fileSupport) {

var CifJs =  {
  _cif : null,
  _cifjs : null,
  _dictjs : null,
  _dictName : null,
  _cifName : null,
  _dict : null,
  _context : null,
  _dict_file_names : { },
  _required_dict_filename : null,  
  _cifViewGenerator : null,     // externally override this 
  _dicViewGenerator : null,  

  _meta_dict : null, // new MetaDict(this),
  _validationHandler : null,

  wrapJSONDict : function(filename, jsdict) {
    this._meta_dict.wrapJSONDict(filename,jsdict);
  },

  wrapJSONCIF : function(jsoncif) {
    this._cifjs = jsoncif;
    if (this._meta_dict) {
      this._cif = new CifCtrlr(jsoncif, this._meta_dict, this); // attach logger
    } else {
      this._cif = null;
    }
  },
  resetDict : function() {
    this._meta_dict.reset();
  },
  loadingDictQ : function(dict_filename) {
    if ( dict_filename in this._dict_file_names) return true;
    return false;
  },

  debug : function(result) {
    return;
    var stat = document.getElementById('status'); 
    var pre = document.createElement("pre");
    pre.appendChild(document.createTextNode(result));
    stat.appendChild(pre);
  },
  log : function(result) {
    var stat = document.getElementById('status'); 
    var pre = document.createElement("pre");
    pre.appendChild(document.createTextNode(result));
    stat.appendChild(pre);
  },
  info : function(result) {
    var stat = document.getElementById('status'); 
    var pre = document.createElement("pre");
    pre.appendChild(document.createTextNode(result));
    stat.appendChild(pre);
  },
  warn : function(result) {
    var stat = document.getElementById('status'); 
    var pre = document.createElement("pre");
    pre.setAttribute('style','color: orange;');
    pre.appendChild(document.createTextNode(result));
    stat.appendChild(pre);
  },
  error : function(result) {
    var stat = document.getElementById('status'); 
    var pre = document.createElement("pre");
    pre.setAttribute('style','color: red;');
    pre.appendChild(document.createTextNode(result));
    stat.appendChild(pre);
  },
  fatal : function(result) {
    var stat = document.getElementById('status'); 
    var pre = document.createElement("pre");
    pre.setAttribute('style','color: purple;');
    pre.appendChild(document.createTextNode(result));
    stat.appendChild(pre);
  },
  switchPanel : function(panel) {
    // override where TABs needed
  },


  parseSTAR : function(cif, filename) {
    try { 
      this._cifName = filename;
      // this._cif = cif;
      if (true) {
        this._parser = new StarParser(); // hand built 
      } else { 
        // original
        this._parser = star;  // jison built + regex lexer
        this._parser.yy.observer = new STAR_observer();
      }

      this._handler = new STAR_handler();
      this._parser.yy.observer.addHandler(this._handler);
      //this._parser.parse.apply(this._parser, cif);
      this._parser.parse(cif);
    
      this._cifjs = this._handler.releaseData();
      return this._cifjs; // return CIF mapping to JSON
    } catch (e) {
      this.log(e);
    }
  },

  saveAsCIF : function() {
    var content = this._cif.exportCIF(this._cif);
    content = content.join('');  // concatenate list 
    //var uriContent = "data:application/octet-stream;charset=utf-8," + encodeURIComponent(content);
    //var uriContent = "data:chemical/x-cif;filename='test.cif';charset=utf-8," + encodeURIComponent(content);
    var uriContent = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    var newWindow = window.open(uriContent, "savedCIF"); 
    newWindow.focus();
  },

  CIF2html : function() {
    var html;
    if (this._cif) {
      // pass ref to object creator
      this._cif.generateContexts(Context, this._validationHandler); 
      var convertor = new this._cifViewGenerator(document, this._cifName,'cif:');
      convertor._logger = this;
      html = convertor.renderModel(this._meta_dict, this._cif); 
    } else {
      var convertor = new JSON_CIF2HTML(document, this._cifName,'cif:');
      html = convertor.convertJSON(this._cifjs); 
    }
    return html;
  },

  postCIFLoadProcessing: function(json, theFileName){
    this.wrapJSONCIF(json);
    if (this._validationHandler) {
            this._validationHandler.reset();
    } 
    this._validationHandler = new ValidationHandler(document, 
             this._meta_dict, this, theFileName, 'cif:');
  
    var html = this.CIF2html();
    var cif_elem = document.getElementById('cif');
    if (cif_elem.hasChildNodes() ) {
      while ( cif_elem.childNodes.length >= 1 ) {
        cif_elem.removeChild( cif_elem.firstChild );       
      } 
    }
    CifJs.purgeNodeIDsLike(/^cif:/);
    cif_elem.appendChild(html);
    
    var blks = this._cif.getBlockIds();
    var chooseblock = document.getElementById('chooseblock'); 
    if (chooseblock) {
      // only for the interpreter mode 
      while ( chooseblock.childNodes.length >= 1 ) {
        chooseblock.removeChild( chooseblock.firstChild );       
      } 
      for (var i = 0; i < blks.length; i++) { 
        var opt = document.createElement('option');
        opt.setAttribute('value',blks[i]);
        opt.appendChild(document.createTextNode(blks[i]));
        chooseblock.appendChild(opt);
      }
    }
    /*
    // aysnchronously update ??? Nope. not really.
    document.body.style.cursor = 'wait';
    setTimeout(function(){
        CifJs.resolveMissingItems();
        document.body.style.cursor = 'default';
      },100);
    */
    this.switchPanel('cif');
    document.body.style.cursor = 'default';
  },

  resolveMissingItems : function() {
    if (this._cif) {
      document.body.style.cursor = 'wait';
      setTimeout(function(){
        CifJs._cif.resolveMissingItems();
        document.body.style.cursor = 'default';
        CifJs.switchPanel('cif');
      },100);
    }
  },

  validateAllBlocks : function() {
    if (this._cif) {
      document.body.style.cursor = 'wait';
      setTimeout(function(){
        CifJs._cif.validateAllBlocks();
        document.body.style.cursor = 'default';
        CifJs.switchPanel('valid');
      },100);
    }
  },

  suspend : function() {
     /* need to rewrite methods as asynchronous in order
        to call setTimeout() in order for window control to 
        revert back to the browser temporarily ;-/ 
        Not even sure if it is possible ...
     */
     alert("suspend don't work");
  },
  resume : function() {
     alert("resume don't work");
  },
  abort : function() {
     alert("abort don't work");
  },
  eval : function(arg) {
    var command;
    var blockid;
    if (! arg) { 
      command = document.getElementById('textcommand').value.toLowerCase();
      var chooseblock = document.getElementById('chooseblock'); 
      blockid = chooseblock.options[chooseblock.selectedIndex].value;
    } else {
      command = arg.toLowerCase();
    }
    // invoke it asynchronously so the browser updates
    document.body.style.cursor = 'wait';
    setTimeout(function(){
        CifJs._cif.cmd(command, blockid);
        document.body.style.cursor = 'default';
      },100);
  },

  verifyTextCommand : function() {
     var text = document.getElementById('textcommand').value;
     text = text.toLowerCase();
    //   alert("verify " + text);

  },

  JSdict2HTML : function(json, filename) {
    this._dictName = filename;
    //var convertor = new JSON_CIF2HTML(document, this._dictName,'dic:');
    //var convertor = new JS_DIC2HTML(document, this._dictName,'dic:');
    this._dicViewGenerator = new HierarchyView(document, this._dictName,'dic:');
  
    _dicViewGenerator._logger = this;
    var html = this._dicViewGenerator.renderModel(this._meta_dict.ddl, json); 
    return html;
  },

  
  readFileAsText : function(file, callback, loaded , loadendcallback) {
 
    var reader = new FileReader();
    
    // set error handler
    reader.onerror = function(stuff) {
      CifJs.log("error" + stuff);
      try {
        CifJs.log(stuff.getMessage());
      } catch (e) {
        CifJs.log("no message");
      }
      loaded[file.name] = -1;
    };

    // Closure to capture the loaded text from the file
    reader.onload = (function(theFile) {
      return function(e) {
        // run callback to process the dictionary data
        callback(theFile,e.target.result);
      };
    })(file);

    // this closure is called on completion, regardless of success or error
    reader.onloadend = (function(theFile) {
      return function(e) {
        loaded[theFile.name] = 1;
        // run callback to process the dictionary data
        // we should check for an error flag, but anyway.
        loadendcallback(loaded);
      };
    })(file);

    // Read in the image file as a data URL.
    var res = reader.readAsText(file);
    return loaded;
  },

  userLoadsDict: function(dict_filename) {
    this._required_dict_filename = dict_filename; // record so we can check for it
    var span = document.getElementById('dictname');
    while ( span.childNodes.length >= 1 ) {
      span.removeChild( span.firstChild );       
    } 
    span.appendChild(document.createTextNode(dict_filename));
    var div = document.getElementById('dictload');
    div.style.visibility = 'visible';
    document.getElementById('newdict').addEventListener('change', this.handleExtraDictSelect, false);
  },

  handleExtraDictSelect: function(evt) {
    // this function is passed in as a callback, with no knowledge of "this"
    // consequently we need to use the global CifJs reference
    var files = evt.target.files; // FileList object
    var file_match = 0;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      CifJs._dict_file_names[file.name] = 1;  // add all to pending
      if (file.name == CifJs._required_dict_filename) {
        file_match += 1;
      }
    }
    if (! file_match) {
      // requested dictionary wasn't provided 
      alert("Missing a required dictionary " + CifJs._required_dict_filename);
      return;
    }
    var div = document.getElementById('dictload');
    div.style.visibility = 'hidden';
    var dict_elem = document.getElementById('dict');

    // define a callback to check then proceed when all dictionaries loaded
    var onloadendCallback = function( hash ) {
      var cnt = 0;
      for (var i = 0; i < files.length; i++) {
        var dictFile = files[i];  
        if (dictFile.name in hash) cnt += 1;
      }
      if (cnt < files.length) return; 
      // do this after files "loaded and handled" completion
      // just look for what is still "required". No "reparsing" necessary.
      CifJs._meta_dict.resolveRequiredImports();
        document.body.style.cursor = 'default';
    };
  
    var finished = {};
    for (var i = 0; i < files.length; i++) {
      var dictFile = files[i];  
      var complete = false;
      if (i+1 == files.length) complete = true;
  
      // define a callback func that runs asynchronously for each loaded dict
      var callback = function(theFile, theContent ) {
        if (theFile.type == 'application/javascript' ||
            theFile.type == 'application/x-javascript' ||
            /\.js$/.test(theFile.name) ) {
          // load preparsed JSON dict
          var span = document.createElement('script');
          span.innerHTML = [ theContent, "\n", 
              "CifJs.wrapJSONDict('" , theFile.name ,"',new cif_dict()._dict);" ].join('');
          // appending to head does an evaluate - at least in firefox
          document.getElementsByTagName('head')[0].appendChild(span);
        } else {
          // load raw CIF dictionary
          // alert("file of type" + theFile.type);
          CifJs.log("Parsing dictionary file " + theFile.name);
  //        CifJs.log(theContent);
          var json = CifJs.parseSTAR(theContent, theFile.name); 
          CifJs.wrapJSONDict(theFile.name, json);
        }
        // collect imports
        CifJs._meta_dict.buildFileImportList(theFile.name); 
  
        if (CifJs._meta_dict._ddl_version == 'DDL_star') {
        // This is a kludge. Why load atom_type for, say, flora.dic?
        // It should be loaded in by the dictionary itself. Somehow...
          var dict = CifJs._meta_dict.getDict(theFile.name);
          for( var catid in DefaultData) { // already loaded as .js
            dict.registerDefaults(catid, DefaultData[catid]);
          }
        }
  
        if (dict_elem) {
          var html = CifJs._meta_dict.getHTML4dict(document, theFile.name); 
          // replace original nodes with new html dict.
          dict_elem.appendChild(html);
        }
  
      }; // end of callback func defn
      CifJs.readFileAsText(dictFile, callback, finished, onloadendCallback); 
    } // end loop over files

  },

  
  renderDicNode: function(id) {
    // get dictionary defn.id from id
    var i = id.indexOf('%3A');
    var j = id.indexOf('%3A',i+1);
    var filename = id.substring(i+3,j);
    var defnid = unescape(id.substring(j+3));
    i = defnid.indexOf('.');
    // get defn
    var defn;
    var block;
    if (i>0) {
      defn = this._meta_dict.getItemDefn(defnid);
      block = this._meta_dict.getDictForItem(defnid);
    } else {
      block = this._meta_dict.getDict(filename);
      defn = block.getCategory(defnid);
      //block = this._meta_dict.getDictForCategory(defnid);
    }
    // get parent defn
    // get parent html node
    var elem = document.getElementById(id);
    if (elem && defn) {  
      // find child slot
      var slot = elem.nextSibling;
      var prefix =  decodeURIComponent(id.substring(0,j+3));
      // render child
      // append child to parent.
      this._dicViewGenerator._paceLevel(block, defn, slot, prefix);
    
    }  
  },
    
  /*
   * For navigating a hierarchical presentation layer
   */
  displayStates : {},

  setDisplayNodeID : function (id) {
    var ctrlr = CifJs
    if (id in ctrlr.displayStates) {  // switch
      ctrlr.displayStates[id] = ctrlr.displayStates[id] ? 0 : 1;
    }         
    else  {
      ctrlr.displayStates[id] = 1; // assume initialized to 0
      // previously unrendered dictionary node
      if (id.substring(0,6) === 'dic%3A') {
        ctrlr.renderDicNode(id);    
      } 
    }
    return ctrlr.displayStates[id];
  },

  displayStateFlip : function (id) {
    var val = this.setDisplayNodeID(id);
    var elem = document.getElementById(id);
    if (elem ) {  
      elem.nextSibling.style.display = (val ? "block" : "none") ;
      var text = document.createTextNode( val ? "[\u2011]\240" : "[+]\240") ;
      elem.firstChild.replaceChild(text,elem.firstChild.firstChild);
    }
    return false;
  },

  displayAllLike : function (prefix, group) {
    var blkid = prefix + group;
    var blockhead = document.getElementById(blkid);
//    alert (blkid + " : " + blockhead);
    if (blockhead) {
      CifJs.displayStateFlip(blkid);
      var state = blockhead.nextSibling.style.display;
      var text = document.createTextNode( state=='block' ? "[--]" : "[++]") ;
      var marker = blockhead.childNodes[4];
      marker.replaceChild(text,marker.firstChild);
      var nodewalk = function(node, state) {
        //if (typeof str != 'array') str = [];
        for (var i = 0; i < node.length; i++) {
          var elem = node[i];
          if (elem.nodeName === 'DT') {
            var id = elem.id;
            if (id && id.lastIndexOf(blkid, 0) === 0) {
              if (elem.nextSibling.style.display != state) {  
                CifJs.displayStateFlip(id);
              }
            } 
          }
          if (elem.hasChildNodes() && 'SCRIPT' !== elem.nodeName) {
            nodewalk(elem.childNodes, state);
          }
        }
      };
      nodewalk(blockhead.nextSibling.childNodes, state);  
    }
  },

  openPath : function (func, prefix, init) {
    // called from valid to expose cif and 
    // from cif to expose dict
    var pre = prefix;
    if (init == null) init = 0;
    var path = func();
    //for (var i = init; i <path.length; i++) {
    for (var i = path.length-1; i >=0; i--) {
        var node = path[i];
        var id = this._esc(pre +node);
        if (pre.substr(0,3)=="cif") {
          // build hierarchy, because no guarantee of import cat_name uniqueness
          pre = pre + node + ":";
        }
        if (id in this.displayStates) {
          if (this.displayStates[id] == 0) {
            this.displayStateFlip(id);
          }
        } else {
            this.displayStateFlip(id);
        }
    }
    return this.scrollToId(prefix, path[0]);
  },
  _esc : function (strn) {
     return escape(strn);
  },

  scrollToId : function (prefix, datumid) {
    if (prefix.substring(0,4) === 'dic:') {
        CifJs.switchPanel('dict');
        var id = this._esc(prefix +datumid);
        var elem = document.getElementById(this._esc(prefix +datumid));
        if (elem) {
          setTimeout(function() {document.getElementById(id).scrollIntoView();},1000);
        }
       //  elem.scrollIntoView(true);
    } else if (prefix.substring(0, 4) === 'cif:') {
        CifJs.switchPanel('cif');
        var id =this._esc(prefix +datumid);
        var elem = document.getElementById(id); // cat not elem
        if (elem) {
          setTimeout(function() {document.getElementById(id).scrollIntoView();},1000);
        }
        //var div = document.getElementById('cif');
        //div.scrollTop = elem.offsetTop;
        //div.scrollIntoView();
        //elem.scrollIntoView();
        // document.getElementsByTagName('body')[0].scrollTop = div.offsetTop;
    }
      //document.getElementById(prefix +path[0]).scrollIntoView();
    return false;
  },

  openCifPath : function(prefix, block_name, item_name) {
    //var path = CifJs._meta_dict.getItemPath(item_name); 
    // might have worked just as well ...
    var path = CifJs._cif.getItemPath(block_name, item_name); 
    path.pop();
    path.push("");
    var cif_prefix = prefix + this._cifName + ":" + block_name ;
    path.shift(); // remove the actual _cif_element.id from the path
 //alert(path);
    // non-standard JS behaviour!!!!
    if (CifJs._cifViewGenerator.name == "HierarchyView") { 
      return this.openPath(function() {return path;}, cif_prefix, 1); 
    } 
    return this.scrollToId(cif_prefix, path[0]);
  },

  purgeNodeIDsLike : function (re) {
    //var re = new RegExp();
    for (var id in this.displayStates) {
      if (re.test(id)) {
         delete this.displayStates[id];
      }
    }
  }
  
};



function handleDictSelect(evt) {
  if (! fileSupport) {
    alert("Sorry, your browser doesn't have required FileReader capabilities.");
    return;
  }

  document.body.style.cursor = 'wait';
  // erase previous HTML-ised dictionaries
  var dict_elem = document.getElementById('dict');
  if (dict_elem && dict_elem.hasChildNodes() ) {
    while ( dict_elem.childNodes.length >= 1 ) {
      dict_elem.removeChild( dict_elem.firstChild );       
    } 
  }

  var files = evt.target.files; // FileList object
  CifJs._meta_dict = new MetaDict(CifJs);
  CifJs.resetDict();
  for (var i = 0; i < files.length; i++) {
    var dictFile = files[i];  
    CifJs._dict_file_names[dictFile.name] = 1;  // add all to pending
  }
  CifJs.purgeNodeIDsLike(/^dic:/);

  // define a callback to check then proceed when all dictionaries loaded
  var onloadendCallback = function( hash ) {
    var cnt = 0;
    for (var i = 0; i < files.length; i++) {
      var dictFile = files[i];  
      if (dictFile.name in hash) cnt += 1;
    }
    if (cnt < files.length) return; 
    // do this on files loaded and handled completion
    CifJs._meta_dict.resolveRequiredImports();
    document.body.style.cursor = 'default';
  };

  var finished = {};
  for (var i = 0; i < files.length; i++) {
    var dictFile = files[i];  
    var complete = false;
    if (i+1 == files.length) complete = true;

    // define a callback func that runs asynchronously for each loaded dict
    var callback = function(theFile, theContent ) {
      if (theFile.type == 'application/javascript' ||
        theFile.type == 'application/x-javascript' ||
            /\.js$/.test(theFile.name) ) {
        // load preparsed JSON dict
        var span = document.createElement('script');
        span.innerHTML = [ theContent, "\n", 
            "CifJs.wrapJSONDict('" , theFile.name ,"',new cif_dict()._dict);" ].join('');
        // appending to head does an evaluate - at least in firefox
        document.getElementsByTagName('head')[0].appendChild(span);
      } else {
        // load raw CIF dictionary
        // alert("file of type" + theFile.type);
        CifJs.log("Parsing dictionary file " + theFile.name);
        var json = CifJs.parseSTAR(theContent, theFile.name); 
        CifJs.wrapJSONDict(theFile.name, json);
      }
      // collect imports
      CifJs._meta_dict.buildFileImportList(theFile.name); 

      if (dict_elem) {
        var html = CifJs._meta_dict.getHTML4dict(document, theFile.name); 
        // replace original nodes with new html dict.
        dict_elem.appendChild(html);
      }

      return 1;
    }; // end of callback func defn
    CifJs.readFileAsText(dictFile, callback, finished, onloadendCallback); 
  } // end loop over files

}

function handleCifSelect(evt) {
    var files = evt.target.files; // FileList object
     // Loop through the FileList

    for (var i = 0, f; f = files[i]; i++) {
      //alert(f + " " + f.type);
      // Only process image files.

  if (fileSupport) {
      document.body.style.cursor = 'wait';
      var reader = new FileReader();
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          var json = CifJs.parseSTAR(e.target.result, theFile.name); 
          CifJs.postCIFLoadProcessing(json, theFile.name);
        };
      })(f);
      // Read in the image file as a data URL.
      reader.readAsText(f);
    }
  }
}

function load_downloadify() {
  Downloadify.create('downloadify', {
    filename: function(){
      return "out.cif";
      //return document.getElementById('filename').value;
    },
    data: function(){ 
      var content = CifJs._cif.exportCIF(CifJs._cif);
      return content = content.join('');  // concatenate list 
    },
    onComplete: function(){ alert('Your File Has Been Saved!'); },
    onCancel: function(){ alert('You have cancelled the saving of this file.'); },
    onError: function(){ alert('Something went wrong!'); },
    swf: 'Downloadify/media/downloadify.swf',
    downloadImage: 'Downloadify/images/download.png',
    width: 100,
    height: 30,
    transparent: true,
    append: false
  });
}

} // end of fileSupport == true;


