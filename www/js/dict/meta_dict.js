/*
 * @file Provides {MetaDict} - a wrapper around multiple dictionaries
 * loaded via a nested import mechanism introduced in DDLm.
 */

if (typeof require !== 'undefined') {
 // for node.js
 var DictWrapper = require("./dict_wrapper.js").DictWrapper;
 var ddlm_dic = require("../ddl/ddlm_dic.js").ddlm_dic;
 var dREL_handler = require("../drel/drel_handler.js").dREL_handler;
 var drel = require("../drel/drel.js").parser; // the default name from jison

}

/**
 * Define a Meta Dictionary - a wrapper around potentially multiple
 * DDLm sub dictionaries, defined to implement the BaseDictWrapper interface.
 * @constructor
 * @param environment {CifJs} 
 */
function MetaDict(environment) {
  this._logger = environment;
  this._enviro = environment;
  this._dict = { };  // these are loaded
  this._required = { };  // these dicts are needed but not loaded
  // check this._enviro.loadingDictQ for pending ...
  this._ddl_version ;
  this._import_hier = { };
  this._dict_parents = { };
  this._dictCheckOrder = [];
  this._ddl_map = { };
  this._sub_cats = { };
  this.ddl = null;
}

MetaDict.prototype.log = function(data) {
  if (this._logger) this._logger.info(data);
};
MetaDict.prototype.debug = function(data) {
  if (this._logger) this._logger.debug(data);
};
MetaDict.prototype.info = function(data) {
  if (this._logger) this._logger.info(data);
};
MetaDict.prototype.warn = function(data) {
  if (this._logger) this._logger.warn(data);
};
MetaDict.prototype.error = function(data) {
  if (this._logger) this._logger.error(data);
};
MetaDict.prototype.fatal = function(data) {
  if (this._logger) this._logger.fatal(data);
};

/**
 * Reset this dictionary of dictionaries to permit loading
 * of a new suite of dictionaries.
 * @memberof MetaDict.prototype
 * @return void
 */
MetaDict.prototype.reset = function() {
  for (var file in this._dict) {
     delete this._dict[file];
  }
  this._ddl_version = null;
  this._required = { };
  this._import_hier = { };
  this._dict_parents = { };
  this._dictCheckOrder = [];
  this._ddl_map = { };
  this._sub_cats = { };
};

/**
 * Create a {DictWrapper} instance around the supplied JSON representation
 * of a parsed STAR format dictionary.
 * @memberof MetaDict.prototype
 * @param filename {String} The file name of the dictionary being loaded.
 * @param json {Array[]} JSON representation of the original STAR dictionary.
 * @return {MetaDict}
 */
MetaDict.prototype.wrapJSONDict = function(filename, json) {
  var wrapped =  new DictWrapper(json, this); // build hierarchy
  if (! this._ddl_version) {
    this._ddl_version = wrapped._ddl_version; //
    for (var key in wrapped._ddl_map) {
      this[key] = wrapped._ddl_map[key];
      this._ddl_map[key] = wrapped._ddl_map[key];
    }
    this._sub_cats = wrapped._sub_cats; // this is a very bad hack!
    if (wrapped._ddl_version == 'DDLm') {
      this.ddl = new DictWrapper( new ddlm_dic()._dict, this);    
//      alert("Loaded DDLm (as JSON)" );
    }
  }
  else if ( this._ddl_version != wrapped._ddl_version) {
     alert("Mismatched DDL versions of " + this._ddl_version + " and " + 
         wrapped._ddl_version + " for dict " + filename);
  }
  this._dict[filename] = wrapped; 
  this._dictCheckOrder.push(filename); 
  if (filename in this._required) {
    delete this._required[filename];
    // if it was required to be loaded, it no longer is.
  }
  return this;
};

/**
 * Retrieve the {DictWrapper} instance corresponding to the 
 * supplied filename.
 * @memberof MetaDict.prototype
 * @param filename {String}
 * @return {DictWrapper}
 */
MetaDict.prototype.getDict = function(filename) {
  return this._dict[filename];
};

/**
 * Obtain a HTML rendering of all supplied dictionaries.
 * @memberof MetaDict.prototype
 * @param docroot {Document} Root node of the document.
 * @return {Element} A DOM node.
 */
