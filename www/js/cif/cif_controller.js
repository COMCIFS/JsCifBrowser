/**
 * @file MVC Controller for a CIF list of lists JSON data model
 */
if (typeof require !== 'undefined') {
 // for node.js
 var CategoryCtrlr = require("../star/star_controller.js").CategoryCtrlr;
 var ItemCtrlr = require("../star/star_controller.js").ItemCtrlr;
 var LoopCtrlr = require("../star/star_controller.js").LoopCtrlr;
 var CommentCtrlr = require("../star/star_controller.js").CommentCtrlr;
 var SaveCtrlr = require("../star/star_controller.js").SaveCtrlr;
 var BaseDictWrapper = require("../dict/dict_wrapper.js").BaseDictWrapper;
}

/**
 * Aggregate CIF data items by Block and provide an access interface.
 * Maybe this should provide the CIF access API???
 * @constructor
 */
function BlockCtrlr() {
  this._type = null;
  this._name = null;
  this._saveMode = false;
  this._cat = null;
  this._categories = {};
  this._sub_cats = {};
  this._items = {};
  this._unresolved = [];
  this._unresolvedLoopItems = [];
  this._view = null;
  this._renderer = null;
}

/**
 * @memberof BlockCtrlr.prototype
 * @param name {String} Category name
 * @return {CatCtrlr}
 */
BlockCtrlr.prototype.getCategory = function(name) {
  return this._categories[name];
};

/**
 * @memberof BlockCtrlr.prototype
 * @param name {String} Category name
 * @return {ItemCtrlr}
 */
BlockCtrlr.prototype.getItem = function(name) {
  return this._items[name];
};

/**
 * @memberof BlockCtrlr.prototype
 * @return {Renderer}
 */
BlockCtrlr.prototype.getRenderer = function() {
  return this._renderer;
};

/**
 * @memberof BlockCtrlr.prototype
 * @return {String} ?
 */
BlockCtrlr.prototype.getType = function() {
  return this._type;
};

/**
 * @memberof BlockCtrlr.prototype
 * @return {String}
 */
BlockCtrlr.prototype.getName = function() {
  return this._name;
};

/**
 * @memberof BlockCtrlr.prototype
 * @return {String[]}
 */
BlockCtrlr.prototype.getUnresolved = function() {
  return this._unresolved; // a list
};

/**
 * @memberof BlockCtrlr.prototype
 * @return {CatCtrlr[]}
 */
BlockCtrlr.prototype.getSubCats = function() {
  return this._sub_cats; 
};

/**
 * Implement a MVC View changed interface (NoOp).
 * @param attributeName
 * @param reason
 * @return undefined
 */
BlockCtrlr.prototype.modelChangedEvent = function(attributeName, reason) {
  return; 
};


/**
 * @constructor
 * @param json {Array[]} The CIF data model as a List of Lists
 * @param dict {MetaDict} The Meta Dictionary wrapper of multiple dicts.
 * @param logger {CifJs} 
 */
function CifCtrlr(json, dict, logger) { 
  this._json = json;
  this._dict = dict;
  this._blocks = [];     // the aggregated data, with leading header + globals
  this._contexts = { };  // the evaluation contexts for each data_block
  this._js = null;
  this._logger = logger;
  this._buildStruct();
}

/**
 * Loop through list of CIF blocks and global_s searching for a data_blockid
 * @memberof CifCtrlr.prototype
 * @param blockid {String} to be found.
 * @return {BlockCtrlr}
 */
CifCtrlr.prototype.getBlock = function(blockid) {
  for (var i = 0; i < this._blocks.length; i++ ) {
    var block = this._blocks[i];
    if (block._name && block._name == blockid) {
      return block; 
    }
  }
};

/**
 * Retrieve the entire list of blocks and global_ in order from the CIF
 * @memberof CifCtrlr.prototype
 * @return {BlockCtrlr[]}
 */
CifCtrlr.prototype.getBlocks = function() {
  return this._blocks; 
};

/**
 * Retrieve only the block names from the data_blockname declarations.
 * @memberof CifCtrlr.prototype
 * @return {string[]}
 */
CifCtrlr.prototype.getBlockIds = function() {
  var blks = []; 
  for (var i = 0; i< this._blocks.length; i++) {
    var blk = this._blocks[i];
    if (! blk._type) continue; // probly the CIF header
    if (blk._type == "global_") {
      continue;
    }
    if (blk._type == "data_") {
      blks.push(blk._name);
    }
  }
  return blks;
};

/**
 * Generate one context for each data_name block
 * @memberof CifCtrlr.prototype
 * @param generatorRef handle to an dREL context generator constructor.
 * @param validn
 * @return void
 */
