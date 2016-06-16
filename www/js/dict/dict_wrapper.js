/*
 * @file  DDL1, DDL2, DDLstar and DDLm dictionary (instantiated -) JSON handlers.
 * 
 */
if (typeof require !== 'undefined') {
 // for node.js
 var ItemCtrlr = require("../star/star_controller.js").ItemCtrlr;
 var LoopCtrlr = require("../star/star_controller.js").LoopCtrlr;
 require("../drel/numeric-1.0.2.js");
}

/**
 * Base class for definitions of both Items and Categories for all 
 * dictionary definition languages.
 * @constructor 
 * @param name {String} Typically save_frame or data_name?
 */
function DefnBase(name) {
  this._init(name);
}

/**
 * @memberof DefnBase.prototype
 * @param name {String}
 * @return null
 */
DefnBase.prototype._init = function(name) {
  this._name = name;
  this._category = null;
  this._save = null;
  this._data = null;
  this._loadTime = 0;
  this._timing = { };
  this._cache = { };	
};
DefnBase.prototype.constructor = DefnBase;

/**
 * Retrieve the underlying JSON
 * @memberof DefnBase.prototype
 * @return {Array[]} List of attributes.
 */
DefnBase.prototype.getJSON = function() {
  return this._data;
};

/**
 * Retrieve the underlying JSON
 * @memberof DefnBase.prototype
 * @return {Array[]} List of attributes.
 */
DefnBase.prototype.getAttributes = function() {
  return this._data;
};
/**
 * Retrieve value of an unlooped definition attribute.
 * @memberof DefnBase.prototype
 * @param tag {String}
 * @return {Object}
 */
DefnBase.prototype.getAttribute = function(tag) {
  return BaseDictWrapper.prototype._getAttribute(tag,this._save);
};

/**
 * Retrieve the whole loop containing the supplied tag as a hashtable
 * with a field index and the raw data.
 * @memberof DefnBase.prototype
 * @param tag {String}
 * @return {Object}
 */
DefnBase.prototype.getAttributeLoop = function(tag) {
  return getAttributeLoop(tag, this._save);
};

/**
 * Retrieve a reference to the {CatDefn} containing this {DefnBase}.
 * @memberof DefnBase.prototype
 * @return {CatDefn}
 */
DefnBase.prototype.getCategory = function() {
	return this._category;
};

/**
 * Retrieve subcategories as a hashtable.
 * @memberof DefnBase.prototype
 * @return {Object}
 */
DefnBase.prototype.getSubCats = function() {
	return null; // an item definition has no sub cats, duh.
};

/**
 * Retrieve sub item definitions as a hashtable.
 * @memberof DefnBase.prototype
 * @return {Object}
 */
DefnBase.prototype.getItems = function() {
	return null; 
};

/**
 * Has method been compiled and cached?
 * @memberof DefnBase.prototype
 * @param purpose {String} _method.class
 * @return {Boolean}
 */
DefnBase.prototype.hasCachedMethod = function(purpose) {
  var data = this._cache[purpose];
  if (! data) return false;
  if (data[1]<=this._loadTime) return false;
  return true;
};

/**
 * Retrieve a compiled executable method.
 * @memberof DefnBase.prototype
 * @param purpose {String} _method.class
 * @return {Function} a compiled functional method
 */
DefnBase.prototype.getCachedMethod = function(purpose) {
  var data = this._cache[purpose];
  if (! data) return null;
  return data[0];
};

/**
 * Retrieve a list of method dependencies collated during the 
 * transformation process.
 * @memberof DefnBase.prototype
 * @param purpose {String} _method.class
 * @return {Object} a hashtable.
 */
DefnBase.prototype.getCachedMethodDepends = function(purpose) {
  var data = this._cache[purpose];
  if (! data) return null;
  return data[2];
};

/**
 * Cache the compiled method and dependencies by _method.class
 * @memberof DefnBase.prototype
 * @param purpose {String}
 * @param func {Function}
 * @param deps {Object}
 * @return {null}
 */
DefnBase.prototype.cacheMethod = function(purpose, func, deps) {
  var data = this._cache[purpose];
  if (data) {
    data[0] = func; 
    data[1] = new Date().getTime();
    data[2] = deps;
  } else {
    this._cache[purpose] =  [func, new Date().getTime(), deps];  
  }
};

/**
 * Implements a (dictionary) model change listener on a per definition basis.
 * @memberof DefnBase.prototype
 * @param attributeName {String} Which attribute changed.
 * @param reason {String} ?
 * @return {null}
 */
DefnBase.prototype.modelChangedEvent = function(attributeName, reason) {
  // the item "name"  has changed through  direct user interaction
  this._loadTime = new Date().getTime();
  alert ("changed dict attribute " + attributeName + " in defn " + this._name);
};


/**
 * @constructor
 * @augments {DefnBase}
 * @param name {String} Category name.
 */
function CatDefn(name) {
	this._init(name);
  this._sub_cats = {};
  this._items = {};
  this._itemsByAttributeId = {};  
} 

CatDefn.prototype = new DefnBase();
//we add our own extensions to this DefnBase instance
/**
 * @memberof CatDefn.prototype
 */
CatDefn.prototype._init = function(name) {
	this.__tmpinit = DefnBase.prototype._init;
	// now DefnBase constructor thinks it belongs to CatDefn
	this.__tmpinit(name);
};

/**
 * Retrieve an item definition from this category based on _object.id
 * @memberof CatDefn.prototype
 * @param tag {String} _object.id
 * @return {ItemDefn} 
 */
CatDefn.prototype.getItemByAttributeId = function(tag) {
	return this._itemsByAttributeId[tag];
};

/**
 * Retrieve the group of sub categories of this category, if any.
 * @memberof CatDefn.prototype
 * @return {Object} a hashtable, keyed by sub-category names.
 */
CatDefn.prototype.getSubCats = function() {
	return this._sub_cats;
};

/**
 * Retrieve the group of item definitions belonging to this category, if any.
 * @memberof CatDefn.prototype
 * @return {Object} a hashtable, keyed by _object.id names.
 */
CatDefn.prototype.getItems = function() {
	return this._items;
}; 


/**
 * Container for dictionary item definitions, holding all the attributes
 * necessary to define data items as they appear in a CIF data file.
 * @constructor
 * @param name {String}
 */
function ItemDefn(name) {
	this._init(name);
  this._aliases = [];
  this._generic; 
  this._generated = null;   
  if (! typeof CifJs == 'undefined')  // web env
    this._logger = CifJs; 
  else  			// node.js
    this._logger = console;
}

ItemDefn.prototype = new DefnBase();
//we add our own extensions to this DefnBase instance

/**
 * Subclass specific initialization.
 * @memberof ItemDefn.prototype
 */
ItemDefn.prototype._init = function(name) {
	this.__tmpinit = DefnBase.prototype._init;
//	now DefnBase constructor thinks it belongs to CatDefn
	this.__tmpinit(name);
};

/**
 * Return alias list.
 * @memberof ItemDefn.prototype
 * @return {Array[]} of strings
 */
ItemDefn.prototype.hasAliases = function() {
	return this.getAliases();
};

/**
 * Return alias list.
 * @memberof ItemDefn.prototype
 * @return {Array[]} of strings
 */
ItemDefn.prototype.getAliases = function() {
	if (this._aliases.length == 0) return ;
	var ret = []; // make a copy
	for (var i = 0; i<this._aliases.length; i++) {
		ret.push(this._aliases[i]); 
	}
	return ret;
};

/**
 * Override {DefnBase}
 * @memberof ItemDefn.prototype
 * @return {Object} 
 */
ItemDefn.prototype.getAttribute = function(tag) {
	var ret =  BaseDictWrapper.prototype._getAttribute(tag,this._save);

	if (ret) return ret;
	if (this._generic) {
//		this._logger.info("----------------" + this._name + " CHECKING GENERIC for " + tag);
		if (this._generic instanceof Array) {
			// hope there is no overriding of the imports ...
			for (var i = 0; i < this._generic.length; i++) {
				var genItem = this._generic[i];
				ret =  genItem.getAttribute(tag);
				if (ret) return ret;
			}
		} else {
			return  this._generic.getAttribute(tag);
		}    
	}

	if (this._generated) {
		return  BaseDictWrapper.prototype._getAttribute(tag,this._generated);
	}
};

/**
 * Override {DefnBase}
 * @memberof ItemDefn.prototype
 * @return {Object} return a hashtable with a field map and data.
 */
ItemDefn.prototype.getAttributeLoop = function(tag) {
	var ret = getAttributeLoop(tag, this._save);  
	if (ret) return ret;
	if (this._generic) {
//		alert(this._name + " checking enum loop for " +  tag)
//		this._logger.info("----------------" + this._name + " CHECKING GENERIC for " + tag);
		if (this._generic instanceof Array) {
			// hope there is no overriding of the imports ...
			for (var i = 0; i < this._generic.length; i++) {
				var genItem = this._generic[i];
				ret =  genItem.getAttributeLoop(tag);
				if (ret) return ret;
			}
		} else {
			return   this._generic.getAttributeLoop(tag);
		}    
	}
};


/**
 * Return a wrapped reference to an attribute.
 * @memberof ItemDefn.prototype
 * @return {AttributeRef} 
 */
ItemDefn.prototype.getAttributeRef = function(context, attrib) {
	var ret =  BaseDictWrapper.prototype._getAttributeRef(attrib, this._save);
	if (ret) {
		return new AttributeRef(context, this, ret);
	}
	ret = ['item_', attrib, null]; 
	return new AttributeRef(context, this, ret, true);
};




/**
 * Wrapper around a definition attribute.
 * @constructor
 * @param context
 * @param itemDefn
 * @param attrib
 * @param addIfSet 
 */
function AttributeRef(context, itemDefn, attrib, addIfSet) {
  this._ctxt = context;
  this._item = itemDefn;
  this._attrib = attrib;
  this._addIfSet = attrib;
  this.setValue = function(val) {
    // I am not happy about dictionary values being modified
    // or that the dictionary should maintain a record of context specific 
    // generated valuesontextSysDefnWrapper
//    alert ("haha set the value" + val); 
    this._attrib[2] = val;
    if (! this._addIfSet) { // only add once!
      this._addIfSet = false;
      return; 
    }
    if (! this._item._generated) this._item._generated = [];
    this._item._generated.push(this._attrib);
  };
}

/**
 * Helper function used by dictionaries, Categories and Items.
 * @param tag {String} the required _data_item name in a looped context.
 * @param save {Array[]} JSON model data
 * @return {Object}
 */
function getAttributeLoop(tag, save) {
  if (!tag) return null;
  if (!save) return null;
  var l = save.length;
  var values = [];
  var loop;
  for (var i = 0; i < l; i++) {
    var chunk =  save[i];
    if (chunk[0] != 'loop_') continue;
    var keys = chunk[1];
    for (var j = 0; j<keys.length; j++) {
      var key = keys[j];
      if (typeof key != 'string') continue;
      if (key.toLowerCase() == tag) {
         loop =  chunk;
         break;
      }
    } 
    if (loop) break;
  }
  if (! loop) return null; // no attribute in this defn.

  var keys = loop[1];
  var list = loop[2]; // assuming no comment

  var keymap = {};
  var keylen = 0;
  for (var j = 0; j<keys.length; j++) {
    var key = keys[j];
    if (typeof key != 'string') continue;
    key = key.toLowerCase();
    keymap[key] = keylen++; 
  }
  var rows = [];
  var k = 0;
  var row = [];
  for (var j = 0; j < list.length; j++) {
    var value = list[j];
    if (typeof value == 'object' && value[0] =='@comment') continue;
    row.push(value);
    k++;
    if ( k >= keylen) {
      rows.push(row);
      row = [];
      k = 0;
    }
  }
  
  return {'map':keymap, 'rows':rows};
} 