MetaDict.prototype.getHTML = function(docroot) {
  var HTML = docroot.createDocumentFragment();
  for (var filename in this._dict) {
    var html = this.getHTML4dict(docroot, filename); 
    HTML.appendChild(html);
  }
  return HTML;
};

/**
 * TBD. maybe move this back to CifJs ...
 * Generate a {HierarchyView} for a {DictWrapper} instance.
 * @memberof MetaDict.prototype
 * @param docroot {Document} DOM generator 
 * @param filename {String}  select the required dictionary by filename. 
 * @return {Element}
 */
MetaDict.prototype.getHTML4dict = function(docroot, filename) {
  //var convertor = new JS_DIC2HTML(docroot, filename,'dic:');
  var convertor = new HierarchyView(docroot, filename,'dic:');
  this._enviro._dicViewGenerator = convertor;  
  convertor._logger = this._logger;
  var html = convertor.renderModel(this.ddl, this._dict[filename]); 
  return html;
};

/**
 * Use a hash to create a list of unique file import requests.
 * @memberof MetaDict.prototype
 * @param imprt {Array[]} 
 * @return {Function} 
 */
MetaDict.prototype._getImportFileList = function(imprt) {
  //  imprt is a list of ref hashes
  var files = {};
  for (var i = 0; i < imprt.length; i++) {
    var ref = imprt[i];
    var file_name = ref['file'];
    files[file_name] = 1;
  }
  return files; // return unique list as a hash
};

/**
 * Build a hashtable of file imports for a dictionary
 * @memberof MetaDict.prototype
 * @param dict_file_name {String}
 * @return {Function}
 */
MetaDict.prototype._getFileImportNames4Dict = function(dict_file_name) {
  this.info("check  " + dict_file_name + " for import tag:  " + this._defn_import  );    
  var dict = this._dict[dict_file_name];
//  var import_items = { };
//  var import_cats = { };
  var files = {}; 
  for (var cat_name in dict._categories ) {
    var cat = dict._categories[cat_name];
    var imprt = cat.getAttribute(this._defn_import);
    if (imprt) {
      var file_hash = this._getImportFileList(imprt);
      for (var f in file_hash) {
        files[f] = file_hash[f];
      }
    }
  }
  for (var item_name in dict._items ) {
    var item = dict._items[item_name];
    var imprt = item.getAttribute(this._defn_import);
    if (imprt) {
      var file_hash = this._getImportFileList(imprt);
      for (var f in file_hash) {
        files[f] = file_hash[f];
      }
    }
  }
  return files;
};

/**
 * Build a hashtable  (this._required) of file imports for a dictionary
 * @memberof MetaDict.prototype
 * @param dict_file_name {String}
 * @return  {void}
 */
MetaDict.prototype.buildFileImportList = function(dict_file_name) {
  if (this._ddl_version != 'DDLm') return;

  var import_files = this._getFileImportNames4Dict(dict_file_name);
  this._import_hier[dict_file_name] = import_files; // record to build dict hier

  var extra = [];
  for (var filename in import_files) {
    if (filename in this._dict ) continue;
    if (this._enviro.loadingDictQ(filename)) continue; // in pending
    this._required[filename] = import_files[filename];  // record needed    
    extra.push(filename);
  }
  if (extra.length) {
    this.warn(dict_file_name + " needs added imports of" + extra );
  }
};

/**
 * Called from Environment {CifJs} during dictionary load and process.
 * @memberof MetaDict.prototype
 * @return {void}
 */
MetaDict.prototype.resolveRequiredImports = function() {
  // remember, this is invoked thru an asynchronous file load (ala AJAX)
  var origList = {};
  var dlist = [];
  for (var filename in this._required) {
    origList[filename] = 1;
    dlist.push(filename);
  }
  for (var filename in origList) {  // if required and not in pending
    if ((filename in this._required)  &&
         ! this._enviro.loadingDictQ(filename)) {
      this._enviro.userLoadsDict(filename);  // then request a load.
      break; // only load one. 
      // that in turn will come back to load another, if needed
    }
  }

  // this will be true after the final dictionary file dependency was loaded
  if (dlist.length == 0) {
    if (this._ddl_version == 'DDLm') { 
      this._ultimateImportResolution();
      this._buildDictHierarchy();  // reverse lookup for dict imports
      this._getDictCheckOrder();
    }
    // alert user we are ready to go
    alert("Dictionaries all loaded and resolved!");
  }
};