CifCtrlr.prototype.generateContexts = function(generatorRef, validn) {
  var globals = [];  // CIF global blocks  :-/
  for (var i = 0; i<this._blocks.length; i++) {
    var blk = this._blocks[i];
    if (! blk._type) continue; // probly the CIF header
    if (blk._type == "global_") {
      globals.push(blk);
      continue;
    }
    if (blk._type != "data_") {
      throw new Error("CifCtrlr: Unhandled CIF data_block type: " + blk._type);
    }
    if (! blk._name) {
      throw new Error("CifCtrlr: CIF data_block with no name: " );
    }
    var blockid = blk._name;   
    if (blockid in this._contexts) {
      throw new Error("CifCtrlr: Duplicate data_block names for: " + blockid );
    }
    var context = new generatorRef(this._dict, this, blk, globals, 
        this._logger, validn) ;
    this._contexts[blockid] = context;
  }
};

/**
 * Obtain the execution {Context} corresponding to a given {BlockCtrlr}
 * @memberof CifCtrlr.prototype
 * @param blockid {String}
 * @return {Context}
 */
CifCtrlr.prototype.getContext = function(blockid) {
  return this._contexts[blockid];
};

/**
 * Exported external interface method to loop through all data items 
 * for all blocks and replace "?" with evaluatable quantity where possible.
 * @memberof CifCtrlr.prototype
 * @return void
 */
CifCtrlr.prototype.resolveMissingItems = function() {
  for (var blkid in this._contexts) {
    var ctxt = this._contexts[blkid];
    if (ctxt) ctxt.resolveAllUnknowns();
  }
};

/**
 * Exported external interface method to loop through all data items 
 * for all blocks and validate them where possible.
 * @memberof CifCtrlr.prototype
 * @return void
 */
CifCtrlr.prototype.validateAllBlocks = function() {
  for (var blkid in this._contexts) {
    var ctxt = this._contexts[blkid];
    if (ctxt) ctxt.validateBlock();
  }
};

/**
 * This method is invoked by the interp.html interface in order to evaluate
 * unknown items or categories with evaluation methods.
 * @memberof CifCtrlr.prototype
 * @param command {string} "validate", "evalall" or Category_name or 
 * item_name
 * @param blockid {string}
 * @return void
 */
CifCtrlr.prototype.cmd = function(command, blockid) {
  var ctxt = this._contexts[blockid];
  if (! ctxt) {
     alert("Invalid block '"+blockid + "' for command '" + command + "'");
     return ;
  }
  if (command == "validate") {
    ctxt.validateBlock();
  } else if (command == "evalall") {
    ctxt.resolveAllUnknowns();
  } else if (this._dict.hasCategory(command) ) {
    var blk = this.getBlock(blockid);
    if (command in blk._categories ) {
    } else {
      var cat_con = ctxt.getCategory(command);
    }
    ctxt.call('GenCat', command, null);

  } else if (this._dict.hasItem(command) ) {
    var defn = this._dict.getItemDefn(command); 
    var cat = defn.getCategory();
    var looped = cat.getAttribute(this._dict._category_key);
    if (!looped && this._dict._category_keys) {
      //ddl2 -> ddlm-ism
      looped = cat.getAttribute(this._dict._category_keys);
      if (looped) looped = catkey[0]; // too bad if its multiple ... 
    }
    var blk = this.getBlock(blockid);
    if (command in blk._items ) {
    } else {
      var cat_name = cat._name.toLowerCase();
      if (! (cat_name in blk._categories)) {
        //this.addCategory(blk, cat_name);
        ctxt.call('AddCat', cat_name, null);
      }
      ctxt.call('AddItem', command, null); 
    }
    try {
      var model = blk._items[command];
      if (looped) {
        ctxt.call('loopItem', command, model);  
      } else {
        ctxt.call('singleItem', command, model);  
      }
    } catch (e) {
      alert(e);
    }
  } else  {
    return alert("Unrecognised command '" + command + "'");
  }


};

 
CifCtrlr.prototype._log = function(data) {
  if (this._logger) this._logger.log(data);
};
CifCtrlr.prototype._warn = function(data) {
  if (this._logger) this._logger.warn(data);
};
CifCtrlr.prototype._error = function(data) {
  if (this._logger) this._logger.error(data);
};
CifCtrlr.prototype._debug = function(data) {
  if (this._logger) this._logger.debug(data);
};


/**
 * Internal method to initiate a new {BlockCtrlr} when processing 
 * the CIF JSON data model.
 * @memberof CifCtrlr.prototype
 * @return {BlockCtrlr}
 */
CifCtrlr.prototype._newBlock = function() {
  // make a new block
  this._js = new BlockCtrlr();
  return this._js; 
}; 



/*
 * We build wrappers around the raw JSON
 * because we need to attach behaviours for modification events
 */
CifCtrlr.prototype._newCategory = function(name, block) {
  return new CategoryCtrlr(name, block);
};
CifCtrlr.prototype._newItem = function(frag, block) {
  return new ItemCtrlr(frag, block); 
};
CifCtrlr.prototype._newSave = function(frag, data) {
  return new SaveCtrlr(frag,data);
};
CifCtrlr.prototype._newLoop = function(frag, block) {
  return new LoopCtrlr(frag, block); 
};
CifCtrlr.prototype._newComment = function(frag) {
  return new CommentCtrlr(frag);
};