/**
 * Define a base "class" for wrapping each of
 * DDL1, DDL2, DDL_star and DDLm
 * @constructor
 * @param dict {Array[]} The raw JSON data model of the dictionary.
 * @param logger {CifJs} Object/environment supplying logging methods
 */
function BaseDictWrapper(dict, logger) {
  this._blocks = [];
  this._data = null;
  this._ddl_version = null;
  this._save_mapping = {}; // override by sub classes 
  this._saves = {};
  this._root_cat = null;  // Category wrapped root node data
  this._categories = {};
  this._sub_categories = {};
  this._sub_cats = {};
  this._items = {};      // global dataItem lookup
  this._generics = {};   // these define multiple item categories in one frame 
  this._functions = {};   // these define dict specific global functions
  this._unresolvedCat = {}; // these have no cat defn in their save frame.
  this._rawDict = null;
  this._logger = null;
  if (arguments.length) { this._init(dict, logger); }
}
/**
 * BaseDict initialiser.
 * @param dict {Array} the dictionary data as a JSON Array of Arrays.
 * @param logger {CifJs} logging environment.
 * @return null
 */
BaseDictWrapper.prototype._init = function(dict, logger) {
  this._rawDict = dict;
  this._logger = logger;
  this._loadTime = new Date().getTime();
  // WTF???  these are not created afresh from  new BaseDictWrapper()??
  // but init IS called for each wrapped dict, sooooo....
  this._categories = {};
  this._items = {};      // global dataItem lookup
  this._saves = {};
  this._sub_categories = {};
  this._sub_cats = {};
  this._generics = {};   // these define multiple item categories in one frame 
  this._functions = {};   // these define dict specific global functions
  this._unresolvedCat = {}; // these have no cat defn in their save frame.
};
// add a reference to this "base" class.
BaseDictWrapper.prototype.constructor = BaseDictWrapper;
/*
 * Common interface methods for all derived wrappers
 */

/**
 * @memberof BaseDictWrapper.prototype
 * @param name {string} _definition.id
 * @return {ItemDefn}
 */
BaseDictWrapper.prototype.hasItem = function(name) {
  return this._items[name];
};

/**
 * @memberof BaseDictWrapper.prototype
 * @param name {string} _definition.id
 * @return {ItemDefn}
 */
BaseDictWrapper.prototype.getItemDefn = function(name) {
  return this._items[name];
};

/**
 * @memberof BaseDictWrapper.prototype
 * @param name {string} _definition.id
 * @return {ItemDefn}
 */
BaseDictWrapper.prototype.getItem = function(name) {
  // deprecate this func.
  return this.getItemDefn(name); 
};

/**
 * Add an ItemDefn to this dictionary.
 * @memberof BaseDictWrapper.prototype
 * @param name {string} _definition.id
 * @param item {ItemDefn}
 * @return {ItemDefn}
 */
BaseDictWrapper.prototype.addItem = function(name, item) {
  this._items[name] = item;
  item._loadTime = this._loadTime; 
  return item;
};

/**
 * Does the category name exist in this dictionary?
 * @memberof BaseDictWrapper.prototype
 * @param name {String} _definition.id string
 * @return {CatDefn}
 */
BaseDictWrapper.prototype.hasCategory = function(name) {
  return this._categories[name];
};
/**
 * Does the category name exist in this dictionary?
 * @memberof BaseDictWrapper.prototype
 * @param name {String} _definition.id string
 * @return {CatDefn}
 */
BaseDictWrapper.prototype.getCategory = function(name) {
  return this._categories[name];
};

/**
 * Add an CatDefn to this dictionary.
 * @memberof BaseDictWrapper.prototype
 * @param name {string} _definition.id
 * @param item {CatDefn}
 * @return {CatDefn}
 */
BaseDictWrapper.prototype.addCategory = function(name, cat) {
  this._categories[name] = cat;
  cat._loadTime = this._loadTime; 
  return cat;
};

/**
 * Get the entire {CatDefn} Hashtable from this dictionary. 
 * @memberof BaseDictWrapper.prototype
 * @return {Object}
 */
BaseDictWrapper.prototype.getCategories = function() {
  return this._categories; // not even a copy???
};

/**
 * This is hack1 for HierarchyView to make dic and cif equivalent.
 * @memberof BaseDictWrapper.prototype
 * @return {JSON} the raw data structure as a JSON  List
 */  
BaseDictWrapper.prototype.getBlocks = function() {
  return this._rawDict;  // this is a hack to make dic and cif compatible
};
 
/**
 * This is hack2 for HierarchyView to make dic and cif equivalent.
 * @memberof BaseDictWrapper.prototype
 * @return {String} 'data_' - for a cif it could be 'global_' also.
 */
BaseDictWrapper.prototype.getType = function() {
  return 'data_' ; // global_ or data_ for CIF file  
};

/**
 * This is hack3 for HierarchyView to make dic and cif equivalent.
 * @memberof BaseDictWrapper.prototype
 * @return {String} the _definition.id of the dictionary.
 */
BaseDictWrapper.prototype.getName = function() {
  var blocks = this._rawDict;
  for (var i = 0; i < blocks.length; i++) {
    if ( blocks[i][0]!='data_') continue;
    return blocks[i][1];
  }
  return null;
};

/**
 * This is hack4 for HierarchyView to make dic and cif equivalent.
 * Get attributes corresponding to the dictionary level data_block blockId
 * @memberof BaseDictWrapper.prototype
 * @param blockId {String} 
 * @return {Array}
 */
BaseDictWrapper.prototype.getBlockAttributes = function(blockId) {
  var blocks = this._rawDict;
  var attribs = [];
  for (var i = 0; i < blocks.length; i++) {
    if ( blocks[i][0]!='data_') continue;
    if (blocks[i][1] != blockId) continue; 
    var data = blocks[i][2];
    for (var j = 0; j < data.length; j++) {
      // this._log(data[j][0] + " : " + data[j][1]);     
      if (data[j][0] != 'save_') attribs.push(data[j]);
    }
    break;
  }

  //var dummy_item = new ItemDefn(blockId);
  //dummy_item._save = attribs
  //dummy_item._data = this._wrapAttributes(attribs, this);
  return   this._wrapAttributes(attribs, this);
};


/**
 * This is  a callback for when a dictionary level attribute is edited by
 * the user. This has no effect currently.
 * @memberof BaseDictWrapper.prototype
 * @param attributeName (String} _attribute.id
 * @param reason {String}
 * @return null
 */
// hack5 for HierarchyView 
BaseDictWrapper.prototype.modelChangedEvent = function(attributeName, reason) {
  // the item "name"  has changed through  direct user interaction
//  this._loadTime = new Date().getTime();
  alert ("changed dict attribute " + attributeName );
};


/**
 * @memberof BaseDictWrapper.prototype
 * @return {Object} the internal hashtable of top level categories.
 */
BaseDictWrapper.prototype.getSubCats = function() {
  return this._sub_cats;
};

/**
 * dummy to emulate a CatDefn
 * @memberof BaseDictWrapper.prototype
 * @return {Object} undefined
 */
BaseDictWrapper.prototype.getItems = function() {
  return ;
};
/**
 * dummy to emulate a CatDefn
 * @memberof BaseDictWrapper.prototype
 * @return {Object} undefined
 */
BaseDictWrapper.prototype.getAttributes = function() {
  return ;
};


/**
 * Get the dictionary prefix for HTML IDs - a fudge for the DDL
 * @memberof BaseDictWrapper.prototype
 * @param tag {String} ignored
 * @return {String} 'xxx'
 */
BaseDictWrapper.prototype.getItemDictPrefix = function(tag) {
  return 'xxx';  // dummy fudge for DDL
};

/**
 * A hack to support HierarchyView
 * @memberof BaseDictWrapper.prototype
 * @return null
 */
BaseDictWrapper.prototype.getUnresolved = function() {
  return null;  // or a list
};

/**
 * Wrap a JSON attribute for adding to a definition.
 * @memberof BaseDictWrapper.prototype
 * @param frag {Array} JSON fragment
 * @param block {DefnBase} where the attribute belongs
 * @return {ItemCtrlr}
 */
BaseDictWrapper.prototype._newAttribute = function(frag, block) {
  return new ItemCtrlr(frag, block);
};

/**
 * Wrap a JSON loop_ for adding to a definition.
 * @memberof BaseDictWrapper.prototype
 * @param frag {Array} JSON fragment
 * @param block {DefnBase} where the loop_ belongs
 * @return {ItemCtrlr}
 */
BaseDictWrapper.prototype._newLoop = function(frag, block) {
  return new LoopCtrlr(frag, block);
};

/**
 * Wrap a JSON #comment for adding to a definition.
 * @memberof BaseDictWrapper.prototype
 * @param frag {Array} JSON comment fragment
 * @return {ItemCtrlr}
 */
BaseDictWrapper.prototype._newComment = function(frag) {
  return {'_data' : frag, '_view':null };
};

/**
 * Convert a CIF item value to a string.
 * @memberof BaseDictWrapper.prototype
 * @param text {Array} to which more text will be appended.
 * @param value {Object} a possibly complex object to be rendered to a string value.
 * @return null
 */