/**
 * Resolve imports after files are loaded.
 * @memberof MetaDict.prototype
 * @return {void}
 */
MetaDict.prototype._ultimateImportResolution = function() {
  try {
  for (var src_dict_file_name in this._dict) {
            this.info("Post loading resolving imports for " +
                 src_dict_file_name );
    var dict = this._dict[src_dict_file_name];
    var saves = [dict._items, dict._categories];//anything useful
    for (var j = 0; j<2; j++) { 
      var grp = saves[j];
      for (var saved in grp ) {
        var src_save = grp[saved];
        if (src_save instanceof Array) continue; // schitzophrenic aliases :-/
        var imprt = src_save.getAttribute(this._defn_import);
        if (! imprt) continue;
        // this save frame has an import 
        var imports = [ ];
        for (var i = 0; i < imprt.length; i++) {
          var ref = imprt[i];
          var trg_dict_file_name = ref['file'];
          var save_frame_name = ref['save'];
          var save;
          var trg_dict = this._dict[trg_dict_file_name];
          if (trg_dict) {
            save = trg_dict.getCategory(save_frame_name.toLowerCase());
            if (! save) {
              save = trg_dict.getItemDefn(save_frame_name.toLowerCase());
            }
            if (! save) {
              save = trg_dict._generics[save_frame_name.toLowerCase()];
            }
          }
          if (save) {
            imports.push(save) ; // make cross dict link
          }  
          else {
            this.warn("Missing save frame  " + save_frame_name + 
                " while importing from "  + trg_dict_file_name + " for " +
                src_save._name + " in " + src_dict_file_name );
          }
        }
        if (imports.length < 1) continue;
        if (imports.length >1) {
          src_save._generic = imports;
        } else if (imports.length ==1) {
          src_save._generic = imports[0];
        }
        // ensure cat._itemsByAttributeId is built
        if (j == 0) { // for items 
          var cat = src_save._category
          if (!cat || (typeof cat == 'string') ) {
            this._error("MetaDict - error resolving cat for " + src_save._name);
            continue;
          }
          var catAtId = src_save.getAttribute(dict._cat_attribute_id);
          if (!catAtId) {
            this._error("MetaDict - no category attribute ID " + dict._cat_attribute_id  +
                           " while resolving cat for " + src_save._name);
            continue;
          } 
          cat._itemsByAttributeId[catAtId] = src_save;
          cat._itemsByAttributeId[catAtId.toLowerCase()] = src_save;

          dict._buildItemAliases(dict, dict._alias_tag, src_save, src_save._generic._save, saved); 

        }
      } // end of  items or cats loop
    } // end of items and cats
  } // end of dict
  } catch (e) {
    alert(e);
  } 
};

/**
 * Establish the hierarchy of categories and imports.
 * @memberof MetaDict.prototype
 * @return {void}
 */
MetaDict.prototype._buildDictHierarchy = function() {
  // make a hash of who includes 'that' dictionary
  var copy = {};
  for (var filename in this._import_hier) {
    copy[filename] = []; 
  }
  for (var filename in this._import_hier ) {
    var hash = this._import_hier[filename];
    for (var impfile in hash) {
      copy[impfile].push(filename); 
    }
  }
  this._dict_parents = copy;
};

MetaDict.prototype._getDictCheckOrder = function() {
  // first level
  var roots1 = {}; 
  var roots2 = {}; 
  var used = {};
  this._dictCheckOrder = [];
  for (var filename in this._dict_parents) {
    var parents = this._dict_parents[filename];
    if (!parents || parents.length == 0) {
      this._dictCheckOrder.push(filename);
      used[filename] = 1;
      roots1[filename] = 1;
    }
  }
  // second level
  for (var filename in roots1) {
    var kids = this._import_hier[filename];
    for (var impfile in kids) {
      if (impfile in used) continue;
      this._dictCheckOrder.push(impfile);
      roots2[impfile] = 1;
      used[impfile] = 1;
    }
  }
  // third level
  roots1 = {};
  for (var filename in roots2) {
    var kids = this._import_hier[filename];
    for (var impfile in kids) {
      if (impfile in used) continue;
      this._dictCheckOrder.push(impfile);
      roots1[impfile] = 1;
      used[impfile] = 1;
    }
  }
  // anything else
  for (var filename in this._dict) {
    if (filename in used) continue;
    this._dictCheckOrder.push(filename);
  }
//  alert(this._dictCheckOrder);
};