/**
 * Build new categories into evolving model tree
 * @memberof CifCtrlr.prototype
 * @param block {BlockCtrlr}
 * @param _cat_name {String}
 * @return {CatCtrlr}
 */
CifCtrlr.prototype.addCategory = function(block, _cat_name) {
  var cat_name = _cat_name.toLowerCase();

  if (! block) {
    throw new Error("CifCtrlr: No CIF data_block supplied to addCategory()'" );
  }
  
  if (cat_name in block._categories) {
     return block._categories[cat_name];
  }


  var parents = [cat_name];  
  var name = cat_name;
  var allDictCats = this._dict.Categories();
  while (name && name in allDictCats
      && this._dict.getCategory(name)._category ) {
    name = this._dict.getCategory(name)._category._name;
    if (name) {
      name = name.toLowerCase();
      parents.push(name);
      if (name in block._categories) {
        break;
      }
    }
  }
//  alert("add category path " + parents);

  var renderer = block.getRenderer();
  var root = block;  
  for (var i = parents.length-1; i>=0 ; i--) {
    name = parents[i]; 
    if (name in block._categories) {
      root = block._categories[name];
      //root = root._sub_cats[name];
      // already exists, so no need to build.
      continue;
    }
    // add new category to the model
    var cat = this._newCategory(name, block);
   
    block._categories[name] = cat;
    try {
    root._sub_cats[name] =  cat;
    } catch (e) {
       alert (e);
       alert (parents + " : " + i);
       alert (" Uh Oh!!!  this name " + name);
       alert (root._name);
       throw e;
    }

    // add new category to the view
    if (renderer && root._view) {
       cat._view = renderer._renderCategory(block, name, root._view);
    }

    root = cat;  
  }

  return root; // the newly added category, as requested
};


/**
 * Add a new Item to a category or a listable category and re-render
 * any new categories and/or items.
 * @memberof CifCtrlr.prototype
 * @param block  {BlockCtrlr}
 * @param item_name {String} DDLm dictionary _definition.id
 * @return {ItemCtrlr} (or {LoopCtrlr} )
 */
CifCtrlr.prototype.addItem = function(block, item_name) {

  var popDictBlock = 1;
  // get item category 
  var path = this._dict.getItemPath(item_name.toLowerCase()); 
  var parnt = block;
  var renderer = block.getRenderer();
  if (! path) {
    alert("CIFWrap addItem()" + item_name + " to path " + path);
  }
  for (var i = path.length-1- popDictBlock; i > 0; i--) {
    // last in path is *the item*
    var cat_name = path[i].toLowerCase();
    if (cat_name in parnt._sub_cats) {
       parnt = parnt._sub_cats[cat_name];
       continue;
    }  
    // add Category
    
    var cat =  this._newCategory(cat_name, block);
    parnt._sub_cats[cat_name] = cat;
    block._categories[cat_name] = cat;
    if (renderer && parnt._view) {
       cat._view = renderer._renderCategory(block, cat_name, parnt._view);
    }
    parnt = cat;
  }

  // check if parent is a loopable category
  var loop_key_name;
  if (! ('_tags' in parnt._loop)) {
    var cat_defn = this._dict.hasCategory(parnt._name);
    if (!cat_defn) alert("aaargh! missing category " + parnt._name);
    var loop_key_name = cat_defn.getAttribute(this._dict._category_key);
    if (!loop_key_name && this._dict._category_keys) {
      //ddl2 -> ddlm-ism
      loop_key_name = cat_defn.getAttribute(this._dict._category_keys);
      if (loop_key_name) loop_key_name = loop_key_name[0]; //too bad if its multiple
    }
  }
//alert("loop_key_name : " + loop_key_name);
  // adding a new single unlooped item 
  if (! ('_tags' in parnt._loop) && ! loop_key_name) {

    var frag = ['item_', item_name, '?']; // append a comment? 
    var item = this._newItem(frag, block);

    parnt.addFragCtrlr(item);
    block._items[item_name.toLowerCase()] = item;
    if (renderer && parnt._view) {
      var blockid = block['_name'];
      // this is screwed up. we need blockid, so the Eval comp links in right block
      renderer._renderAttribute(item, parnt._view, blockid, 'changed');
      // render sets the item._view
    }


  // else adding a new item to a loop
  }  else {
    var loop_frag = parnt.getLoopCtrlr();
    // ensure item_name is known
    block._items[item_name.toLowerCase()] = loop_frag;
    // add it to the loop
    loop_frag.addAttribute(item_name);

    item = loop_frag;

    if (! loop_frag._view) {
      if (renderer && parnt._view) {
        var blockid = block['_name'];
        renderer._renderLoop(loop_frag, parnt._view, blockid);
      }
//      loop_frag._view = parnt._view;
    }

    loop_frag.refreshView();
  }
    
  return item;
};