BaseDictWrapper.prototype._renderItemValue = function(text, value) {
  if (typeof value === 'string' ) { 
    if (value.match(/[\n\r\f]/)) {
      text.push('\n;');
      text.push(value);
      text.push('\n;');
      return;
    }
    if (!value.match(/[ \t]/)) {
//      this._log("no space for " + value);
      text.push(value);
      return;
    }
    if (!value.match(/'/)) {
      text.push('\"');
      text.push(value);
      text.push('\"');
      return;
    }
    if (!value.match(/"/)) {
      text.push("\'");
      text.push(value);
      text.push("\'");
      return;
    }
    text.push(value);
  }
  else if (typeof value == 'number') {
    //text.push("" + value);
    text.push(numeric.prettyPrint(value).trim());
  }
  else if (value instanceof numeric.T) {
    if (value.x) 
      //text.push("" + value.x );
      text.push(numeric.prettyPrint(value.x).trim());
    if (value.y){ 
      if (value.y<0.) text.push("-");
      else            text.push("+");
      // text.push("i" + Math.abs(value.y));
      text.push("i");
      text.push(numeric.prettyPrint(Math.abs(value.y)).trim());

    }
    if (! value.x && ! value.y) text.push("0.");
  }
  else if (value instanceof Array) {
    if (numeric) {
      text.push(numeric.prettyPrint(value));
    } else {
      text.push('[');
      for (var i = 0; i <value.length; i++) { 
        if (i) text.push(', ');
        this._renderItemValue(text, value[i]) ;
      }
      text.push(']');
   }
  }
  else {
    text.push('{');
    var i = 0;
    for (var key in value) {
      if (i) text.push(', ');
      this._renderItemValue(text, key); 
      text.push(':');
      this._renderItemValue(text, value[key]); 
      i++;
    }
    text.push('}');
  }

};

/**
 * a helper method to generate MVC controller classes for the 
 * dictionary to enable in-browser editing.
 * @memberof BaseDictWrapper.prototype
 * @param data {Array} JSON list of Defn attributes 
 * @param src {DefnBase} parent
 * @return {Array} of wrapped attributes.
 */
BaseDictWrapper.prototype._wrapAttributes = function(data, src) {
  var chunks = [];
  for (var j = 0; j< data.length; j++) {
    var chnk = data[j];
    if (chnk[0] == 'item_' ) {
      item_name = chnk[1];
      frag = this._newAttribute(chnk, src); // add ref to current block 
      chunks.push(frag);
    }
    if (chnk[0] == 'loop_' ) {
      var keys = chnk[1];
      frag = this._newLoop(chnk, src);
      chunks.push(frag);
    }
  } 
  return chunks;
};

/**
 * Get a dictionary level attribute
 * @memberof BaseDictWrapper.prototype
 * @param name {String} attribute name
 * @return {Object}
 */
BaseDictWrapper.prototype.getAttribute = function(name) {
  var block = this._getFirstDataBlock(this._rawDict);
  var ret =  this._getAttribute(name, block[2]);
  return ret;
};

/**
 * get the DDL version of this dictionary instance
 * @memberof BaseDictWrapper.prototype
 * @param rawJSONDict {Array} JSON representation of a dictionary.
 * @return {String}
 */
BaseDictWrapper.prototype.getDDLVersion = function(rawJSONDict) {
  var block = BaseDictWrapper.prototype._getFirstDataBlock(rawJSONDict);

  if (! block) return null;
  var data = block[2];
  for (var i = 0; i <data.length; i++) {
    var chunk = data[i];
    if (chunk[0] == 'item_') {
      var name = chunk[1];
      if (name == '_dictionary_name') {
        return 'DDL1';
      }
      if (name == '_datablock.id') {
        return 'DDL2';
      }
      if (name == '_definition.id') {
        return 'DDL_star';
      }
      if (name == '_dictionary.ddl_conformance') {
        return 'DDLm';
      }
    }
    // ddl_star has no data items in dict level data block
    if (chunk[0] == 'save_') {
      var d = chunk[2];
      for (var j = 0; j <d.length; j++) {
        var chnk = d[j];
        if (chnk[0] == 'item_') {
          var name = chnk[1];
          if (name == '_definition.id') {
            return 'DDL_star';
          }
        }
      }
    }
  }
  return null;
};

/**
 * Return the hierarchy of ancestors of the _item.name as a list.
 * @param item_name {String} _definition.id of the required item.
 * @param prefix {String}  unused.
 * @return {Array}
 */
BaseDictWrapper.prototype.getItemPath = function(item_name, prefix) {
  var item = this._items[item_name.toLowerCase()]; // wrapped Item object
  if (! item) return null;
  var parnt = item;
  var list = [item._name.toLowerCase()]; // de-aliased
  while (parnt._category) {
    list.push(parnt._category._name.toLowerCase());   
    parnt = parnt._category;
  }
  return list; 
};

/**
 * @memberof BaseDictWrapper.prototype
 * @param cat_name {String} _definition.id of category
 * @return {Array} A list of category name strings.
 */
BaseDictWrapper.prototype.getCategoryPath = function(cat_name) {
  var cat = this._categories[cat_name.toLowerCase()]; // wrapped Item object
  if (! cat) return null;
  var parnt = cat;
  var list = [cat._name.toLowerCase()]; // de-aliased
  while (parnt._category) {
    list.push(parnt._category._name.toLowerCase());   
    parnt = parnt._category;
  }
  return list; 
};


BaseDictWrapper.prototype._log = function(data) {
  if (this._logger) this._logger.info(data); 
};
BaseDictWrapper.prototype.debug = function(data) {
  if (this._logger) this._logger.debug(data); 
};
BaseDictWrapper.prototype.info = function(data) {
  if (this._logger) this._logger.info(data); 
};
BaseDictWrapper.prototype.warn = function(data) {
  if (this._logger) this._logger.warn(data); 
};
BaseDictWrapper.prototype.error = function(data) {
  if (this._logger) this._logger.error(data); 
};


BaseDictWrapper.prototype.dumpCats = function() {
  var cats = this._sub_cats;
  for (var chunk in cats) {
    this.info(chunk);
    var keys = []; 
    var cat = cats[chunk];
    for (var key in cat._sub_cats) {
      keys.push(key);
    }
    this.info("subs  : " + keys);
    keys = []; 
    for (var key in cat._items) {
      keys.push(key);
    }
    this.info("items : " + keys);
  }
};

/**
 * Retrieve the first non-comment data_ block that hopefully holds the
 * dictionary declaration. This is an assumption made at a time when 
 * we don't actually know which DDL version we are dealing with yet.
 * @memberof BaseDictWrapper.prototype
 * @param raw {Array} in memory representation of the JSON dictionary.
 * @return {Array} JSON definition data
 */
BaseDictWrapper.prototype._getFirstDataBlock = function(raw) {
  //var raw = this._rawDict;
  for (var i = 0; i < raw.length; i++) {
    var chunk = raw[i];
    if (chunk[0] == 'data_') {
      return chunk;
    }
  }
  return null;
};

/**
 * Get the class, or type, of the save_ frame
 * @memberof BaseDictWrapper.prototype
 * @param save {Array} the JSON array representing a save_ frame.
 * @param save_mapping {Object} hashtable
 * @return {String}
 */
BaseDictWrapper.prototype._getSaveClass = function(save, save_mapping) {
  var l = save.length;
  for (var i = 0; i < l; i++) {
    var chunk = save[i];
    var type = chunk[0];
    if (type == 'item_') {
      var attrib = chunk[1];
      if (attrib in save_mapping) {
         var klass = save_mapping[attrib]; 
         if (typeof klass == 'string') return klass; // 99% of cases 
         // the conditional exception - klass is a hashtable
         var val = chunk[2].toLowerCase();
         if (val in klass) {
           return klass[val]; 
         } 
         return klass['*']; // '*' is a wild card, for alternative to exception
      }
    } 
  }
  return "unknown";
};

/**
 * Return a list of a particular item from a loop_ structure, with 
 * possible embedded comments.
 * @memberof BaseDictWrapper.prototype
 * @param index
 * @param columns
 * @param list
 * @return  {Array} of value objects
 */
BaseDictWrapper.prototype._getListField = function(index, columns, list) {
  var l = list.length;
  var j = 0;
  var values = [];
  for (var i = 0; i < l; i++) {
    var e = list[i];
    if (typeof e != 'string') {
      continue;
    }
    if (j == index) values.push(e); 
    j = ++j % columns;
  }
  return values;
};

/**
 * Return a single value from an attribute in a save_frame
 * @memberof BaseDictWrapper.prototype
 * @param name {String} the DDL attribute required.
 * @param save {Array} JSON save frame data
 * @return {Object} the value from the key value pair.
 */
BaseDictWrapper.prototype._getAttribute = function(name, save) {
  var l = save.length;
  var j = 0;
  var values = [];
  for (var i = 0; i < l; i++) {
    var chunk =  save[i];
    if (chunk[0] != 'item_') continue;
    if (chunk[1] == name) return chunk[2];
  }
  return null;
};
/**
 * Return the JSON array holding a key-value attribute from a save_frame
 * @memberof BaseDictWrapper.prototype
 * @param name {String} name of a DDL attribute appearing in the definition.
 * @param save {Array[]} JSON for definition save_ frame.
 * @return {Array} 
 */

BaseDictWrapper.prototype._getAttributeRef = function(name, save) {
  var l = save.length;
  var j = 0;
  var values = [];
  for (var i = 0; i < l; i++) {
    var chunk =  save[i];
    if (chunk[0] != 'item_') continue;
    if (chunk[1] == name) return chunk;
  }
  return null;
};

/**
 * Return a list of values from a save_frame loop
 * @memberof BaseDictWrapper.prototype
 * @param name {String} the DDL attribute name.
 * @param save {Array} the save_ frame definition.
 * @return {Object[]} an Array of values for an attribute in a loop_
 */
BaseDictWrapper.prototype._getList = function(name, save) {
  var l = save.length;
  var values = [];
  for (var i = 0; i < l; i++) {
    var chunk =  save[i];
    if (chunk[0] != 'loop_') continue;
    var keys = chunk[1];
    index = this._indexOf(keys, name);   
    if (index >= 0) { 
      var key_count =  this._countKeys(keys);
      var values = this._getListField(index, key_count, chunk[2]);  
      return values;
    }
  }
  return null;
};

/**
 * Return a list of tuples of particular items from a loop_ structure, with 
 * possible embedded comments.
 * @memberof BaseDictWrapper.prototype
 * @param indices
 * @param columns
 * @param list
 * @return {Array[]} an array of rows
 */
BaseDictWrapper.prototype._getListFields = function(indices, columns, list) {
  var l = list.length;
  var j = 0;
  var values = [];
  var k = indices.length-1;
  var n = -1;
  for (var i = 0; i < l; i++) {
    var e = list[i];
    if (typeof e != 'string') {
      continue;
    }
    for (var m = 0; m <= k; m++) {
      if (j == indices[m]) {
        if (m == 0) { 
          values.push([e]);  // start new row
          n++;
        } 
        else {
          values[n].push([e]); // append to current row
        }
        break;
      }
    }
    j = ++j % columns;
  }
  return values;
};

/**
 * Count non-comments in list of tags
 * @memberof BaseDictWrapper.prototype
 * @param list {Array} a list of keys from a loop_ construct.
 * @return {Integer}
 */
BaseDictWrapper.prototype._countKeys = function(list) {
  var l = list.length;
  var k = 0;
  for (var i = 0; i < l; i++) {
    var e = list[i];
    if (typeof e != 'string') {
      continue;
    }
    k++;
  } 
  return k;
};

/**
 * Get index of given key in loop tag list, but ignoring comments.
 * @memberof BaseDictWrapper.prototype
 * @param list {Array} of keys.
 * @param key {String} attribute name.
 * @return {Integer}
 */
BaseDictWrapper.prototype._indexOf = function(list, key) {
  var l = list.length;
  var k = 0;
  for (var i = 0; i < l; i++) {
    var e = list[i];
    if (typeof e != 'string') {
      continue; 
    }
    if (e === key) return k;
    k++;
  }
  return -1;
};

/**
 * Check all {ItemDefn}s for aliases and build into the Defn list.
 * @memberof BaseDictWrapper.prototype
 * @param alias_tag {String} the DDL specific tag for aliases
 * @return null
 */
BaseDictWrapper.prototype._buildAliases = function(alias_tag) {
  if (!alias_tag) return;
  var cnt = 0;
  for (var key in this._items) {
    var item = this._items[key];
    var save = item._save; 
    cnt += this._buildItemAliases(this, alias_tag, item, save, key); 
  }
  this.info("Resolved " + cnt + " aliases");
};


BaseDictWrapper.prototype._buildItemAliases = function(dict, alias_tag, item, save, key) {
    var cnt = 0; 
    var aliaslist = [];
    var alias = dict._getAttribute(alias_tag, save);
    if (alias) {
      aliaslist.push(alias);
    } else {
      aliaslist = dict._getList(alias_tag, save);  
    }

    if (aliaslist && aliaslist.length>0 ) {
      item._aliases = [ ];
      for (var i = 0; i < aliaslist.length; i++) {
        var aliasid = aliaslist[i].toLowerCase();
        if (key == aliasid) continue; // skip dup for 2014 revision
        item._aliases.push(aliasid);

        if ( aliasid in dict._items) {
          // pre referenced.
          var altref = dict._items[aliasid];
          if (altref instanceof Array) {
            dict._items[aliasid].push(item);
          } else {
            dict._items[aliasid] = [altref, item];
          }
          altref = dict._items[aliasid];
          var str = "";
          for (var j=0; j< altref.length; j++) {
             str = str + altref[j]._name + ", ";
          }
          dict.error("Duplicated aliases for "+aliasid + " to "  + str);
          dict._items[aliasid] = altref[0]; // undo it all!!!!
          
        } else {
          dict._items[aliasid] = item;// multiple references to same object 
          cnt++;
        }
      } 
    }
  return cnt;
};


/**
 * Customisation to handle DDL1 dictionaries. Sub class of BaseDict
 * @constructor
 * @augments {BaseDictWrapper}
 * @param dict {Array[]} JSON representation of DDL1 dictionary 
 * @param logger {CifJs}
 */
// Parasitic inheritance
function DDL1Ctrlr(dict, logger) {
  if (arguments.length) { this._init(dict,logger); }
  this._ddl_version = "DDL1"; 
  this._save_mapping = { 
    '_type_conditions': 'ITEM',
    '_enumeration_range': 'ITEM',
    '_list': 'ITEM',
    '_list_reference': 'ITEM',
    '_units': 'ITEM',
    '_item_sub_category.id': 'ITEM'
  };
  this._ddl_map = {
    '_alias_tag' : '_related_item' 
  };
  for (var key in this._ddl_map) {
    this[key] = this._ddl_map[key];
  }
  this._buildIndices();
}

// we add our own extensions to this BaseDictWrapper instance
DDL1Ctrlr.prototype = new BaseDictWrapper();

DDL1Ctrlr.prototype._init = function(dict, logger) {
  this.__tmpinit = BaseDictWrapper.prototype._init;
  // now Dict constructor thinks it belongs to DDL1
  this.__tmpinit(dict, logger);
};



/**
 * Override basic construction of in memory dictionary.
 * @memberof DDL1Ctrlr.prototype
 * @return null
 */
DDL1Ctrlr.prototype._buildIndices = function() {
  //var data = this._getFirstDataBlock(this._rawDict);
  this._findCategories(this._rawDict);
//  this._fixUnresolved();
  this.info("items       " +  Object.keys(this._items).length);
  this.info("categories   " +  Object.keys(this._categories).length);
  this.info("generics    " +  Object.keys(this._generics).length);
  if (Object.keys(this._unresolvedCat).length > 0) {
    this.warn("unresolved  " +  Object.keys(this._unresolvedCat).length);
  }
  else  {
    this.info("unresolved  " +  Object.keys(this._unresolvedCat).length);
  }
//  this._buildAliases(this._alias_tag);
  this.info("with aliases " +  Object.keys(this._items).length);
//  this.dumpCats();
};

/**
 * Build a useful/functional data structure from the raw JSON.
 * @param data
 * @return null
 */
DDL1Ctrlr.prototype._findCategories = function(data) {
  var l = data.length;
  this.info("save frames, comments and dict level items " + l);
  var SAVE = 0, ITEM = 0, COMMENT = 0, DUPES = 0;
  for (var i = 0; i < l; i++) {
    var chunk = data[i];
    var type = chunk[0];
 
    if (type == 'data_') {
      SAVE++;
      var save_class = this._getSaveClass(chunk[2], this._save_mapping);
      if (save_class != 'ITEM') {
        var dtype = this._getAttribute('_type', chunk[2]);
        if (dtype && dtype != 'null') {
          save_class = 'ITEM';
        }
      }

      if (save_class != 'ITEM') {
        // save_frame is a category
        var catid = this._getAttribute('_name', chunk[2]);
        if (! catid) {
           // its a dict level defn. 
           catid = this._getAttribute('_dictionary_name', chunk[2]);
        } 
        if (! catid) {
           this.warn("Unexpected dict data_ item : " + chunk);
           continue;
        }

        var cat = new CatDefn(catid);
        cat._save = chunk[2];
        cat._data = this._wrapAttributes(chunk[2], cat);
        this.info("creating Cat : " + catid);
        var parent_cat = this._getAttribute('_category', chunk[2]);
        this.info("parent Cat : " + parent_cat);
        if (parent_cat == 'category_overview') {
          this._sub_cats[catid] = cat; // child cats
          //this._categories[catid] = cat; 
          this.addCategory(catid, cat);     //list of all cats
          continue;
        } 
        // this.info("no parent? : " + parnt);
        
        if (parent_cat in this._sub_cats) {
            cat._category = parent_cat; // point up
            var parnt = this._categories[parent_cat];
            parnt._sub_cats[catid] = cat; // child cats
            //this._categories[catid] = cat;      //list of all cats
            this.addCategory(catid, cat);     //list of all cats
            continue;
        } 
        if (parent_cat in this._categories) {
            var parnt = this._categories[parent_cat];
            cat._category = parnt; // point up
            parnt._sub_cats[catid] = cat;   // child of sub cat
            //this._categories[catid] = cat;      //list of all cats
            this.addCategory(catid, cat);     //list of all cats
            continue;
        }
        this.warn("Unexpected cat group order: " + catid + " for " + chunk[1]);
      } 
      else if (save_class == 'ITEM') {
        // save_frame is an item_
        var itemid = this._getAttribute('_name', chunk[2]);
        var items;
        if ( itemid ) {
          items = [itemid];
        }
        else {
          // multiple item declaration.
          var items = this._getList('_name', chunk[2]);  
        }
        if (items) {
          for (var j = 0; j< items.length; j++) { 
            var itemid = items[j];
            var item = new ItemDefn(itemid);
            item._save = chunk[2];
            item._data = this._wrapAttributes(chunk[2], item);
            var catid = this._getAttribute('_category', chunk[2]); 
//            this.info( "checking " + itemid  + " for " +catid)
            if (catid) {
              var cat = this._categories[catid];
              if (!cat) { cat = this._categories[catid + "_[]"];} //STUPID CRAP!
              if (!cat) { cat = this._categories["_" + catid + "_[]"];} //STUPID CRAP!
              var item_name = itemid.toLowerCase();
              cat._items[item_name] = item;
              item._category = cat; // add ref to parent
              if (item_name in this._items) DUPES++;
              // this._items[item_name] = item;     // add to global item lookup list
              this.addItem(item_name, item);
            }
            else {
              this._unresolvedCat[chunk[1]] = item; 
              this.warn(" Crazy no cat item for save_ " + chunk[1]);
            }
          }
        }
        else {
          this._generics[chunk[1]] = chunk;
          // this.warn(" Crazy loop for save_ " + chunk[1]);
        }
  
      } 
      else {
        this.warn(" No details for data_ " + chunk[1]);
        //throw new Error("Unrecognised save_ frame type " + chunk );
      }
    } // end of 'save_'
    else {
      COMMENT++;
    } 
  }  // end of loop over data contents
  this.info("save frames "+SAVE + ", dict level items " + ITEM);
  this.info("comment + dict items "+COMMENT );
  this.info("DUPES       "+DUPES );
  var xxx = Object.keys(this._unresolvedCat).length;
  if (xxx > 0) {
    this.warn("unresolved "+xxx);
  } else {
    this.info("unresolved "+xxx);
  }
};


/**
 * @memberof DDL1Ctrlr.prototype
 * @return null
 */
DDL1Ctrlr.prototype._fixUnresolved = function() {
  this.info("Resolving distributed defns");
  for (var key in this._generics) {
    var save = this._generics[key];
    var data = save[2];
    l = data.length;
    this.debug("Checking generic " + save[1]);
    for (var i = 0; i < l; i++) {
      var chunk = data[i];
      var type = chunk[0];
      if (type == 'loop_') {
        var keys = chunk[1];
        var key_count =  this._countKeys(keys);

        // check for group_list loop
        var index = this._indexOf(keys, '_item.name');
        if (index >= 0) {
          var index2 = this._indexOf(keys, '_item.category_id');
          var items = this._getListFields([index,index2], key_count, chunk[2]);
          for (var ii=0; ii < items.length; ii++) {
            var pair = items[ii];
            var item_name = pair[0];
            var item_cat = pair[1];
            if (item_name in this._items) {
              // multiple defns of item category???
              var item = this._items[item_name];
              // should we check for multiple defns ??
              item._generic = save; // circular reference. this will bite us!
              continue;
            }
            if (item_name == save[1]) {
              // generic defines itself.
              this.debug("self Defn for " + item_name);
              if (item_cat in this._categories) {
                this.debug("got cat " + item_cat);
                var item = new ItemDefn(item_name);
                item._save = data;
                item._data = this._wrapAttributes(data, item);
                // this._items[item_name] = item;
                this.addItem(item_name, item);
                // success 
                item._generic = save;   // circular reference. this will bite us!
                var cat = this._categories[item_cat];
                cat._items[item_name] = item;
                item._category = cat; // add ref to parent
                continue;
              }
              this.warn("No cat " + item_cat + " for " +item_name);
              
            }
            if (item_name in this._unresolvedCat) {
              var item = this._unresolvedCat[item_name];

              if (item_cat in this._categories) {
                // success 
                delete this._unresolvedCat[item_name];
                item._generic = save;   // record to point back to
                var cat = this._categories[item_cat];
                cat._items[item_name] = item;
                item._category = cat; // add ref to parent
                // this._items[item_name] = item;
                this.addItem(item_name, item);
                continue;
              }
              // else no cat match
              this.warn("Crazy no cat for item " + item_name + " in " +save[1] );
            }
            this.warn("Crazy undefined item in loop " + item_name + " in " + save[1]);
            
          }
        }
      }
    }
  }
  for (var name in this._unresolved) {
    this.warn("as yet unresolved " + name);
  }
};




/**
 * Customisation to handle DDL2 dictionaries.
 * @constructor
 * @augments {BaseDictWrapper}
 * @param dict {Array[]} JSON representation of DDL1 dictionary 
 * @param logger {CifJs}
 */

// Parasitic inheritance
function DDL2Ctrlr(dict, logger) {
  if (arguments.length) { this._init(dict,logger); }
  this._ddl_version = "DDL2"; 
  this._save_mapping = { 
    '_category.description': 'CATEGORY',
    '_category.id': 'CATEGORY',
    '_item_description.description': 'ITEM',
    '_item.name': 'ITEM',
    '_item.category_id': 'ITEM',
    '_item_sub_category.id': 'ITEM'
  };
  this._ddl_map = {
    '_alias_tag' : '_item_aliases.alias_name'
  };
  for (var key in this._ddl_map) {
    this[key] = this._ddl_map[key];
  }

  if (dict)
    this._buildIndices();
}

// we add our own extensions to this BaseDictWrapper instance
DDL2Ctrlr.prototype = new BaseDictWrapper();

/**
 * @memberof DDL2Ctrlr.prototype
 * @return null
 */
DDL2Ctrlr.prototype._init = function(dict, logger) {
  this.__tmpinit = BaseDictWrapper.prototype._init;
  // now Dict constructor thinks it belongs to DDL2
  this.__tmpinit(dict, logger);
};

/**
 * @memberof DDL2Ctrlr.prototype
 * @return null
 */
DDL2Ctrlr.prototype._buildIndices = function() {
  var data = this._getFirstDataBlock(this._rawDict);
  this._findCategories(data[2]);
  this._fixUnresolved();
  this.info("items       " +  Object.keys(this._items).length);
  this.info("categories   " +  Object.keys(this._categories).length);
  this.info("generics    " +  Object.keys(this._generics).length);
  this.warn("unresolved  " +  Object.keys(this._unresolvedCat).length);
  this._buildAliases(this._alias_tag);
  this.info("with aliases " +  Object.keys(this._items).length);
};


/**
 * Build a useful/functional data structure from the raw JSON.
 * @memberof DDL2Ctrlr.prototype
 * @return null
 */
DDL2Ctrlr.prototype._findCategories = function(data) {
  var l = data.length;
  this.info("save frames, comments and dict level items " + l);
  var SAVE = 0, ITEM = 0, COMMENT = 0, DUPES = 0;
  for (var i = 0; i < l; i++) {
    var chunk = data[i];
    var type = chunk[0];
    if (type == 'loop_') {
      ITEM++;
      var keys = chunk[1];
      var key_count =  this._countKeys(keys);
      // check for sub_cat loop_
      var index = this._indexOf(keys, '_sub_category.id');   
      if (index >= 0) { 
        var subcats = this._getListField(index, key_count, chunk[2]);  
        continue;
      } 
      // check for group_list loop
      index = this._indexOf(keys, '_category_group_list.id');   
      if (index >= 0) { 
        var index2 = this._indexOf(keys, '_category_group_list.parent_id');   
        var topcats = this._getListFields([index,index2], key_count, chunk[2]);  
        for (var ii=0; ii < topcats.length; ii++) {
          var pair = topcats[ii];
          var name = pair[0], parnt = pair[1];
          if (parnt == '.') {
            // this is toplevel -- 'inclusive_group' 
            continue;
          }
          if (parnt == 'inclusive_group') {
            var cat =  new CatDefn(name);
            // point up is null
            this._sub_cats[name] = cat; // child cats
            //this._categories[name] = cat;      //list of all cats
            this.addCategory(name, cat);     //list of all cats
            continue;
          }
          if (parnt in this._sub_cats) {
            var cat =  new CatDefn(name);
            cat._category = parnt; // point up
            this._sub_cats[parnt] = cat; // child cats
            //this._categories[name] = cat;      //list of all cats
            this.addCategory(name, cat);     //list of all cats
            continue;
          } 
          if (parnt in this._categories) {
            var cat =  new CatDefn(name);
            cat._category = parnt; // point up
            parnt = this._categories[parnt]; 
            parnt._sub_cats[name] = cat;   // child of sub cat
            //this._categories[name] = cat;      //list of all cats
            this.addCategory(name, cat);     //list of all cats
            continue;
          }
          throw new Error("Unrecognised category group: " + parnt + "  for cat " + name);
        }
        // done the item/loop  
        continue;
      } 
    }
    else if (type == 'save_') {
      SAVE++;
      var save_class = this._getSaveClass(chunk[2], this._save_mapping);
      if (save_class == 'CATEGORY') {
        // save_frame is a category
        var catid = this._getAttribute('_category.id', chunk[2]);
        var groups = this._getList('_category_group.id', chunk[2]); 
        var cat = new CatDefn(catid);
        cat._save = chunk[2];
        cat._data = this._wrapAttributes(chunk[2], cat);
        // here we asume the group order is from root to leaves
        // It isn't always the case.
        var last_cat = groups[groups.length-1];
        //this.info(groups);
        var parn = this._categories[last_cat];
        if (! parn) {
          this.warn("Unexpected cat group order: " + groups + " for " + chunk[1]);
          parn = this._categories[groups[groups.length-2]];
        }
        parn._sub_cats[catid] = cat;         // add to sub cat list  
        cat._category = parn;                // add ref to parent
        //this._categories[catid] = cat;       // list of all cats
        this.addCategory(catid, cat);     //list of all cats
      } 
      else if (save_class == 'ITEM') {
        // save_frame is an item_
        var itemid = this._getAttribute('_item.name', chunk[2]);
        if (! itemid ) {
          // not a stand-alone item declaration.
          // check if maybe its a single defn, but defined in a loop
          var list = this._getList('_item.name', chunk[2]);  
          if (list && list.length == 1) {
            itemid = list[0]; 
          }
        }
        if (itemid ) {
          var item = new ItemDefn(itemid);
          item._save = chunk[2];
          item._data = this._wrapAttributes(chunk[2], item);
          var catid = this._getAttribute('_item.category_id', chunk[2]); 
          if (!catid) {
            // not a stand-alone item declaration.
            // check if maybe its a single defn, but defined in a loop
            var list = this._getList('_item.category_id', chunk[2]);  
            if (list && list.length == 1) {
              catid = list[0]; 
            }
          }
          if (catid) {
            var cat = this._categories[catid];
            var item_name = itemid.toLowerCase();
            cat._items[item_name] = item;
            item._category = cat; // add ref to parent
            if (item_name in this._items) DUPES++;
            // this._items[item_name] = item; // add to global item lookup list
            this.addItem(item_name, item);
          }
          else {
            this._unresolvedCat[chunk[1]] = item; 
            // this.warn(" Crazy no cat item for save_ " + chunk[1]);
          }
        }
        else {
          this._generics[chunk[1]] = chunk;
          // this.warn(" Crazy save loop for save_ " + chunk[1]);
        }
  
      } 
      else {
        this.warn(" No _item.name for save_ " + chunk[1]);
        //throw new Error("Unrecognised save_ frame type " + chunk );
      }
    } // end of 'save_'
    else {
      COMMENT++;
    } 
  }  // end of loop over data contents
  this.info("save frames "+SAVE + ", dict level items " + ITEM);
  this.info("comment + dict items "+COMMENT );
  this.info("DUPES       "+DUPES );
  this.warn("unresolved "+Object.keys(this._unresolvedCat).length );
};


/**
 * @memberof DDL2Ctrlr.prototype
 * @return null
 */
DDL2Ctrlr.prototype._fixUnresolved = function() {
  this.info("Resolving distributed defns");
  for (var key in this._generics) {
    var save = this._generics[key];
    var data = save[2];
    l = data.length;
    this.debug("Checking generic " + save[1]);
    for (var i = 0; i < l; i++) {
      var chunk = data[i];
      var type = chunk[0];
      if (type == 'loop_') {
        var keys = chunk[1];
        var key_count =  this._countKeys(keys);

        // check for group_list loop
        var index = this._indexOf(keys, '_item.name');
        if (index >= 0) {
          var index2 = this._indexOf(keys, '_item.category_id');
          var items = this._getListFields([index,index2], key_count, chunk[2]);
          for (var ii=0; ii < items.length; ii++) {
            var pair = items[ii];
            var item_name = pair[0];
            var item_cat = pair[1];
            if (item_name in this._items) {
              // multiple defns of item category???
              var item = this._items[item_name];
              // should we check for multiple defns ??
              item._generic = save; // circular reference. this will bite us!
              continue;
            }
            if (item_name == save[1]) {
              // generic defines itself.
              this.debug("self Defn for " + item_name);
              if (item_cat in this._categories) {
                this.debug("got cat " + item_cat);
                var item = new ItemDefn(item_name);
                item._save = data;
                item._data = this._wrapAttributes(data, item);
                // this._items[item_name] = item;
                this.addItem(item_name, item);
                // success 
                item._generic = save;   // circular reference. this will bite us!
                var cat = this._categories[item_cat];
                cat._items[item_name] = item;
                item._category = cat; // add ref to parent
                continue;
              }
              this.warn("No cat " + item_cat + " for " +item_name);
              
            }
            if (item_name in this._unresolvedCat) {
              var item = this._unresolvedCat[item_name];

              if (item_cat in this._categories) {
                // success 
                delete this._unresolvedCat[item_name];
                item._generic = save;   // record to point back to
                var cat = this._categories[item_cat];
                cat._items[item_name] = item;
                item._category = cat; // add ref to parent
                // this._items[item_name] = item;
                this.addItem(item_name, item);
                continue;
              }
              // else no cat match
              this.warn("Crazy no cat for item " + item_name + " in " +save[1] );
            }
            this.warn("Crazy undefined item in loop " + item_name + " in " + save[1]);
            
          }
        }
      }
    }
  }
  for (var name in this._unresolved) {
    this.warn("as yet unresolved " + name);
  }
};


/**
 * Customisation to handle DDLstar dictionaries.
 * @constructor
 * @augments {BaseDictWrapper}
 * @param dict {Array[]} JSON representation of DDL1 dictionary 
 * @param logger {CifJs}
 */
// Parasitic inheritance
function DDLstarCtrlr(dict, logger) {
  this._root_cat_name = 'category_overview';
  this._ddl_version = "DDL_star"; 
  this._save_mapping = { 
//    '_definition.scope': 'CATEGORY',   // nope. DDL_DEFINED used in enum data
    '_definition.class': 'CATEGORY',
    '_name.attribute_id': 'ITEM',
    '_type.container': 'ITEM',
    '_type.value': 'ITEM'
  };
  
  this._ddl_map = {
    '_full_definition_name': '_definition.id',
    '_parent_cat_name': '_category.parent_id',
    '_family_cat_name': '_category.family_id',
//    '_family_cat_name': '_name.category_id',
    '_item_category': '_name.category_id',
    '_cat_attribute_id': '_name.attribute_id',
    '_defn_import': '_definition.import_id',
    '_alias_tag': '_alias.definition_id',
    '_join_set': '_category.join_set_id',
    '_data_container': '_type.container',
    '_data_type': '_type.value',
    '_data_dimension': '_type_array.dimension',
    '_data_purpose': '_type.purpose',
    '_method_purpose':  '_method.class',
    '_method_expression': '_method.expression',
    '_category_key': '_category_key.item_id'
  };
  for (var key in this._ddl_map) {
    this[key] = this._ddl_map[key];
  }
  
  this._defaults = { }; // a category dict.
  if (arguments.length) { this._init(dict,logger); }
  
  if (dict)
    this._buildIndices();
}

// we add our own extensions to this BaseDictWrapper instance
DDLstarCtrlr.prototype = new BaseDictWrapper();

/**
 * @memberof DDLstarCtrlr.prototype
 * @return null
 */
DDLstarCtrlr.prototype._init = function(dict, logger) {
  this.__tmpinit = BaseDictWrapper.prototype._init;
  // now Dict constructor thinks it belongs to DDL2
  this.__tmpinit(dict, logger);
};

/**
 * Required for dREL processing.
 * @memberof DDLstarCtrlr.prototype
 * @param cat_name {String}
 * @return {Object} a hashtable of category names and references.
 */
DDLstarCtrlr.prototype.getJoinedCats = function(cat_name) {
  var set = { };
  var cat = this.hasCategory(cat_name);
  if (! cat) return set;
  var join_set = cat.getAttribute(this._join_set);
  // assume that is the parent/ root ???
  if (join_set) {
    var souper = this.hasCategory(join_set);
    set[join_set] = souper;
  }
  for (var catid in this._categories) {
      if (catid == cat_name) continue;
      var c = this._categories[catid]; 
      var join = c.getAttribute(this._join_set);
      if (! join) continue;
      if (join == join_set) {
        set[catid] = c;
      } else if (join == cat_name) {
        set[catid] = c;
      }
    }
  return set;
};

/**
 * This was a hack to load defaults 
 * @memberof DDLstarCtrlr.prototype
 * @param cat_name {String} 
 * @param map_data {Object} default data to be saved.
 * @return null
 */
DDLstarCtrlr.prototype.registerDefaults = function(cat_name, map_data) {
  this._defaults[cat_name] = map_data;
};

/**
 * Retrieve the initially archived  defaults - DDLStar specific.
 * @memberof DDLstarCtrlr.prototype
 * @param cat_name {String}
 * @return {Object} the archived defaults
 */
DDLstarCtrlr.prototype.getCatDefaults = function(cat_name) {
  return this._defaults[cat_name]; 
};

/**
 * 
 * @memberof DDLstarCtrlr.prototype
 * @return null
 */
DDLstarCtrlr.prototype._buildIndices = function() {
  var data = this._getFirstDataBlock(this._rawDict);
  this._findCategories(data[2]);
  this._fixUnresolved();
  this.info("items       " +  Object.keys(this._items).length);
  this.info("categories   " +  Object.keys(this._categories).length);
  this.info("generics    " +  Object.keys(this._generics).length);
  this.warn("unresolved  " +  Object.keys(this._unresolvedCat).length);
  this._buildAliases(this._alias_tag);
  this.info("with aliases " +  Object.keys(this._items).length);
};


/**
 * Build a useful/functional data structure from the raw JSON.
 * @memberof DDLstarCtrlr.prototype
 * @return null
 */
DDLstarCtrlr.prototype._findCategories = function(data) {
  var l = data.length;
  this.info("save frames, comments and dict level items " + l);
  var SAVE = 0, ITEM = 0, COMMENT = 0, DUPES = 0;
  /*
  var mono_data = 0;
  while (rawjsondict[mono_data] && rawjsondict[mono_data][0] != 'data_'){
    this.info("mono_data" +mono_data + " : " + rawjsondict[mono_data][0] ); 
    mono_data++;
  }
  this.info("mono_data" +mono_data);
  var data = rawjsondict[mono_data][2];
  */
  var map_keys = [];
  for (var key in this._save_mapping) {
     map_keys.push(key);
  }
  this.info("check save frames against keys : " + map_keys);
   
  
  for (var i = 0; i < l; i++) {
    var chunk = data[i];
    var type = chunk[0];
 
    if (type == 'save_') {
      SAVE++;
      // var dtype = this._getAttribute('_type', chunk[2]);
      var save_class = this._getSaveClass(chunk[2], this._save_mapping);
/*
      if (save_class != 'ITEM') {
        var dtype = this._getAttribute('_type', chunk[2]);
        if (dtype && dtype != 'null') {
          save_class = 'ITEM';
        }
      }
 */

      if (save_class == 'CATEGORY') {
        // save_frame is a category
        var catid = this._getAttribute(this._full_definition_name, chunk[2]);
        if (! catid) {
           this.warn("Unexpected dict data_ item : " + chunk);
           continue;
        }

        var cat = new CatDefn(catid);
        cat._save = chunk[2];
        cat._data = this._wrapAttributes(chunk[2], cat);
        
        if (catid.toLowerCase() in this._categories) {
           this.warn("Multiple declarations of Cat : " + catid);
           alert("Broken Dict.\nMultiple declarations of Cat : " + catid);
           this.warn(this._categories[catid.toLowerCase()]._save );
           this.warn(chunk);
           throw new Error("Multiple declarations of Cat : " + catid);
        }
        var family_cat = this._getAttribute(this._family_cat_name, chunk[2]);
        var parent_cat = this._getAttribute(this._parent_cat_name, chunk[2]);
        if (! parent_cat ) parent_cat = family_cat;  // CRAP CRAP CRAP
        this.info("Creating sub cat " + catid + " of " + parent_cat);
        if (! parent_cat) {
          // probably this is the base dict save frame 
          if (!  this._root_cat) {
            this._root_cat = cat;
            this._root_cat_name = catid.toLowerCase();
            continue;
          }
          this.warn("Dict CATEGORY save_ has no family_id! : " + chunk);
        }
        parent_cat = parent_cat.toLowerCase(); 
        var cat_id = catid.toLowerCase();
        
        if (parent_cat == this._root_cat_name) {
          // cat._category = null; // point up
          this._sub_cats[cat_id] = cat; // child cats
          //this._categories[cat_id] = cat;      //list of all cats
          this.addCategory(cat_id, cat);      //list of all cats
          continue;
        } 
        // this.warn("no parent? : " + parnt);
        
        if (parent_cat in this._sub_cats) {
            //cat._category = parent_cat; // point up
            var parnt = this._categories[parent_cat];
            cat._category = parnt; // point up
            parnt._sub_cats[cat_id] = cat; // child cats
            //this._categories[cat_id] = cat;      //list of all cats
            this.addCategory(cat_id, cat);      //list of all cats
            continue;
        } 
        if (parent_cat in this._categories) {
            var parnt = this._categories[parent_cat];
            cat._category = parnt; // point up
            //cat._category = parent_cat; // point up
            parnt._sub_cats[cat_id] = cat;   // child of sub cat
            //this._categories[cat_id] = cat;      //list of all cats
            this.addCategory(cat_id, cat);      //list of all cats
            continue;
        }
        cat._category = parent_cat;        // label NOT object!!!!
        // this._categories[cat_id] = cat;      //list of all cats
        this.addCategory(cat_id, cat);      //list of all cats
        this._unresolvedCat[cat_id] = cat;   // its not part of the hierarchy yet
        this.warn("Unexpected cat group order: " + catid + " for " 
          + chunk[1] + "\n Parent " + parent_cat + " not yet defined!" );
      } 
      else if (save_class == 'ITEM') {
        // save_frame is an item_
        var itemid = this._getAttribute(this._full_definition_name, chunk[2]);
        var items;
        if ( itemid ) {
          items = [itemid];
        }
        else {
          // multiple item declaration.
          var items = this._getList(this._full_definition_name, chunk[2]);  
        }
        if (items) {
          for (var j = 0; j< items.length; j++) { 
            var itemid = items[j];
            var item = new ItemDefn(itemid);
            item._save = chunk[2];
            item._data = this._wrapAttributes(chunk[2], item);
            var catid = this._getAttribute(this._item_category, chunk[2]); 
//            this.info( "checking " + itemid  + " for " +catid)
            if (catid) {
              var cat_id = catid.toLowerCase();
              var cat = this._categories[cat_id];
              if (! cat ) {
                 this.warn( "checking " + itemid  + " for " +catid);
                 this.warn( item._save);
                 this._unresolvedCat[chunk[1]] = item; 
                 this.warn(" Crazy no cat item for save_ " + chunk[1]);
                 continue;
              }
              itemid = itemid.toLowerCase();
              cat._items[itemid] = item;
              item._category = cat; // add ref to parent
              var catAtId = this._getAttribute(this._cat_attribute_id, chunk[2]); 
              if (! catAtId) {
                alert("uh oh no category attribute ID " +
                    this._cat_attribute_id + "for item "+itemid);
              }
              cat._itemsByAttributeId[catAtId] = item;
              // maybe the same ?
              cat._itemsByAttributeId[catAtId.toLowerCase()] = item; 
              if (itemid in this._items) DUPES++;
              // this._items[itemid] = item;       // add to global item lookup list
              this.addItem(itemid, item);
            }
            else {
              this._unresolvedCat[chunk[1]] = item; 
              this.warn(" Crazy no cat item for save_ " + chunk[1]);
            }
          }
        }
        else {
          this._generics[chunk[1]] = chunk;
          // this.warn(" Crazy loop shit for save_ " + chunk[1]);
        }
  
      } 
      else {
        this.warn(" No details for data_ " + chunk[1]);
        //throw new Error("Unrecognised save_ frame type " + chunk );
      }
    } // end of 'save_'
    else {
      COMMENT++;
    } 
  }  // end of loop over data contents
  this.info("save frames "+SAVE + ", dict level items " + ITEM);
  this.info("comment + dict items "+COMMENT );
  this.info("DUPES       "+DUPES );
  this.warn("unresolved "+Object.keys(this._unresolvedCat).length );
};


/**
 * @memberof DDL1Ctrlr.prototype
 * @return null
 */
DDLstarCtrlr.prototype._fixUnresolved = function() {
  this.info("Resolving distributed defns");
  for (var key in this._unresolvedCat) {
    var block = this._unresolvedCat[key]; 
    if (typeof block._category == 'string') {
      var parent_cat = block._category;
      var parnt = this._categories[parent_cat];
      if (! parnt) {
        this.warn("GENERATING unresolved parent category " + parent_cat + " for " + key);
        parnt = new CatDefn(parent_cat);
        parnt._save = [['item_', this._full_definition_name, parent_cat],
                       ['item_','_description.text', 
             'ARTIFICIALLY GENERATED CATEGORY! Created by JsCifBrowser']];
        prnt._data = this._wrapAttributes(parnt._save, parnt);
        this._sub_cats[parent_cat] = parnt;
        //this._categories[parent_cat] = parnt;    //list of all cats
        this.addCategory(parent_cat, parnt);    //list of all cats
      }
      if (parnt) {
        if (block instanceof ItemDefn ) {
          block._category = parnt; 
          parnt._items[key] = block;
          delete this._unresolvedCat[key];
        } 
        else if (block instanceof CatDefn ) {
          block._category = parnt;  // point up 
          parnt._sub_cats[key] = block; // point down
          delete this._unresolvedCat[key]; // remove from prob list
        } 
      } 
    }
  }
  
  // loop over all categories to find global function defns
  // and generic item defns
  for (var catid in this._categories) {
    var cat = this._categories[catid];
    var klass = cat.getAttribute('_definition.class');
    if (! klass) continue;
    klass = klass.toLowerCase();
    var group;
    if (klass == "generic") {
      group = this._generics;
    } else if (klass == "function") {
      group = this._functions;
    } else continue;
    for (var itemid in cat._items) {
      var item_name = itemid;
      var item = cat._items[itemid];
      if (klass == "function") { //save short form of name, as used in drel
        item_name = item.getAttribute(this._cat_attribute_id);
        console.log("got function" +item_name);
      }
      group[item_name] = item;
    }
  }
  this.info("Identified  " + Object.keys(this._generics).length + " generics" );
  this.info("Identified " + Object.keys(this._functions).length + " functions" );

  // loop for all items and add generic link if required.
  for (var itemid in this._items) {
    var item = this._items[itemid];
    var importid = BaseDictWrapper.prototype._getAttribute(
           this._defn_import, item._save);
    
    if (this._ddl_version == 'DDL_star') {
      if (importid) { 
        importid = importid.toLowerCase();
        if (importid  in this._generics) {
          // save pointer to record
//        this.info("got import " + importid + " for " + itemid);
          item._generic = this._generics[importid]; 
        } else {
          this.warn("No generic item for import " + importid);
        }
      }
    } 
  }

  // dont think this does anything at all ....
  if (1 == 2) {
  for (var key in this._generics) {
    var save = this._generics[key];
    var data = save[2];
    l = data.length;
    this.debug("Checking generic " + save[1]);
    for (var i = 0; i < l; i++) {
      var chunk = data[i];
      var type = chunk[0];
      if (type == 'loop_') {
        var keys = chunk[1];
        var key_count =  this._countKeys(keys);

        // check for group_list loop
        var index = this._indexOf(keys, '_item.name');
        if (index >= 0) {
          var index2 = this._indexOf(keys, '_item.category_id');
          var items = this._getListFields([index,index2], key_count, chunk[2]);
          for (var ii=0; ii < items.length; ii++) {
            var pair = items[ii];
            var item_name = pair[0];
            var item_cat = pair[1];
            if (item_name in this._items) {
              // multiple defns of item category???
              var item = this._items[item_name];
              // should we check for multiple defns ??
              item._generic = save; // circular reference. this will bite us!
              continue;
            }
            if (item_name == save[1]) {
              // generic defines itself.
              this.debug("self Defn for " + item_name);
              if (item_cat in this._categories) {
                this.debug("got cat " + item_cat);
                var item = new ItemDefn(item_name);
                item._save = data;
                item._data = this._wrapAttributes(data, item);
                // this._items[item_name] = item;
                this.addItem(item_name, item);
                // success 
                item._generic = save;   // circular reference. this will bite us!
                var cat = this._categories[item_cat];
                cat._items[item_name] = item;
                item._category = cat; // add ref to parent
                continue;
              }
              this.warn("No cat " + item_cat + " for " +item_name);
              
            }
            if (item_name in this._unresolvedCat) {
              var item = this._unresolvedCat[item_name];

              if (item_cat in this._categories) {
                // success 
                delete this._unresolvedCat[item_name];
                item._generic = save;   // record to point back to
                var cat = this._categories[item_cat];
                cat._items[item_name] = item;
                item._category = cat; // add ref to parent
                // this._items[item_name] = item;
                this.addItem(item_name, item);
                continue;
              }
              // else no cat match
              this.warn("Crazy no cat for item " + item_name + " in " +save[1] );
            }
            this.warn("Crazy undefined item in loop " + item_name + " in " + save[1]);
            
          }
        }
      }
    }
  }
  }
  for (var name in this._unresolved) {
    this.warn("as yet unresolved " + name);
  }
};


/**
 * Customisation to handle DDLm dictionaries.
 * @constructor
 * @augments {BaseDictWrapper}
 * @param dict {Array[]} JSON representation of DDL1 dictionary 
 * @param logger {CifJs}
 */
// Parasitic inheritance
function DDLmCtrlr(dict, logger) {
  if (arguments.length) { this._init(dict,logger); }
  this._root_cat_name = 'ddl_dic';
  this._ddl_version = 'DDLm'; 
  this._save_mapping = { 
//    '_definition.scope': 'CATEGORY',   // nope. DDL_DEFINED used in enum data
    '_definition.scope': 'CATEGORY',
    '_definition.class': {'attribute':'ITEM', '*':'CATEGORY'},
//    '_name.object_id': 'ITEM',
    '_type.container': 'ITEM',
    '_type.contents': 'ITEM'
  };
  this._ddl_map = {
    '_full_definition_name': '_definition.id',
    '_parent_cat_name': '_name.category_id',
    '_family_cat_name': '_name.category_id', // '_category.family_id';
    '_item_category': '_name.category_id',
    '_cat_attribute_id': '_name.object_id',
//    '_defn_import': '_definition.import_id', // maybe _category_key.generic
    '_defn_import': '_import.get', 
    '_join_set': '_category.parent_join',
    '_alias_tag': '_alias.definition_id',
    '_data_type': '_type.contents',
    '_data_dimension': '_type.dimension',
    '_data_container': '_type.container',
    '_data_purpose': '_type.purpose',
    '_method_purpose':  '_method.purpose',
    '_method_expression': '_method.expression',
//    '_category_key': '_category_key.generic'
    '_category_key': '_category.key_id',
    '_category_keys': '_category.key_list'
  };
  for (var key in this._ddl_map) {
    this[key] = this._ddl_map[key];
  }

  this._defaults = { }; // a category dict.
  if (dict)
    this._buildIndices();
}

// we add our own extensions to this BaseDictWrapper instance
DDLmCtrlr.prototype = new DDLstarCtrlr();

/**
 * @memberof DDLmCtrlr.prototype
 * @return null
 */
DDLmCtrlr.prototype._init = function(dict, logger) {
  this._x_tmpinit = DDLstarCtrlr.prototype._init;
  // now Dict constructor thinks it belongs to DDL2
  this._x_tmpinit(dict, logger);
};


/**
 * Build a useful/functional data structure from the raw JSON.
 * @memberof DDLmCtrlr.prototype
 * @return null
 */
DDLmCtrlr.prototype._findCategories = function(data) {
  this.info("save frames, comments and dict level items " + data.length);
  var stats = {'SAVE':0,'ITEM':0, 'COMMENT':0, 'DUPES':0};

  this._cat_short = {};
  this._recursiveFindCategories(null, data, stats);
//  this._fixUnresolved(); // DDL_star method

  this.info("save frames "+stats.SAVE + ", dict level items " + stats.ITEM);
  this.info("comment + dict items "+stats.COMMENT );
  this.info("DUPES       "+stats.DUPES );
  if (Object.keys(this._unresolvedCat).length > 0) {
    this.warn("unresolved  " +  Object.keys(this._unresolvedCat).length);
  }
  else  {
    this.info("unresolved  " +  Object.keys(this._unresolvedCat).length);
  }
};


/**
 * This is recursive because of nested save_ frames in DDLm.
 * Because we adopt a nested save_ frame hierarchy, we don't 
 * actually need to be so pedantic about save frame category pointers.
 * @memberof DDLmCtrlr.prototype
 * @param data {Array} JSON data to be searched.
 * @param stats {Object} accumulate statistics.
 * @return null
 */
DDLmCtrlr.prototype._recursiveFindCategories = function(enclosing, data, stats) {
  var l = data.length;
  
  for (var i = 0; i < l; i++) {
    var chunk = data[i];
    var type = chunk[0];
 
    if (type == 'save_') {
      stats.SAVE += 1;
      // var dtype = this._getAttribute('_type', chunk[2]);
      var save_class = this._getSaveClass(chunk[2], this._save_mapping);

      if (save_class == 'CATEGORY') {
        // save_frame is a category
        var catid = this._getAttribute(this._full_definition_name, chunk[2]);
        if (! catid) {
           this.warn("Unexpected dict data_ item : " + chunk);
           continue;
        }

        var cat = new CatDefn(catid);
        var dat = chunk[2];
        var jl = dat.length;
        var catdata = [];
        var saveitems = [];
        for (var j = 0; j < jl; j++) {
         var ch = dat[j];
         var typ = ch[0];
         if (typ == 'save_') saveitems.push(ch);
         else catdata.push(ch);
        }
        cat._save = catdata; // subset of cat specific items
        cat._data = this._wrapAttributes(catdata, cat);
        
        if (catid.toLowerCase() in this._categories) {
           this.warn("Multiple declarations of Cat : " + catid);
           alert("Broken Dict.\nMultiple declarations of Cat : " + catid);
           this.warn(this._categories[catid.toLowerCase()]._save );
           this.warn(chunk);
           throw new Error("Multiple declarations of Cat : " + catid);
        }


        var short_cat_name = this._getAttribute(this._cat_attribute_id, catdata);
        if (short_cat_name) {
          this._cat_short[short_cat_name.toLowerCase()] = catid.toLowerCase(); // update loopup table
           if (short_cat_name != catid) {
             this.info("Alias cat from " + short_cat_name + " to " + catid);
           }
        }
        var p_c;
        var parent_cat = this._getAttribute(this._parent_cat_name, catdata);
        if (parent_cat)  p_c = parent_cat.toLowerCase(); 

        var cat_id = catid.toLowerCase();
        if (enclosing) {
          // save_frame hierarchy takes precedence
          cat._category = enclosing;   // point up
          enclosing._sub_cats[cat_id] = cat; // child cats
          this.addCategory(cat_id, cat);   //list of all cats
          if (p_c != enclosing._name.toLowerCase()) {
             this.warn( catid + " wrapper " + enclosing._name + " doesn't match " 
            + " stated  _name.category_id  " + parent_cat );
          }
        } else {
          // no enclosing so possibly a root cat.
          if (parent_cat) {
            //  if (parent_cat in this._sub_cats) {
            //  var parnt = this._categories[parent_cat];
            //  cat._category = parnt; // point up
            //  parnt._sub_cats[cat_id] = cat; // child cats
            cat._category = p_c;        // label NOT object!!!!
            this.addCategory(cat_id, cat);      //list of all cats
            this._unresolvedCat[cat_id] = cat; // its not part of the hierarchy yet
            this.warn("Unexpected cat group order: " + catid + " for " 
              + chunk[1] + "\n Parent " + parent_cat + " not yet defined!" );
          } else {
            // no enclosing and no parent .category_id
            this.addCategory(cat_id, cat);      //list of all cats
            this._sub_cats[cat_id] = cat; // child cats
          } 
          if (!  this._root_cat) {
            this._root_cat = cat;
            this._root_cat_name = cat_id;
            this.warn("No parent cat. Assuming " +catid + " is the root cat.");
          }
        }
        this.info("Creating sub cat " + catid + " of " + parent_cat);
        
        //this.info(" sub saves? " + saveitems.length); 
        this._recursiveFindCategories(cat, saveitems, stats);

      } 
      else if (save_class == 'ITEM' || save_class == 'unknown') {
        // save_frame is an item_
        var itemid = this._getAttribute(this._full_definition_name, chunk[2]);
        var items;
        if ( itemid ) {
          items = [itemid];
        }
        else {
          // multiple item declaration.
          var items = this._getList(this._full_definition_name, chunk[2]);  
        }
        if (items) {
          for (var j = 0; j< items.length; j++) { 
            var itemid = items[j];
            var item = new ItemDefn(itemid);
            item._save = chunk[2];
            item._data = this._wrapAttributes(chunk[2], item);

            //var catid = this._getAttribute(this._item_category, chunk[2]); 
//            this.info( "checking " + itemid  + " for " +catid)
            if (enclosing) {
              var cat_id = enclosing._name.toLowerCase();
              //if (cat_id in this._cat_short) {
              //  cat_id = this._cat_short[cat_id];//remap category_id to defn.id 
              //}
              //var cat = this._categories[cat_id];
              var cat = enclosing;

              if (! cat ) {
                 this.warn( "checking " + itemid  + " for " +catid);
                 this.warn( item._save);
                 this._unresolvedCat[itemid] = item; 
                 item._category = cat_id; // save as string, not object
                 // this._items[itemid] = item; // add to global item lookup list
                 this.addItem(itemid, item);
                 this.warn(" Crazy no cat item for save_ " + chunk[1]);
                 continue;
              }
              itemid = itemid.toLowerCase();
              cat._items[itemid] = item;
              item._category = cat; // add ref to parent
              var catAtId = this._getAttribute(this._cat_attribute_id, chunk[2]); 
              if (! catAtId) {
                this.warn("Definition " +itemid + " has no category attribute ID " +
                    this._cat_attribute_id );
              } else {
                cat._itemsByAttributeId[catAtId] = item;
                // maybe the same ?
                cat._itemsByAttributeId[catAtId.toLowerCase()] = item; 
              }
              if (itemid in this._items) DUPES++;
              // this._items[itemid] = item;         // add to global item lookup list
              this.addItem(itemid, item);
            }
            else {
              this._unresolvedCat[chunk[1]] = item; 
              this.warn(" Crazy no cat item for save_ " + chunk[1]);
            }
          }
        }
        else {
          var genericid =chunk[1];
          var item = new ItemDefn(genericid);
          item._save = chunk[2];
          item._data = this._wrapAttributes(chunk[2], item);
          //  var catid = this._getAttribute(this._item_category, chunk[2]); 
          this._generics[genericid.toLowerCase()] = item;
        }
  
      } 
      else {
        this.warn(" No details for data_ " + chunk[1]);
        //throw new Error("Unrecognised save_ frame type " + chunk );
      }
    // end of 'save_'
    } else if (type == 'item_') {

    } else {
      //  this.info("comment " );
      stats.COMMENT +=1;
    } 
  }  // end of loop over data contents
};

/**
 * This is recursive because of nested save_ frames in DDLm.
 * This was the original. I think DDLstar didn't use nested 
 * save frames, just a big list with pointers.  So the focus
 * of this method was to resolve all the category pointers.
 * @memberof DDLmCtrlr.prototype
 * @param data {Array} JSON data to be searched.
 * @param stats {Object} accumulate statistics.
 * @return null
 */
DDLmCtrlr.prototype._recursiveFindCategories1 = function(data, stats) {
  var l = data.length;
  
  for (var i = 0; i < l; i++) {
    var chunk = data[i];
    var type = chunk[0];
 
    if (type == 'save_') {
      stats.SAVE += 1;
      // var dtype = this._getAttribute('_type', chunk[2]);
      var save_class = this._getSaveClass(chunk[2], this._save_mapping);

      if (save_class == 'CATEGORY') {
        // save_frame is a category
        var catid = this._getAttribute(this._full_definition_name, chunk[2]);
        if (! catid) {
           this.warn("Unexpected dict data_ item : " + chunk);
           continue;
        }

        var cat = new CatDefn(catid);
        var dat = chunk[2];
        var jl = dat.length;
        var catdata = [];
        var saveitems = [];
        for (var j = 0; j < jl; j++) {
         var ch = dat[j];
         var typ = ch[0];
         if (typ == 'save_') saveitems.push(ch);
         else catdata.push(ch);
        }
        cat._save = catdata; // subset of cat specific items
        cat._data = this._wrapAttributes(catdata, cat);
        
        if (catid.toLowerCase() in this._categories) {
           this.warn("Multiple declarations of Cat : " + catid);
           alert("Broken Dict.\nMultiple declarations of Cat : " + catid);
           this.warn(this._categories[catid.toLowerCase()]._save );
           this.warn(chunk);
           throw new Error("Multiple declarations of Cat : " + catid);
        }

        var family_cat = this._getAttribute(this._family_cat_name, catdata);
        var parent_cat = this._getAttribute(this._parent_cat_name, catdata);
        if (! parent_cat ) parent_cat = family_cat;  // CRAP CRAP CRAP
        var short_cat_name = this._getAttribute(this._cat_attribute_id, catdata);
        if (short_cat_name) {
          this._cat_short[short_cat_name.toLowerCase()] = catid.toLowerCase(); // update loopup table
           if (short_cat_name != catid) {
             this.info("Alias cat from " + short_cat_name + " to " + catid);
           }
        }
        this.info("Creating sub cat " + catid + " of " + parent_cat);
        if (! parent_cat) {
          // probably this is the base dict save frame 
          if (!  this._root_cat) {
            this._root_cat = cat;
            this._root_cat_name = catid.toLowerCase();
            this.warn("No parent cat. Is " +catid + " the root cat?");

            // cat._category = parent_cat;        // label NOT object!!!!
            //this._categories[catid.toLowerCase()] = cat;    //list of all cats
            this.addCategory(catid.toLowerCase(), cat);    //list of all cats
            this._unresolvedCat[catid.toLowerCase()] = cat; 
            this._recursiveFindCategories(saveitems, stats);
            continue;
          }
          this.warn("Dict CATEGORY save_ has no family_id! : " + chunk);
        }
        parent_cat = parent_cat.toLowerCase(); 
        var cat_id = catid.toLowerCase();
        
        if (parent_cat == this._root_cat_name) {
          // cat._category = null; // point up
          this._sub_cats[cat_id] = cat; // child cats
          //this._categories[cat_id] = cat;      //list of all cats
          this.addCategory(cat_id, cat);      //list of all cats
        } 
        else if (parent_cat in this._sub_cats) {
            //cat._category = parent_cat; // point up
            var parnt = this._categories[parent_cat];
            cat._category = parnt; // point up
            parnt._sub_cats[cat_id] = cat; // child cats
            //this._categories[cat_id] = cat;      //list of all cats
            this.addCategory(cat_id, cat);      //list of all cats
        } 
        else if (parent_cat in this._categories) {
            var parnt = this._categories[parent_cat];
            cat._category = parnt; // point up
            //cat._category = parent_cat; // point up
            parnt._sub_cats[cat_id] = cat;   // child of sub cat
            //this._categories[cat_id] = cat;      //list of all cats
            this.addCategory(cat_id, cat);      //list of all cats
        } else {
          cat._category = parent_cat;        // label NOT object!!!!
          //this._categories[cat_id] = cat;    //list of all cats
          this.addCategory(cat_id, cat);      //list of all cats
          this._unresolvedCat[cat_id] = cat; // its not part of the hierarchy yet
          this.warn("Unexpected cat group order: " + catid + " for " 
            + chunk[1] + "\n Parent " + parent_cat + " not yet defined!" );
        }

        // 
        //this.info(" sub saves? " + saveitems.length); 
        this._recursiveFindCategories(saveitems, stats);

      } 
      else if (save_class == 'ITEM' || save_class == 'unknown') {
        // save_frame is an item_
        var itemid = this._getAttribute(this._full_definition_name, chunk[2]);
        var items;
        if ( itemid ) {
          items = [itemid];
        }
        else {
          // multiple item declaration.
          var items = this._getList(this._full_definition_name, chunk[2]);  
        }
        if (items) {
          for (var j = 0; j< items.length; j++) { 
            var itemid = items[j];
            var item = new ItemDefn(itemid);
            item._save = chunk[2];
            item._data = this._wrapAttributes(chunk[2], item);
            var catid = this._getAttribute(this._item_category, chunk[2]); 
//            this.info( "checking " + itemid  + " for " +catid)
            if (catid) {
              var cat_id = catid.toLowerCase();
              if (cat_id in this._cat_short) {
                cat_id = this._cat_short[cat_id];//remap category_id to defn.id 
              }
              var cat = this._categories[cat_id];
              if (! cat ) {
                 this.warn( "checking " + itemid  + " for " +catid);
                 this.warn( item._save);
                 this._unresolvedCat[itemid] = item; 
                 item._category = cat_id; // save as string, not object
                 // this._items[itemid] = item; // add to global item lookup list
                 this.addItem(itemid, item);
                 this.warn(" Crazy no cat item for save_ " + chunk[1]);
                 continue;
              }
              itemid = itemid.toLowerCase();
              cat._items[itemid] = item;
              item._category = cat; // add ref to parent
              var catAtId = this._getAttribute(this._cat_attribute_id, chunk[2]); 
              if (! catAtId) {
                alert("uh oh no category attribute ID " +
                    this._cat_attribute_id + "for item "+itemid);
              }
              else {
                 cat._itemsByAttributeId[catAtId] = item;
                 // maybe the same ?
                 cat._itemsByAttributeId[catAtId.toLowerCase()] = item; 
              }
              if (itemid in this._items) DUPES++;
              // this._items[itemid] = item;         // add to global item lookup list
              this.addItem(itemid, item);
            }
            else {
              this._unresolvedCat[chunk[1]] = item; 
              this.warn(" Crazy no cat item for save_ " + chunk[1]);
            }
          }
        }
        else {
          var genericid =chunk[1];
          var item = new ItemDefn(genericid);
          item._save = chunk[2];
          item._data = this._wrapAttributes(chunk[2], item);
          //  var catid = this._getAttribute(this._item_category, chunk[2]); 
          this._generics[genericid.toLowerCase()] = item;
        }
  
      } 
      else {
        this.warn(" No details for data_ " + chunk[1]);
        //throw new Error("Unrecognised save_ frame type " + chunk );
      }
    // end of 'save_'
    } else if (type == 'item_') {

    } else {
      //  this.info("comment " );
      stats.COMMENT +=1;
    } 
  }  // end of loop over data contents
};


/** 
 * @memberof DDLmCtrlr.prototype
 * @return null
 */
DDLmCtrlr.prototype._fixUnresolved = function() {
  var dict_class = this.getAttribute('_dictionary.class') ;
  this.info("Dictionary Class: " + dict_class);

  this.info("Resolving distributed defns");
  for (var key in this._generics) {
    var block = this._generics[key]; 
    var parent_cat = block._category;
    if (! parent_cat) {
      parent_cat = '__generic__'; 
    }
    // this._items[key] = block; // maybe we should check before doing this?
    this.addItem(key, block);
    var parnt = this._categories[parent_cat];

    if (! parnt) {
        this.warn("GENERATING unresolved parent category " + parent_cat + " for " + key);
        parnt = new CatDefn(parent_cat);
        parnt._save = [['item_', this._full_definition_name, parent_cat],
                       ['item_','_description.text', 
             'ARTIFICIALLY GENERATED CATEGORY! Created by JsCifBrowser']];
        parnt._data = this._wrapAttributes(parnt._save, parnt);
        this._sub_cats[parent_cat] = parnt;
        // this._categories[parent_cat] = parnt;    //list of all cats
        this.addCategory(parent_cat, parnt);    //list of all cats
    }
    if (parnt) {
        if (block instanceof ItemDefn ) {
          block._category = parnt; 
          parnt._items[key] = block;
//          delete this._unresolvedCat[key];
        } 
        else if (block instanceof CatDefn ) {
          block._category = parnt;  // point up 
          parnt._sub_cats[key] = block; // point down
//          delete this._unresolvedCat[key]; // remove from prob list
        } 
    } 
  }


  for (var key in this._unresolvedCat) {
    var block = this._unresolvedCat[key]; 
    if (typeof block._category == 'string') {
      var parent_cat = block._category;
      var parnt = this._categories[parent_cat];
      if (! parnt) {
        this.warn("GENERATING unresolved parent category " + parent_cat + " for " + key);
        parnt = new CatDefn(parent_cat);
        parnt._save = [['item_', this._full_definition_name, parent_cat],
                       ['item_','_description.text', 
             'ARTIFICIALLY GENERATED CATEGORY! Created by JsCifBrowser']];
        parnt._data = this._wrapAttributes(parnt._save, parnt);
        this._sub_cats[parent_cat] = parnt;
        //this._categories[parent_cat] = parnt;    //list of all cats
        this.addCategory(parent_cat, parnt);    //list of all cats
      }
      if (parnt) {
        if (block instanceof ItemDefn ) {
          block._category = parnt; 
          parnt._items[key] = block;
          delete this._unresolvedCat[key];
        } 
        else if (block instanceof CatDefn ) {
          block._category = parnt;  // point up 
          parnt._sub_cats[key] = block; // point down
          delete this._unresolvedCat[key]; // remove from prob list
        } 
      } 
    }
  }
  
  // loop over all categories to find global function defns
  // and generic item defns
  for (var catid in this._categories) {
    var cat = this._categories[catid];
    var klass ;
    if (dict_class.toLowerCase() == 'function') klass = 'function'; 
    if (dict_class.toLowerCase() == 'template') klass = 'generic';
    var cat_class = cat.getAttribute('_definition.class');
    if (cat_class && cat_class.toLowerCase() == 'functions') klass = 'function'; // 
    if (! klass) continue;
    var group;
    if (klass == "generic") {
      group = this._generics;
    } else if (klass == "function") {
      group = this._functions;
    } else continue;
    for (var itemid in cat._items) {
      var item_name = itemid;
      var item = cat._items[itemid];
      if (klass == "function") { //save short form of name, as used in drel
        item_name = item.getAttribute(this._cat_attribute_id);
        cat._itemsByAttributeId[item_name] = item;
        this.info("got function " +item_name);
      }
      group[item_name] = item;
    }
  }
  this.info("Identified  " + Object.keys(this._generics).length + " generics" );
  this.info("Identified " + Object.keys(this._functions).length + " functions" );

  // loop for all items and add generic link if required.
  for (var itemid in this._items) {
    var item = this._items[itemid];
    var importid = BaseDictWrapper.prototype._getAttribute(
           this._defn_import, item._save);
    
    if (this._ddl_version == 'DDL_star') {
      if (importid) { 
        importid = importid.toLowerCase();
        if (importid  in this._generics) {
          // save pointer to record
//        this.info("got import " + importid + " for " + itemid);
          item._generic = this._generics[importid]; 
        } else {
          this.warn("No generic item for import " + importid);
        }
      }
    } 
  }

  for (var name in this._unresolved) {
    this.info("as yet unresolved " + name);
  }
};

/**
 * @memberof DDLmCtrlr.prototype
 * @return null
 */
DDLmCtrlr.prototype.getJoinedCats = function(cat_name) {
  var set = { };
  var cat = this.hasCategory(cat_name);
  if (! cat) return set;
  var parnt = cat;
  while (parnt) {
    var klass =parnt.getAttribute('_definition.class'); 
    if (( ! klass) || (klass.toLowerCase() != 'loop')) break;
    set[parnt._name.toLowerCase()] = parnt; 
    parnt = parnt._category;
  }

  if (cat_name in set) {
    // only go one level deep. TBD go deeper ...
    for (var child_name in cat._sub_cats) {
      var child = cat._sub_cats[child_name];
      var klass =child.getAttribute('_definition.class'); 
      if (klass && klass.toLowerCase() != 'loop') continue;
      set[child._name.toLowerCase()] = child; 
    }
  }
  // add asked for item if not yet there.
  set[cat_name] = cat; 

  var join_set = cat.getAttribute(this._join_set);
  // assume that is the parent/ root ???
  if (join_set) {
    var souper = this.hasCategory(join_set);
    set[join_set] = souper;
  }
  for (var catid in this._categories) {
      if (catid == cat_name) continue;
      var c = this._categories[catid]; 
      var join = c.getAttribute(this._join_set);
      if (! join) continue;
      if (join == join_set) {
        set[catid] = c;
      } else if (join == cat_name) {
        set[catid] = c;
      }
    }
  return set;
};


/**
 * Return an appropriately DDL specific 
 * @param data {Array} JSON data
 * @param logger {CifJs} logging environment
 * @return {BaseDictWrapper}
 */
function DictWrapper(data, logger) {
  var version = BaseDictWrapper.prototype.getDDLVersion(data) ;
  if (version) {
     logger.log("Got a " + version + " dictionary.");
  }
  if (version == 'DDLm') {
    return new DDLmCtrlr(data, logger);
  }
  if (version == 'DDL_star') {
    return new DDLstarCtrlr(data, logger);
  }
  if (version == 'DDL2') {
    return new DDL2Ctrlr(data, logger);
  }
  if (version == 'DDL1') {
    return new DDL1Ctrlr(data, logger);
  }
  logger.log("Cannot determine DDL version of dict");
  return null; 
}

if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.DictWrapper = DictWrapper;
  exports.BaseDictWrapper = BaseDictWrapper;
}