/**
 * 
 * @memberof MetaDict.prototype
 * @return {void}
 */
MetaDict.prototype.verifyAllImports = function() {
  if (this._ddl_version != 'DDLm') return;
  for (var filename in this._dict) {
    this.buildFileImportList(filename) ;
  }
  
  alert("need to load these too : " + extra);
  for (var i = 0; i < extra.length; i++) {
    this._enviro.userLoadsDict(extra[i]);
  }

};


/**
 * Get an {ItemDefn} from whichever dictionary defined it.
 * @memberof MetaDict.prototype
 * @param name {String} DDLm _definition.id
 * @return {ItemDefn}
 */
MetaDict.prototype.getItemDefn = function(name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var item = this._dict[dict_file]._items[name];
    if (item) return item;
  }
};
MetaDict.prototype.getDictForItem = function(name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var item = this._dict[dict_file]._items[name];
    if (item) return this._dict[dict_file];
  }
};

MetaDict.prototype.getItem = function(name) {
  //deprecate this func
  return this.getItemDefn(name); 
};


/**
 * Get an {ItemDefn} from whichever dictionary defined it.
 * @memberof MetaDict.prototype
 * @param name {String} DDLm _definition.id
 * @return {ItemDefn} or void
 */
MetaDict.prototype.hasItem = function(name) {
  return this.getItemDefn(name);
};

/**
 * Get an {CategoryDefn} from whichever dictionary defined it.
 * @memberof MetaDict.prototype
 * @param name {String} Category name.
 * @return {CategoryDefn}
 */
MetaDict.prototype.getCategory = function(name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var item = this._dict[dict_file]._categories[name];
    if (item) return item;
  }
};

MetaDict.prototype.getDictForCategory = function(name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var item = this._dict[dict_file]._categories[name];
    if (item) return this._dict[dict_file];
  }
};

/**
 * Get an {CategoryDefn} from whichever dictionary defined it.
 * @memberof MetaDict.prototype
 * @param name {String} Category name.
 * @return {CategoryDefn} or undefined
 */
MetaDict.prototype.hasCategory = function(name) {
  return this.getCategory(name);
};

/**
 * get a list of all known category names.
 * @memberof MetaDict.prototype
 * @return {Object} Hashtable
 */
MetaDict.prototype.Categories = function() {
  // loop for all dictionaries
  var cats = {};
  for ( var dict_file in this._dict) { 
    var dict = this._dict[dict_file];
    for (var cat in dict._categories) {
      cats[cat] = 1;
    }
  }
  return cats;
};

/**
* get a list of all known category names.
* @memberof MetaDict.prototype
* @return {Object} Hashtable
*/
MetaDict.prototype.getCategories = function() {
  return this.Categories();
};

/**
 * Retrieve a function definition from the dictionary.
 * @memberof MetaDict.prototype
 * @param name {String}
 * @return {FuncDefn}
 */
MetaDict.prototype.getFunction = function(name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var func = this._dict[dict_file]._functions[name];
    if (func) return func;
  }
};

/**
 * Retrieve a function definition from the dictionary or return undefined.
 * @memberof MetaDict.prototype
 * @param name {String}
 * @return {FuncDefn}
 */
MetaDict.prototype.hasFunction = function(name) {
  return this.getFunction(name);
};

/**
 * 
 * @memberof MetaDict.prototype
 * @return {String}
 */
MetaDict.prototype.getDDLVersion = function() {
	return this._ddl_version;
};

/**
 * Get a hierarchical path from the supplied item_name to 
 * the {MetaDict} root, as it might be generated as HTML node IDs 
 * @memberof MetaDict.prototype
 * @param item_name {string} 
 * @param prefix {String} 
 * @return {Array}
 */