/**
 * Return a hierarchy of category parents for a given _item.name 
 * [_item.name, category.id, _ctegory.id ..., blockid]
 * @memberof CifCtrlr.prototype
 * @param blockid {String} data_name of the block
 * @param item_name {String} _definition.id
 * @return {String[]}
 */
CifCtrlr.prototype.getItemPath = function(blockid, item_name) {
  var block = this.getBlock(blockid);
  if (! block) return;
  var low_item_name = item_name.toLowerCase();
  var parnt = this._dict.getItemDefn(low_item_name);
  var path = [low_item_name];
  while (parnt._category) {
    var cat_name = parnt._category._name.toLowerCase();
    var cifparnt = block.getCategory(cat_name);
    if (! cifparnt) break;
    path.push(cat_name);
    parnt = parnt._category;
  }
  path.push(blockid);
  return path;
};

/**
 * Walk the CIF top level structure of the JSON model to build a hierarchy
 * of controllers.
 * @memberof CifCtrlr.prototype
 * @return void
 */
CifCtrlr.prototype._buildStruct = function() {
  var raw = this._json;
  var header = [];
  var i;
  // cleave off the initial file header comments
  for (i = 0; i < raw.length; i++) {
    var chunk = raw[i];
    if (chunk[0] != '@comment') {
      break;
    }
    header.push(chunk);
  }
  if (header.length ) {
    this._blocks.push(header);
  }

  // now work through the data blocks
  // there should only be data blocks or global blocks
  for ( ; i < raw.length; i++) {
    var chunk = raw[i];
    if (chunk[0] == 'data_' || chunk[0] =='global_') {
      var blk = this._newBlock(); // build a new record
      blk._type = chunk[0];
      this._blocks.push(blk);
      if (chunk[0] == 'global_') {
        blk._name = '';
        blk._type = 'global_';
        data = chunk[1];
      } else {
        blk._name = chunk[1];
        blk._type = 'data_';
        data = chunk[2];
      }
      this._log(" NEW BLOCK " + blk._type + "  " + blk._name);

      this._visitData(data);

      // now loop through the categories to build the group hierarchy
      // for this block
      var rawcatkeys = [];
      for (var cat_name in this._js._categories) {
        rawcatkeys.push(cat_name);
      }
      
      for (var j=0; j < rawcatkeys.length; j++) {
        cat_name = rawcatkeys[j];
        
        if (cat_name in this._js._sub_cats) {
          // for top level categories
          // re-use _categories as a shorthand pointer to ModelCategory
          // This isn't a good idea if cat names are duplicated...?
          this._js._categories[cat_name] = this._js._sub_cats[cat_name]; 
          continue;
        }
        var parents = this._dict.getCategoryHierarchy(cat_name.toLowerCase());
        if (! parents) {
          this._warn("No parents for cat " + cat_name);
          continue;
        }
        
        var cats = this._js._sub_cats;
        for (var k = parents.length-1; k>=0; k--){
          var name = parents[k]; 
          if (name in cats) {
            cats = cats[name]._sub_cats;
            continue;
          } 
          var cat =  this._newCategory(name, this._js); // name and block
          if (name in this._js._categories) {
            var obj = this._js._categories[name]; 
            if (obj instanceof Array) {
              cat.addListOfFragCtrlrs(obj);
              //cat._data = obj;
            }
          } 
          this._js._categories[name] = cat;  // save a reference
          // make a shorthand link to the cat
//          this._js._categories[name] = cat; 
          cats[name] = cat;
          cats = cat._sub_cats;
        }
        var cat;
        var data = this._js._categories[cat_name]; 
        if (cat_name in cats) {
          cat = cats[cat_name]; // re-use previous defn
        } else {
          cat =  this._newCategory(cat_name, this._js); // or create a new one
          // make a shorthand link to the cat
          this._js._categories[cat_name] = cat; 
        }
        // make the hierarchical cat entry link to the flat cat entry
        if (data instanceof Array) {
          cat.addListOfFragCtrlrs(data);
//          cat._data = data;
        } else {
          // cat._data = [];
          // raise error if non null
        }
        // re? associate cat with hierarchy
        cats[cat_name] = cat; 
      }
    } else {

    }
  }
};

/**
 * Internal method to step through a list of data items to build
 * a hierarchy of controllers from JSON data model.
 * @memberof CifCtrlr.prototype
 * @param data
 * @return void
 */
CifCtrlr.prototype._visitData = function(data) {
      for (var j = 0; j< data.length; j++) {
        var chnk = data[j];
        if (chnk[0] == 'item_') {
          var item_name = chnk[1];
          var frag = this._newItem(chnk, this._js); // add ref to current block 
          if (this._js._saveMode) {
            this._js._cat.push(frag);
            // I have no idea what should happen to categories in a save frame!
            continue; 
          }
          if (item_name) item_name = item_name.toLowerCase();
          var item = this._dict.getItemDefn(item_name);
          if (item) {
            var cat = item._category;
            this._js._items[item_name] = frag;
            var cat_name = cat._name.toLowerCase();
            if (cat_name in this._js._categories) {
              this._js._cat = this._js._categories[cat_name]; 
              this._js._cat.push(frag);
            } else {
              this._js._cat = [frag];
              this._js._categories[cat_name] = this._js._cat;
            }
          } else {
            this._js._unresolved.push(frag);
            this._warn("Unresolved item " + item_name); 
          }
        } else if (chnk[0] == 'loop_') {
          var item_list = {};
          var keys = chnk[1];
          for (var k = 0; k< keys.length; k++) {
              var key = keys[k];
              if (typeof key == 'string') { // skip comments
                key = key.toLowerCase();
                var item = this._dict.getItemDefn(key);
                if (item) {
                  //this._js._items[key] = frag;
                  item_list[key] = 0;
                } else {
                  this._js._unresolvedLoopItems.push(key);
                  this._warn("Unresolved item " + key); 
                }
              }
          }
          if (this._js._saveMode) {
            this._js._cat.push(frag);
            // I have no idea what should happen to categories in a save frame!
            continue; 
          }
          // lets check if its a mixed category loop_
          var cat_list = {};
          var cat_keys = {};
          var catcnt = 0;
          for (var itemname in item_list) {
            item_name = itemname.toLowerCase();
            var item = this._dict.getItemDefn(item_name);
            if (item) {
              var cat = item._category;
              var cat_name = cat._name.toLowerCase();
              if (cat_name in cat_list) { 
                cat_list[cat_name].push(itemname);
              } else {
                cat_list[cat_name] = [itemname];
                var catkey = cat.getAttribute(this._dict._category_key);
                if (!catkey && this._dict._category_keys) {
                  //ddl2 -> ddlm-ism
                  catkey = cat.getAttribute(this._dict._category_keys);
                  if (catkey) catkey= catkey[0]; // too bad if its multiple ... 
                }
                var keyitem = this._dict.getItemDefn(catkey); 
                cat_keys[cat_name] = keyitem; 
                if (! keyitem) { 
                    this._error("No key for " +item_name  + " : " + cat_name + " : " + catkey); 
                    alert("No key for " +item_name  + " : " + cat_name + " : " + catkey); 
                }
                catcnt++;
              }
            } else {
              if ("none" in cat_list) { 
                cat_list["none"].push(itemname);
              } else {
                cat_list["none"] = [itemname];
              }
            }
          }
          // how many categories were counted?
          if (catcnt == 0) {
            var frag = this._newLoop(chnk, this._js); 
            this._js._unresolved.push(frag);
            this._log("unresolved item " + item_name); // amongst others 
          } else if (catcnt == 1) { // only one defined category
            var frag = this._newLoop(chnk, this._js); 
            var cat_name;
            for (var cname in cat_list) {
              if (cname !== "none") {
                cat_name = cname;
                break;
              }
            }
            for (var itemname in item_list) {
              var item_name = itemname.toLowerCase();
              this._js._items[item_name] = frag;
            }
            if (cat_name in this._js._categories) {
              this._js._cat = this._js._categories[cat_name]; 
              this._js._cat.push(frag);
            } else {
              this._js._cat = [frag];
              this._js._categories[cat_name] = this._js._cat;
            }
          } else { 
            // aargh! Its a mixed category
            var strn = '';
            for (var cat_name in cat_list) {
               strn = strn + cat_name + ", ";
            }
            this._warn("Attempting (badly) to split mixed categories " + strn); 
            var splits = this._splitLoop(cat_list, cat_keys, chnk);
            for (var cat_name in splits) {
              var info = splits[cat_name];
              // make up an artificial chunk
              var chk = ['loop_', info['fields'],info['vals']];
              var frag = this._newLoop(chk, this._js); 
              for (var f=0; f<info['fields'].length; f++) {
                 var fld = info['fields'][f].toLowerCase();
                 this._js._items[fld] = frag;
              }
              if (cat_name in this._js._categories) {
                this._js._cat = this._js._categories[cat_name]; 
                this._js._cat.push(frag);
              } else {
                this._js._cat = [frag];
                this._js._categories[cat_name] = this._js._cat;
              }
            }
          } // end of mixed category.
          
        } else if (chnk[0] == 'save_') {
          var frag = this._newSave(chnk,[]); // add a new slot for save _data
          this._js._saveMode = true;
          var prev = this._js._cat;  // previous repo for fragments
          this._js._cat = frag._data;    // out of current cat 
          this._visitDataMinimal(chnk[2]);
          this._js._cat = prev;   // reset previous repo for frags
          this._js._saveMode = false;
          this._js._unresolved.push(frag);
        }
        else if (chnk[0] == '@comment') {
          if (this._js._cat) {
            var frag = this._newComment(chnk);
            this._js._cat.push(frag);
          }
        }
      }

};

/**
 * Internal method to handle data in CIF save_ frames where there is 
 * no established handling protocol as yet.
 * @memberof CifCtrlr.prototype
 * @param data {Array[]} JSON data model of a loop
 * @return {Object} 
 */