MetaDict.prototype.getItemPath = function(item_name, prefix) {
  // loop for all dictionaries
  for (var i = 0; i< this._dictCheckOrder.length; i++) {
    var dict_file = this._dictCheckOrder[i];
    var dict = this._dict[dict_file];
    var item = dict._items[item_name];
    if (item) {
      var plist = dict.getItemPath(item_name,prefix);  
      var includee = this._dict_parents[dict_file];
      while (includee && includee.length > 0) {
        var catname = plist[plist.length -1]; 
        var pdict = includee[0]; 
        var include_dict = this._dict[pdict];
        var parnt = include_dict._categories[catname]; 
        while (parnt && parnt._category) {
          plist.push(parnt._category._name.toLowerCase());
          parnt = parnt._category;
        }
        if (! parnt) this.warn(item_name + " has no parent " + catname + 
               " in dict " + dict_file);
        includee = this._dict_parents[pdict];
      }
//    this.info(plist);
      plist.push(dict.getName());
      return  plist;
    }
  }
};

/**
 * Build a hierarchical category nesting list to the submitted category name.
 * @memberof MetaDict.prototype
 * @param cat_name {String}
 * @return {Array[]}
 */
MetaDict.prototype.getCategoryHierarchy = function(cat_name) {
  // loop for all dictionaries
  for (var i = 0; i< this._dictCheckOrder.length; i++) {
    var dict_file = this._dictCheckOrder[i];
    var dict = this._dict[dict_file];
    var cat = dict._categories[cat_name];
    if (cat) {
      var plist = dict.getCategoryPath(cat_name);  
      plist.shift(); // rip cat_name off bottom of stack
      var includee = this._dict_parents[dict_file];
//      alert(includee);
      while (includee && includee.length > 0) {
        var catname = plist[plist.length -1]; 
        var pdict = includee[0]; 
        var include_dict = this._dict[pdict];
        var parnt = include_dict._categories[catname]; 
        while ( parnt && parnt._category) {
          plist.push(parnt._category._name.toLowerCase());
          parnt = parnt._category;
        }
        if (! parnt) this.warn(cat_name + " has no parent " + catname);
        includee = this._dict_parents[pdict];
      }
//    this.info(plist);
//      plist.push(dict.getName());
      return  plist;
    }
  }
};

/**
 * @memberof MetaDict.prototype
 * @param item_name {String}
 * @return {String}
 */
MetaDict.prototype.getItemDictPrefix = function(item_name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var dict = this._dict[dict_file];
    var item = dict._items[item_name];
    if (item) {
      return 'dic:' + dict_file + ":";  // hack
      //return 'dic:' + dict_file + dict.getName() ;  // hack
    }
  }
};

/**
 * @memberof MetaDict.prototype
 * @param cat_name
 * @return {Object}
 */
MetaDict.prototype.getJoinedCats = function(cat_name) {
  // loop for all sub dictionaries
  var set = {};
  for ( var dict_file in this._dict) { 
    var dict = this._dict[dict_file];
    var addset = dict.getJoinedCats(cat_name);
    if (addset) {
      for ( var key in addset) { 
        set[key] = addset[key];
      }
    }
  }
  return set;
};

/**
 * A DDL_star-ism?
 * @memberof MetaDict.prototype
 * @param cat_name
 * @return {Object}
 */
MetaDict.prototype.getCatDefaults = function(cat_name) {
  // loop for all dictionaries
  for ( var dict_file in this._dict) { 
    var dict = this._dict[dict_file];
    var deflt = dict.getCatDefaults(cat_name);
    if (deflt) {
      return deflt;
    }
  }
};

/**
 * get the _method.expression as a string or return undefined.
 * @memberof MetaDict.prototype
 * @param defn {ItemDefn} (BaseDefn?) also CatDefn and FuncDefn
 * @param klass {String}
 * @return {String} the dREL method string.
 */
MetaDict.prototype.getMethodString = function(defn, klass) {
  var methodClass = defn.getAttribute(this._method_purpose);
  var methodString;
  if ( (! methodClass && klass == 'evaluation') ||
       ( methodClass && methodClass.toLowerCase() == klass)) {
    methodString = defn.getAttribute(this._method_expression);
  }
  if (!methodString) {
    var methodData = defn.getAttributeLoop(this._method_expression);
    if (methodData) {
      var tags = methodData.map;
      var rows = methodData.rows;
      for (var i = 0; i< rows.length; i++) {
        if (rows[i][tags[this._method_purpose]].toLowerCase() == klass) {
          methodString = rows[i][tags[this._method_expression]];
          break;
        }
      }
    }
  }
  if (methodString) {
     methodString += "\n";
  }
  return methodString;
};