CifCtrlr.prototype._visitDataMinimal = function(data) {

      for (var j = 0; j< data.length; j++) {
        var chnk = data[j];
        if (chnk[0] == 'item_' || chnk[0] == 'loop_') {
          var item_name = null;
          var frag;
          if (chnk[0] == 'item_') {
            item_name = chnk[1];
            frag = this._newItem(chnk, this._js); 
          } else {
            var keys = chnk[1];
            frag = this._newLoop(chnk, this._js); 
            for (var k = 0; k< keys.length; k++) {
              key = keys[k];
              //if (typeof key == 'string' && (key in this._dict._items)) {}
              if (typeof key == 'string' && this._dict.hasItem(key)) {
                this._js._items[key] = frag;
                item_name = key;
              }
            }
          }
          if (this._js._saveMode) {
            this._js._cat.push(frag);
            continue; 
          }

          if ( item_name in this._dict._items) {
            var item = this._dict._items[item_name]; 
            var cat = item._category;
            this._js._items[item_name] = frag;
            var cat_name = cat._name.toLowerCase();
            if (cat_name in this._js._categories) {
              this._js._cat = this._js._categories[cat_name]; 
              this._js._cat.push(frag);
            } else {
              this._js._cat = [frag];
              this._js._categories[cat_name] = this._js._cat;
            }
          } else {
            this._js._unresolved.push(frag);
            this._log("unresolved item" + item_name); 
          }
        }
        else if (chnk[0] == 'save_') {
          var frag = this._newSave(chnk,[]);
          var prev = this._js._cat; 
          this._js._cat = frag._data;
          this._visitDataMinimal(chnk[2]);
          prev.push(frag);
          this._js._cat = prev;
        }
        else if (chnk[0] == '@comment') {
          if (this._js._cat) {
            var frag = this._newComment(chnk);
            this._js._cat.push(frag);
          }
        } else {
        throw new Error("Unknown type '" + chnk[0] +"' while converting CIF to JS\n" + chnk ); 
        }
      }

};

/**
 * This is one big hack to try and separate merged categories
 * with only a single key, back into separate loops each with their
 * own key. It is fraught with adhoc heuristics!
 * @memberof CifCtrlr.prototype
 * @param cat_list {Object} Loop headers split into categories.
 * @param cat_keys {Object} Hashtable keyed by category
 * @param loop  {Object} the supplied single aggregated loop
 * @return {Object} data structure of segregated loops.
 */
CifCtrlr.prototype._splitLoop = function(cat_list, cat_keys, loop) {
  var fields = loop[1];
  var vals = loop[2];
  var loops = {};
  var assigned = {}; // reverse lookup list
  var keyed = [];  // 
  for (var key in cat_list) {
    if (key === "none") continue;
    loops[key] = {'vals': [], 'fields': [], 'keys':[], 'key_deps':[]};
    var items = cat_list[key];
    for (var i = 0; i< items.length; i++) {
      assigned[items[i]] = key;
    }
    // build a list of potential category key names
    var al = [];
    if (key in cat_keys) {
      var key_item = cat_keys[key]; 
      if (!key_item) {
         this._error("Splitting loop error resolving item for key: " + key);
         continue;  // ?????? or abort? 
      } 
      al.push(key_item._name.toLowerCase() );
      var aliases = key_item.getAliases();  
      if (aliases) {
        for (var i = 0 ; i < aliases.length; i++) {
          al.push(aliases[i]);
        }
      }
      loops[key]['keys'] = al;
      loops[key]['type'] = 'keys';   
      // if primary key is not present, there is a possible fallback
      var evalMethStr = this._dict.getMethodString(key_item,'evaluation');
      if (evalMethStr) {
        //build dependency list for the category key
        var deps;
        try {
          deps = this._dict.compileMethodDepends(al[0], evalMethStr,
                     'evaluation', {} );
        } catch (e) {
          this._error("failed to compile dependencies for " + key_item._name);
          this._error(e);
        }
        if (deps && ('items' in deps)) {
          al = [];
          var itmdeps = deps['items'];
          var depitmcnt = 0;
          var e;
          for(e in itmdeps) {
            if(itmdeps.hasOwnProperty(e)) depitmcnt++;
          }
          if (depitmcnt == 1) {
            var depitm = this._dict.getItemDefn(e);
            if (depitm) {
              al.push(depitm._name.toLowerCase());
              aliases = depitm.getAliases();  
              if (aliases) {
                for (var i = 0 ; i < aliases.length; i++) {
                  al.push(aliases[i]);
                }
              }
            }
          }
          loops[key]['key_deps'] = al;
        }
      }
    }
//    alert( loops[key]['keys'] );
  }
  // determine common keys or key dependents
  var cat_cnt = 0;
  for (var key in cat_list) {
    if (key === "none") continue;
    cat_cnt++;
    var items = cat_list[key];
    var check = ['keys','key_deps'];// primary cat keys, or its dependencies
    var keytype;
    var match;
    for (var i=0; i<check.length; i++) {
      var typ = check[i];
      var keys = loops[key][typ];   
      for (var j=0; j<keys.length; j++) {
        for (var k=0; k<items.length; k++) {
          if (items[k] == keys[j]) {
            match = items[k];
            keytype = typ;
            break;
          }
        }
        if (match) break;
      }
      if (match) break;
    }
    if (match) {
      //keyed = key;   
      keyed.push(key);
      loops[key]['key'] = match;   
      loops[key]['type'] = keytype;   
      match = null;
    }
  }

  if (keyed.length == cat_cnt) {
   keyed = undefined; // already got all the keys
  } else {
    if (keyed.length >1) {
      this._error("CifController.splitLoops() can't split this mixed loop "+ keyed); 
    }
    keyed = keyed[0]; 
  }
  if (keyed) {
    this._warn(" Got category " + keyed + " " + loops[keyed]['type'] + " " + loops[keyed]['key']);
//    alert(" Got category " + keyed + " " + loops[keyed]['type'] + " " + loops[keyed]['key']);
    for (var key in loops) {
      if (key === keyed) continue;
      var typ = loops[keyed]['type'];
      loops[key]['type'] = typ;
      var dupe_keys = loops[key][typ];
      if (dupe_keys.length>0) {
        loops[key]['key'] = dupe_keys[0]; // use first, not its aliases 
//        alert(" duplicating " + loops[keyed]['key']  + " as " + dupe_keys[0] +
        this._warn(" duplicating " + loops[keyed]['key']  + " as " + dupe_keys[0] +
              " for category " + key);  
        // inject new key as first item of otherwise unkeyed split category
        loops[key]['fields'].push(dupe_keys[0]); 
      } else {
        // all we can do is guess ...
        if (typ == 'key_deps') typ = 'keys';
        else typ = 'key_deps';
        loops[key]['type'] = typ;
        var guesses = loops[key][typ];
        loops[key]['key'] = guesses[0]; // use first, not its aliases 
        loops[key]['fields'].push(guesses[0]); 
        this._warn("Fudging " + loops[keyed]['key']  + " as " + guesses[0] +
              " for category " + key);  
      }
    }
  }

  // divvy up the header fields into categories, 
  var first; // first cat gets initial comments and unknwn field cruft.
  var last;
  var pending = [];
  for (var k = 0; k< fields.length; k++) {
    var key = fields[k];
    if ((typeof key) !== 'string') {   
      // a comment
      if (last) {  
        loops[last]['fields'].push(key);
      } else {
        pending.push(key);
      }
      continue;
    }
    var cat = assigned[key.toLowerCase()];
    if (!cat) { // unknown item
      if (!first) {
        pending.push(key);
      } else {
        loops[first]['fields'].push(key);
        assigned[key] = first;
      }
      continue;
    }
    
    var addto;
    if (!first) {
      first = cat; 
      addto = first;
    } else { 
      addto = last;
    }
    for(var i=0; i< pending.length; i++) {
      loops[first]['fields'].push(pending[i]);
      if ((typeof pending[i]) === 'string') {   
         assigned[pending[i]] = addto;
      }
    }
    pending = []; // reset
    loops[cat]['fields'].push(key);
    last = cat; // where next comment aught to go
  }

  // now we have grouped the field headers, lets divvy up the values 
  var k = 0;
//  alert("fields " + fields.length)
  var keyvals = [];
  for (var i = 0; i< vals.length; i++) {
    var item = fields[k];
    while ((typeof item) == 'object' && item[0] =='@comment') {
      k = (k+1) % fields.length;
      item = fields[k];
    }
    var val = vals[i];
    var cat;
    if ((typeof val) == 'object' && val[0] =='@comment') {
      cat = first;
    } else {
      item = item.toLowerCase();
      cat = assigned[item];
      k = (k+1) % fields.length;
    }
    if (keyed && item == loops[keyed]['key'] ) {
      keyvals.push(val);
    } 
//    alert(k + " : " + item + " : " + cat + " : " + val);
    loops[cat]['vals'].push(val);
  } 

  // post inject the missing keys
  if (keyed) {
    for (var cat in loops) {
      if (cat === keyed) continue;
      var oldvals = loops[cat]['vals']; 
      var newvals = [];
      var flds = loops[cat]['fields']; 
      k = 0;
      j = 0;
      var flength = flds.length -1;
      for (var i = 0; i< oldvals.length; i++) {
        var item = flds[k];
        while (typeof item == 'object' && item[0] =='@comment') {
          k = (k+1) % flength;
          item = flds[k];
        }
        var val = oldvals[i];
        if (k ==0) {
          newvals.push(keyvals[j++]);
        }
        newvals.push(val);
        if (typeof val == 'object' && val[0] =='@comment') {
        } else {
          k = (k+1) % flength;
        }
      }
      loops[cat]['vals'] = newvals; 
    }
  }
  return loops; 
};