/**
 * Get the dependencies as a hashtable after compiling the method 
 * definition.
 * @memberof MetaDict.prototype
 * @param defn {ItemDefn} or {BaseDefn}
 * @param purpose {String}
 * @param lib {Library}
 * @return {Object} hashtable
 */
MetaDict.prototype.getDefnFuncDepends = function(defn, purpose, lib) {
  if (defn.hasCachedMethod(purpose)) {
    return defn.getCachedMethodDepends(purpose);
  }  
  var func = this.getDefnFunction(defn, purpose, lib);
  if (func) {
    return defn.getCachedMethodDepends(purpose);
  } 
  return null;
};

/**
 * Get a compiled definition method from cache, after 
 * transforming dREL to JavaScript
 * @memberof MetaDict.prototype
 * @param defn {ItemDefn} 
 * @param purpose {String}
 * @param lib {Library}
 * @return {Function}
 */
MetaDict.prototype.getDefnFunction = function(defn, purpose, lib) {
  if (defn.hasCachedMethod(purpose)) {
    return defn.getCachedMethod(purpose);
  }  
    
  var string = this.getMethodString(defn, purpose);
  if (! string ) {
    defn.cacheMethod(purpose, null, null);
    return null;
  }

  var func = null;
  var deps = null;
  try {
    var funcdep = this.compileMethodString(defn._name, string, purpose, lib);
    func = funcdep[0];
    deps = funcdep[1];
  } catch (e) {
    alert("failed to compile " + purpose + " method " + defn._name + "\n"
             + string);
    this.error("failed to compile defn meth. " + defn._name + "\n"
           + string);
    this.error(e);
  }
  
  defn.cacheMethod(purpose, func, deps);
  return func;
};

/**
 * @memberof MetaDict.prototype
 * @param defnName
 * @param methodString
 * @param klass
 * @param lib
 * @return {Array} [{Function},{Object}] where Object is a hashtable of 
 * dependencies.
 */
MetaDict.prototype.compileMethodString = function(defnName, methodString, klass, lib) {
  // generate Abstract Syntax Tree from dREL source
  var drel_parser = drel; // from drel.js
 this.warn("parsing method " + defnName + " " + klass);
  var ast = drel_parser.parse(methodString);
  // Compile the ast to javascript
  var dREL = new dREL_handler();
  //var jsMethodSource = dREL.compile(name, ast, this._dict, this._lib, methklass);
 this.warn("compiling  source");
  var cmp = dREL.compileDependencies(defnName, ast, this, lib, klass);
  var jsMethodSource = cmp[0];
  var depends = cmp[1];
  this.warn("Transmogrified: " +defnName);
  this._dumpDep(depends);
  this.info(jsMethodSource);
  var func = new Function('Ctxt','Library', jsMethodSource);
  return [ func, depends];
};

/**
 * @memberof MetaDict.prototype
 * @param defnName
 * @param methodString
 * @param klass
 * @param lib
 * @return {Object}  Hashtable of dependencies grouped by cat, items, funcs.
 */
MetaDict.prototype.compileMethodDepends = function(defnName, methodString, klass, lib) {
  // generate Abstract Syntax Tree from dREL source
  var drel_parser = drel; // from drel.js
  var ast = drel_parser.parse(methodString);
  // Compile the ast to javascript
  var dREL = new dREL_handler();
  //var jsMethodSource = dREL.compile(name, ast, this._dict, this._lib, methklass);
  var cmp = dREL.compileDependencies(defnName, ast, this, lib, klass);
  var jsMethodSource = cmp[0];
  var depends = cmp[1];
  this.warn("Transmogrified: " +defnName);
  this._dumpDep(depends);
  this.info(jsMethodSource);
//  var func = new Function('Ctxt','Library', jsMethodSource);
//  return func;
  return depends;

};

/**
 * @memberof MetaDict.prototype
 * @param deps
 * @return void
 */
MetaDict.prototype._dumpDep = function(deps) {
  var str = "Dependencies\n";
  for (var key in deps) {
    str = str + key + "\n";
    var type = deps[key];
    for (var dep in type) {
      str = str + "   " +dep + " " + type[dep] + "\n";
    }
  }
  this.info(str);
};


// for node.js
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.MetaDict = MetaDict;
}