/**
 * Export the data from the Controller as a CIF
 * @memberof CifCtrlr.prototype
 * @param wrapper {CifCtrlr}
 * @return {String[]}
 */
CifCtrlr.prototype.exportCIF = function(wrapper) {
  var text = [];
  var newline = '\n';
  var comment = '#';
  var blocks = wrapper._blocks;

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    if (i == 0 && block[0] && block[0][0] == '@comment') {
      for (var j = 0; j < block.length; j++) {
        if (block[j][0] == '@comment') {
          text.push(comment);
          text.push(block[j][1]);
          text.push(newline);
        }
      }
    }
    // otherwise it is a newBlock
    var type = block['_type'];
    var name = block['_name'];

    if (type == 'global_' || type == 'data_') {
      text.push(newline);
      text.push(type + name);
      text.push(newline);
      text.push(newline);

      var progeny = block._sub_cats;
      this._walkStruct(block, progeny, text);

      // display items of no known dict definition
      var sundries = block._unresolved;
//   this._warn("unresolved " + sundries.length + block._unresolvedLoopItems.length);
      this._walkCatData(block, sundries, text); 
    }
  } // end of loop over blocks
  return text;
};

/**
 * Internal helper method for generating a CIF as an array of strings.
 * This bit justs walks the CatCtrlr hierarchy.
 * @param block {BlockCtrlr}
 * @param siblings {CatCtrlr[]} a List of sub category children.
 * @param text {String[]}  CIF text is appended to this array.
 * @return void
 */
CifCtrlr.prototype._walkStruct = function(block, siblings, text) {
  var cats = [];
  for (var cat in siblings) {
    cats.push(cat);
  }
  cats.sort();
  
  for (var ncat = 0; ncat < cats.length; ncat++) {
    var cat_name = cats[ncat];

    // walk down category children
    var cat = siblings[cat_name];
    if (cat._sub_cats) {
      var progeny = cat._sub_cats;
      this._walkStruct(block, progeny, text);
    }

    // now do item children of this category
    var data = cat._data;
    if (! data) continue; // no items to add
    this._walkCatData(block, data, text);
  }
};

/**
 * Process the data item children of a category.
 * @param block {BlockCtrlr}
 * @param data {Array[]} JSON model of CIF data items for category.
 * @param text {String[]} The output CIF text
 * @return void
 */
CifCtrlr.prototype._walkCatData = function(block, data, text) {
  var whitespace = " ";
  var newline = '\n';
  var comment = '#';
  var sep = "  ";

  for (var j = 0; j< data.length; j++) {
      var frag = data[j];
      var chunk = frag.getJSON();
      var type;
      if (frag._type) type = frag._type;
      else type = chunk[0];

      if (type == 'item_') {
        var tag = chunk[1];
        text.push(tag);
        if (tag.length <42) {
          text.push(new Array(42 - tag.length).join(' '));
        } else {
         text.push(whitespace);
        }
        var value = chunk[2];
        if (typeof value == 'string'){

        } else {

        } 
        if (! value) value = '?';
        BaseDictWrapper.prototype._renderItemValue(text,value); 
        text.push(newline);

      }
      else if (type == '@comment') {
        text.push(whitespace);
        text.push(comment);
        text.push(chunk[1]);
        text.push(newline);
      } 
      else if (type == 'loop_') {
        text.push(newline);
        text.push('loop_');
        text.push(newline);

        var tags = chunk[1];
        var fieldCnt = 0;
        for (var k = 0; k < tags.length; k++) { 
          var tag = tags[k]; 
          if (typeof tag == 'string') {
            text.push("  "); // indent
            text.push(tag);
            text.push(newline);
            fieldCnt++;
          }
          else {
            text.push(whitespace);
            text.push(comment);
            text.push(tag[1]);
            text.push(newline);
          }
        }
  
        var values = chunk[2];
        var l = -1;
        var line = [];
        for (var i = 0; i < values.length; i++) { 
          var val = values[i]; 
          if (typeof val == 'object' && val[0] =='@comment') {
            line.push(sep); 
            line.push('#' + val[1]); 
          } else {
            l++;
            if (l >=fieldCnt) {
              l = 0;
              text.push(newline);
              line = [];
            } 
            if (l != 0) text.push(whitespace);
            BaseDictWrapper.prototype._renderItemValue(text,val); 
          } 
        }
        // dump up any residuals ????
        if (line.length > 0) {
          //var dat = this._doc.createTextNode(line.join('')); 
          //pre.appendChild(dat);
        }
        //xml.appendChild(dl);
        text.push(newline);
        text.push(newline);
  
      } else if (type == 'save_') {
        text.push("save_"); 
        text.push(frag._name); 
        text.push(newline); 
        this._walkCatData(block, frag._data, text);

        text.push("  save_"); 
        text.push(newline); 

      } else {
        throw new Error("Unknown type '" + type +"' while converting JS to CIF\n" + chunk ); 
      }
    } // loop over cat data item chunks . should be sorted
}; 



if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.CIF_controller = CifCtrlr;
}
