/*
 * @file Maintains the state of the dREL method execution context.
 * 
 */

if (typeof require !== 'undefined') {
  // for node.js
  var Library = require("./library.js").Library;
  var LoopCtrlr=require("../star/star_controller.js").LoopCtrlr;
}


/**
 * CatCon maintains the execution state for categories. Every category that has
 * _data.item children, that are accessed as part of an evaluation, requires a CatCon 
 * instance i.e. there is one for every category.
 * @constructor
 * @param context a reference to the parent data_block's execution context.
 * @param lookupName the name of the category.
 * @param model is a reference to the corresponding CIF data category's container.
 * @param defn  is a reference to the dictionary definition for this category.
 */
function CatCon(context, lookupName, model, defn) {
  this._ctxt = context;
  this._name = lookupName;
  this._defn = defn;  // the ._dict defn of cat
  this._model = model; // {_name, _data, _view, _onViewChange, _updateDepends }
  this._index =[0 ];  // stack for loops over loops
  this._key = [];
  this._rowCache = [];
  this.length ;    // fixed length for all loops?
  this._itemCons = {} ;
  this._parentCat = null;  // parent contxt
  this._joinSetCats = {}; // prent links to child contxts
  this._cat_key_item ;  // for looped cats.
  this._loop ;  // for looped cats.
}

/**
 * Invoke DDLm category method. Category methods return no values, 
 * but as side effects, calculate the entire category contents.
 * They are only invoked when a category contains no data items.
 * 
 * @ memberof CatCon.prototype
 * @ return null
 */
CatCon.prototype.evaluate = function() {
      var func = this._ctxt.getDefnFunction(this._defn,'evaluation');
      if (func) {
        this._ctxt.info("Evaluating category: " + this._name);
        try {
          // push execution stack
          // execute the compiled dictionary dREL method
          func(this._ctxt, this._ctxt._lib);
          // the method has side effects.
          // pop execution stack
        } catch (e) {
          alert( this._name + ":::" + e);
          throw e;
        }
      }
};

/**
 * @memberof CatCon.prototype
 * @param catItemName {string} DDLm .object_id
 * @return ItemCon
 */
CatCon.prototype._buildNewItem = function(catItemName) {
    var item_defn = this._defn.getItemByAttributeId(catItemName);
    if (! item_defn) {
      throw new Error("DrelContext: No item definition for " + catItemName +
            " in category " + this._name);
    }
    var item_name = item_defn._name;
//  alert("Creating the context item  " + this._name + "::: " +catItemName);
    var item = this._ctxt.getItem(item_name);
    if (! item) {
      throw new Error("DrelContext: No item object for " + catItemName +
            " in category " + this._name);
    }
    this._itemCons[catItemName] = item;
    return item;
};

/**
 * Check if category model contains the supplied .object_id, or any of its aliases.
 * @memberof CatCon.prototype
 * @param catItemName {string} DDLm .object_id 
 * @return Boolean
 */
CatCon.prototype.hasItem = function(catItemName) {
    var lowerCatItemName = catItemName.toLowerCase();
    if (lowerCatItemName in this._itemCons) {
      return true;
    }
    var item_defn = this._defn.getItemByAttributeId(lowerCatItemName);
    if (! item_defn) {
      throw new Error("DrelContext: No item definition for " + catItemName +
            " in category " + this._name);
    }
    var item_name = item_defn._name;
    var low_data_name = item_name.toLowerCase();

    var blk = this._ctxt._block;
    model = blk.getItem(low_data_name);
    if (model) return true;
    if (! model && item_defn.hasAliases() ) {
      var aliases = item_defn.getAliases();
      for (var i=0; i< aliases.length; i++) {
        model = blk.getItem(aliases[i]);
        if (model) return true;
      }
    }
    return false;
};

/**
 * @memberof CatCon.prototype
 * @param catItemName {string} DDLm .object_id
 * @return ItemCon
 */
CatCon.prototype.getItem = function(catItemName) {
	var lowerCatItemName = catItemName.toLowerCase();
//	if (this._index.length) {  // ddb 2/3/2013
	if (this._loop) {
//		alert("Get item from cache " +catItemName); 
		return this.getItemFromCache(lowerCatItemName);
	}
//	alert("trying to get " + catItemName + " from CatCon");
	if (lowerCatItemName in this._itemCons) {
		return this._itemCons[lowerCatItemName]; 
	}
	return this._buildNewItem(lowerCatItemName); 
};

/**
 * @memberof CatCon.prototype
 * @param catItemName  {string} DDLm .object_id
 * @return ItemCon
 */
CatCon.prototype.getItemFromCache = function(catItemName) {
	// creating new item in the list
	var item;
	if (catItemName in this._itemCons) {
		item = this._itemCons[catItemName];
	} else {
		item = this._buildNewItem(catItemName); 
	}
	return this._updateItemFromCache(item);
};

/**
 * @memberof CatCon.prototype
 * @param level {Integer}	index into the dREL call stack for this category.
 * @param catItemName
 * @return ItemCon
 */
CatCon.prototype.getLoopedItem = function(level, catItemName) {
//	alert("getLoopedItem " + catItemName);
	var itemCtxt;
	if (catItemName in this._itemCons) {
		itemCtxt = this._itemCons[catItemName];
	} else {
		itemCtxt = this._buildNewItem(catItemName); 
	}
	return this._updateItemFromLoop(level, itemCtxt);
};

/**
 * @memberof CatCon.prototype
 * @param catKey {Object} Category key object {presumably hashable}.
 * @param catItemName {string} 
 * @return ItemCon
 */
CatCon.prototype.getKeyedRowItem = function(catKey, catItemName) {
//	this._ctxt.warn(this._name + " get keyed row " + catKey + " item " + catItemName );
	var itemCtxt;
	if (catItemName in this._itemCons) {
		itemCtxt = this._itemCons[catItemName];
	} else {
		itemCtxt = this._buildNewItem(catItemName); 
	}
	return this._updateItemByKey(catKey, itemCtxt);

};

/**
 * Invoked  from a "with a = cat " ; a.getItem
 * retrieves from outermost scope
 * @memberof CatCon.prototype
 * @param itemCtxt
 * @return ItemCon
 */
CatCon.prototype._updateItemFromCache = function(itemCtxt) {
	var stackHeight = this._index.length - 1;
	return this._updateItemFromLoop(stackHeight, itemCtxt); 
};

/**
 * @memberof CatCon.prototype
 * @param catKey {Object} Category key - presumably hashable.
 * @param itemCtxt {ItemCon}
 * @return ItemCon
 */
CatCon.prototype._updateItemByKey = function(catKey, itemCtxt) {
	var rowN = this._loop.getRowByKey(catKey);
	if (rowN == undefined) {
		alert("Can't get nonexistant " +catKey + " keyed row from cat " + this._name); 
		throw new Error("DrelContext: Bad row index " +catKey + " for " + this._name);

	}
	var level = 0; // fudge it
	this._index[level] = rowN;
	return this._updateItemByRow(rowN, level, itemCtxt);
};

/**
 * @memberof CatCon.prototype
 * @param level
 * @param itemCtxt {ItemCon}
 * @return ItemCon
 */
CatCon.prototype._updateItemFromLoop = function(level, itemCtxt) {
	var rowN = this._index[level];
	return this._updateItemByRow(rowN, level, itemCtxt);
};

/**
 * @memberof CatCon.prototype
 * @param rowN
 * @param level
 * @param itemCtxt
 * @return ItemCon
 */
CatCon.prototype._updateItemByRow = function(rowN, level, itemCtxt) {
	var raw;
	try {
		raw = this._loop.getFieldForRow(itemCtxt._name, rowN);
	} catch (e) {
		alert(e);
		throw new Error("DrelContext: " + itemCtxt._name + 
				"inaccessible to " + this._name + " for stack level " + level);
	}

	itemCtxt.reInit(this, level, raw);
	return itemCtxt; 
};

/**
 * Callback by looped item with _purpose = 'Index'
 * @memberof CatCon.prototype
 * @param level
 * @return Integer
 */
CatCon.prototype.getCurrentRow = function(level) {
	var lev;
	if (typeof level === 'undefined') {
		lev = this._index.length -1; // uppermost level
	} else lev = level;
	return this._index[lev];
};


/**
 * Retrieve hierarchically joined looped category
 * @memberof CatCon.prototype
 * @param linkedCatName
 * @return CatCon
 */
CatCon.prototype.getJoinedCat = function(linkedCatName) {
	var catCon = this;
	var joinedCat; 
	if (catCon._parentCat ) {
		if (catCon._parentCat._name == linkedCatName) {
			joinedCat = catCon._parentCat;
		}
		else catCon = catCon._parentCat;
	} 
	if (! joinedCat) {
		if (linkedCatName in catCon._joinSetCats) {
			joinedCat = catCon._joinSetCats[linkedCatName];
		} else {
			throw new Error("DrelContext: No JoinSet category "  +linkedCatName +
					" for " + catItemName + " accessible from " + this._name);
		}
	}
	return joinedCat;
};

/**
 * Called from compiled dREL
 * @memberof CatCon.prototype
 * @param linkedCatName
 * @param catItemName
 * @return ItemCon
 */
CatCon.prototype.getJoinSetItem = function(linkedCatName, catItemName ) {
	var stackHeight = this._index.length - 1;
	if (stackHeight < 0) stackHeight = 0; 
	var catKey = this.getCatKey(stackHeight); // assume working with top of stack 
	// value of key in this loop
	var joinedCat =  this.getJoinedCat(linkedCatName);
	joinedCat.mapify(stackHeight); // use this stacklevel to preemptively hash
	joinedCat.getByKey(catKey);
	//return joinedCat.getItem(catItemName);
	return joinedCat.getLoopedItem(stackHeight,catItemName);
};


/**
 * return the value of the cat key of the current cached row
 * should only occur in list context 
 * @memberof CatCon.prototype
 * @param level
 * @return Object
 */
CatCon.prototype.getCatKey = function(level) {
	var cat_key_ctxt = this.getCatKeyCtxt();
	this._updateItemFromLoop(level, cat_key_ctxt);
	return cat_key_ctxt.__getVal();
};

/**
 * 
 * @memberof CatCon.prototype
 * @return ItemCon
 */
CatCon.prototype.getCatKeyCtxt = function() {
	var cat_key_ctxt = this._cat_key_item;
	if (! cat_key_ctxt) {
		var cat_key_item_name = this._defn.getAttribute(this._ctxt._category_key);
		if (! cat_key_item_name) { 
                   // ddl2 -> ddlm-ism
		   cat_key_item_name = this._defn.getAttribute(this._ctxt._category_keys);
                   if (cat_key_item_name) cat_key_item_name = cat_key_item_name[0];
                }
		if (! cat_key_item_name) 
			throw new Error("DrelContext: No _category_key.item_id for "  +this._name);
		var cat_key_defn = this._ctxt._dict.getItemDefn(cat_key_item_name);
		if (! cat_key_defn) 
			throw new Error("DrelContext: No definition found for " +cat_key_item_name);
		var key_short_name = cat_key_defn.getAttribute(this._ctxt._cat_attribute_id);
		if (! key_short_name) 
			throw new Error("DrelContext: No _name.attribute_id found for " +
					cat_key_item_name);
		key_short_name = key_short_name.toLowerCase();
		if (key_short_name in this._itemCons) {
			cat_key_ctxt =  this._itemCons[key_short_name]; 
		} else {
			cat_key_ctxt = this._buildNewItem(key_short_name); 
		}
		this._cat_key_item = cat_key_ctxt; // save link for future
	}
	if (! cat_key_ctxt) 
		throw new Error("DrelContext: No item context found for " +
				key_short_name + " in " + this._name);
	return cat_key_ctxt;
};


/**
 * Assemble a usable loop structure for looped categories and populate
 * a collection of {ItemCon}s for recognised looped data item names. 
 * @param dict the dictionary
 * @param cif the model
 * @return null
 */
CatCon.prototype.listify = function(dict, cif) {
	this._loop = this._model.listify(); //get loop controller
	this.length = this._loop.getRows();
//	alert( this._name + " : rows " + this.length);
	var tags = this._loop.getTags();
	var nomodel = false; // no longer needed. 
	for (var i = 0; i < tags.length ; i++) { 
		var item_name = tags[i]; // full dict defn name
		// create reusable context items for each looped _data_name 
		try {
			var item = this._ctxt.getItem(item_name, nomodel);
		} catch (e) {
			// add warning to log and continue
			this._ctxt.error(e);
		}
		if (item) {
			this._itemCons[item._shortName] = item;
		} else {
			alert("DrelContext: No context avail. for item " + item_name);
		}
	}
};

/**
 * Equivalent to listify() but used in a hash keyed context.
 * @memberof CatCon.prototype
 * @param stacklevel
 * @return null
 */
// currently only called from dREL .getJoinSetItem() 
CatCon.prototype.mapify = function(stacklevel) {
	var cat_key_ctxt = this.getCatKeyCtxt();
	var key_name = cat_key_ctxt._shortName;
	var hash = {};
	var str = " ";
//	alert ("mapping " + this._name + " with rows " + this.length + " and keyname " + key_name);
//	this.getLoopedItem = function(level, catItemName) {
	for (var i = 0; i < this.length; i++) {
		// potentially we need to build the category key for each row 
		// the item __getVal method calls setValue which updates the model
		var key = this.getByIndex(stacklevel,i).getLoopedItem(stacklevel,key_name).__getVal();
//		alert(this._name + " key " + key_name + " : " + key);
		hash[key] = i;
		str = str + key;
	}
//	alert(" got keys " + str);
	this._loop.setKeyMap(hash);
};

/**
 * Push another level onto the call stack for this Category.
 * @memberof CatCon.prototype
 * @return {integer} size of the stack
 */
CatCon.prototype.pushLoopStack = function() {
    this._index.push(null); // add new loop context
//    this._ctxt.error("pushed " + this._name + " " + (this._index.length)); 
//    alert("pushed " + this._name + " " + (this._index.length)); 
    return this._index.length -1;
};


/**
 * Pop the category call stack at expiry of a "Loop as" construct
 * @memberof CatCon.prototype
 * @return null
 */
CatCon.prototype.popLoopStack = function() {
	this._index.pop(); // remove outer loop stack context
//	this._ctxt.error("popped " + this._name + " " + (this._index.length+ 1)); 
//	alert("popped " + this._name + " " + (this._index.length+ 1)); 
};


/**
 * called from compiled dREL
 * Set stack level index value and return self
 * @memberof CatCon.prototype
 * @param level {Integer}
 * @param numb {Integer}
 * @return CatCon
 */
CatCon.prototype.getByIndex = function(level, numb) {
	this._index[level] = numb;
	return this;
};


/** 
 * Called from getJoinSetItem - indirectly from compiled dREL
 * @memberof CatCon.prototype
 * @param level
 * @param key
 * @return CatCon
 */
CatCon.prototype.getByKey = function(level, key) {
	if (! this._loop) {
		this.listify();
		this.mapify(0); // ????
	}
	this._index[level] = this._loop.getRowByKey(key);
	return this;
};


/**
 * Add a row to the Category model
 * @memberof CatCon.prototype
 * @param table {hashtable}
 * @return null
 */
CatCon.prototype.addRow = function(table) {
	var itemCtxt;
	var level = 0; // loop level
	if (! this._loop) {
		for (var key in table) {
			itemCtxt = this.getItem(key); // create the item here and header in model 
		}
		this.listify();
		this._index[level] = 0; // fudge it
	} else {
		this._index[level] = this._loop.addDummyLoopRow();
	}

//	var str  = "";
	for (var key in table) {
		itemCtxt = this.getItem(key); // create the item here and header in model 
		itemCtxt.reInit(this, level, table[key]); // set the update callback to this
		itemCtxt.setValue(table[key]);   // calls updateLoopedItem ...
//		str = str +" " + key + ":" +table[key] + ",";
	}
//	item._model.refreshView();
//	alert(" add row " + str);
	this.length = this._index[level] + 1;

};


/**
 * Propogate evaluation changes back to the data model via a controller. 
 * @memberof CatCon.prototype
 * @param item {ItemCon}
 * @param level {integer}
 * @param value {object}
 * @return null
 */
CatCon.prototype.updateLoopedItem = function(item, level, value) {
	var rowN = this._index[level];
	try {
		this._loop.setFieldForRow(item._name, rowN, value);
	} catch (e) {
		alert(e);
		throw new Error("DrelContext: No loop map for " + item._name +
				" in category " + this._name);
	}
};





/**
 * Wrap or subclass a CatCon instance when it is used in a loop context.
 * On creation, this increments the CatCon loop stack count, which must be 
 * be correspondingly popped on loop termination.
 * @constructor
 * @param catCon the underlying Category Context to be wrapped.
 */
function LoopCon(catCon) {
  this._cat_con = catCon;
  this._ctxt = catCon._ctxt;
  this.length = catCon.length; // pretend to be an array
  this._level = catCon.pushLoopStack(); // our level in the hierarchy
  this._iter = 0; // current list index
  this._linked  = {};
}

/**
 * Get the ItemCon context corresponding to the _name.object_id catItemName
 * @memberof LoopCon.prototype
 * @param catItemName {string}
 * @return {ItemCon}
 */
LoopCon.prototype.getItem = function(catItemName) {
//   alert("get looped item from LoopCon");
  return this._cat_con.getLoopedItem(this._level, catItemName);
};

/**
 * @memberof LoopCon.prototype
 * @param numb
 * @return LoopCon
 */
LoopCon.prototype.getByIndex = function(numb) {
  this._iter = numb;
//  alert("Loop getByIndex " +this._level + " row  " + numb); 
  this._cat_con.getByIndex(this._level, numb);
  return this;
};

/**
 * @memberof LoopCon.prototype
 * @param key
 * @return LoopCon
 */
LoopCon.prototype.getByKey = function(key) {
  this._iter = key;
  this._cat_con.getByKey(this._level, key);
  return this;
};

/**
 * @memberof LoopCon.prototype
 * @return integer
 */
LoopCon.prototype.popLoopStack = function() {
  // clean up after joinSet cats 
  for (var joined in this._linked) {
    this._linked[joined].popLoopStack();
  }
//  this._cat_con._ctxt.pop(this);
  return this._cat_con.popLoopStack();
};

/**
 * Called from compiled dREL
 * @memberof LoopCon.prototype
 * @param linkedCatName
 * @param catItemName
 * @return ItemCon
 */
LoopCon.prototype.getJoinSetItem = function(linkedCatName, catItemName ) {
  var catKey = this._cat_con.getCatKey(this._level); 
  // value of key in this loop
  var loop_con = this._getLinkedLoop(linkedCatName);
  // sync the category keys in the context cache.
  loop_con.getByKey(catKey);
  return loop_con.getItem(catItemName); 
};

/**
 * @memberof LoopCon.prototype
 * @param linkedCatName
 * @return LoopCon
 */
LoopCon.prototype._getLinkedLoop = function(linkedCatName) {
  if (linkedCatName in this._linked) {
    return this._linked[linkedCatName]; 
  }

  var joinedCat = this._cat_con.getJoinedCat(linkedCatName);

  var loop_con = new LoopCon(joinedCat); // push a new loop on the stack 
  // the issue is that if another dREL method is called 
  // while expecting this keyed row is on the stack, there could be trouble
  // we need to maintain our own joined cat set that pops when we pop
  this._linked[linkedCatName] = loop_con; 
  joinedCat.mapify(loop_con._level); // use this stacklevel to preemptively hash
  return loop_con;
};



/**
 * Wrapper around a category instance when accessed by key, rather than 
 * sequentially by row index.
 * @constructor
 * @param catCon the Category Context instance being wrapped.
 */
function TableCon(catCon) {
  this._cat_con = catCon;
  this.length = catCon.length; // pretend to be an array
  this._key ;
  this._linked  = {};
}

/**
 * @memberof TableCon.prototype
 * @param key
 * @return TableCon
 */
TableCon.prototype.getByKey = function(key) {
  this._key = key;
  return this;
};

/**
 * @memberof TableCon.prototype
 * @param numb
 * @return TableCon
 */
TableCon.prototype.getByIndex = function(numb) {
  //this may well be wrong!!
  this._key = numb;
  return this;
};

/**
 * @memberof TableCon.prototype
 * @param catItemName
 * @return ItemCon
 */
TableCon.prototype.getItem = function(catItemName) {
//   alert("get keyed item from TableCon");
  return this._cat_con.getKeyedRowItem(this._key, catItemName); 
};

/**
 * 
 * Called from compiled dREL
 * @memberof TableCon.prototype
 * @param linkedCatName
 * @param catItemName
 * @return ItemCon
 */
TableCon.prototype.getJoinSetItem = function(linkedCatName, catItemName ) {
  var catKey = this._key;
  // value of key in this loop
  var table_con = this._getLinkedLoop(linkedCatName);
  // sync the category keys in the context cache.
  table_con.getByKey(catKey);
  return table_con.getItem(catItemName); 
};

/**
 * @memberof TableCon.prototype
 * @param linkedCatName
 * @return TableCon
 */
TableCon.prototype._getLinkedLoop = function(linkedCatName) {
  if (linkedCatName in this._linked) {
    return this._linked[linkedCatName]; 
  }

  var joinedCat = this._cat_con.getJoinedCat(linkedCatName);

  var loop_con = new TableCon(joinedCat); 
  // the issue is that if another dREL method is called 
  // while expecting this keyed row is on the stack, there could be trouble
  // we need to maintain our own joined cat set that pops when we pop
  this._linked[linkedCatName] = loop_con; 
  joinedCat.mapify(0); // use dummy stacklevel to preemptively hash
  return loop_con;
};




/**
 * An Item Context is created for every distinct data_name that is accessed 
 * over the lifetime of a given CIF data_block. Used within a Looped Category
 * context, a single ItemCon is recycled (reInit()) for use with each row accessed.
 * @constructor
 * @param context {Context} a reference to the parent data_block's Context.
 * @param {string} lookupName  is the string value of the _data.item name, in DDLm form
 * @param model  {ItemCtrlr} is a reference to either the data_item or its loop_wrapper.
 * @param defn {DictItem} a reference to the dictionary definition of this _data.item
 */
function ItemCon(context, lookupName, model, defn) {
  this._ctxt = context;
  this._name = lookupName.toLowerCase();
  this._defn = defn;
  this._ignoretypes = {'Label':1, 'Label,Symop':1 }; // {'Code':1 } ;  // DDLm-2008 ism
  this._model = model; // {_name, _data, _view, _onViewChange, _updateDepends }

  this._type = null;
  this._container = null;
  this._purpose = null;
  this._dimension = null;
  this._defnMeth ;
  if (! (model instanceof LoopCtrlr) ){ // not during loop creation
    this._ctxt.warn( "Evaluating defn on item creation" + lookupName);
    this._getDefnProperties();
  } 

  this._shortNameRaw = defn.getAttribute(this._ctxt._cat_attribute_id);
  if (this._shortNameRaw) this._shortName = this._shortNameRaw.toLowerCase();
  this._value ;
//  this._eval ;  // place holder for evaluation method
  this._raw ;
  this._updateCatLoop;  // undefined 
  this._updateCatLoopLevel;  // undefined 
  if (this._model && ! (model instanceof LoopCtrlr) ) {
    // if in a loop, don't get raw val
    this._model.addChangeListener(this);
    this._raw = this._model.getRawVal();
  }
//  if (! this._model) alert("No Model supplied for " + this._name);
}

/**
 * callback for ItemCtrlr
 * @memberof ItemCon.prototype
 * @param change
 * @return null
 */
ItemCon.prototype.modelChangedEvent = function(change) {
  // only need this for unlooped attributes.
  alert("updated model " + this._name);
  this._raw = this._model.getRawVal();
};

/**
 * Make local copy of dictionary item definition properties
 * @memberof ItemCon.prototype
 * @return null
 */
ItemCon.prototype._getDefnProperties = function() {
  if (this._ctxt._dict.ddl) {
    // if the ddl isn't loaded, this probably won't work
    this._evalDefinitionMethod(); // reset if needed
  }
  var defn = this._defn;

  this._type = defn.getAttribute(this._ctxt._data_type);
  if (!this._type) {
    throw new Error("dRELcontext " + "No " + this._ctxt._data_type +  
              " for " + this._name );
  }
  if (this._type in this._ignoretypes ) {
     alert ("dRELcontext " + "No idea how to handle data type " +this._type +
           " for " + this._name );
  }
  this._container = defn.getAttribute(this._ctxt._data_container);
  this._purpose = defn.getAttribute(this._ctxt._data_purpose);
  this._dimension = defn.getAttribute(this._ctxt._data_dimension);
  this._default = defn.getAttribute("_enumeration.default");
  if (this._container == 'Matrix' && this._dimension &&
     (this.dimension instanceof Array ) && this.dimension.length == 1) {
    // because DDLm no longer defines 'Vector' type, we gotta do it ourselves
    this._container = 'Vector';
  }
};

/**
 * Evaluate definition method
 * @memberof ItemCon.prototype
 * @return null
 */
ItemCon.prototype._evalDefinitionMethod = function() {

  var func = this._ctxt.getDefnFunction(this._defn, 'definition');
  if (! func) return; 
  // the method exists and was compiled
  try {
    func(this._ctxt, this._ctxt._lib); // the method has side effects.
  } catch (e) {
    alert("failed to evaluate definition method " + this._name + "\n" ); 
    this._ctxt.error("failed to evaluate defn meth. " + this._name + "\n" );
    this._ctxt.error(e);
    throw e;
  }
};
          
/**
 * Called to re-use item from a Category loop
 * @memberof ItemCon.prototype
 * @param parentCat
 * @param level
 * @param val
 * @return null
 */
ItemCon.prototype.reInit = function(parentCat, level, val) {
    this._updateCatLoop = parentCat;
    this._updateCatLoopLevel = level;
    this._raw = val;
    this._value = undefined;
    this._getDefnProperties(); // re eval if required
};

/**
 * Convert a string to an object. This requires an intimate knowledge
 * of various permissible DDLm data types.
 * @memberof ItemCon.prototype
 * @param val
 * @return Object
 */
ItemCon.prototype._decodeRawVal = function(val) {

    if (typeof val == 'undefined') {
      throw new Error("dRELcontext " + "No value found for " + this._name);
    }

    if (val == "?") {  // raw is unknown
      // an 'Index' is automatically generated, on demand, with no algorithm
      if ((this._purpose == 'Index' || this._purpose == 'Assigned') && this._updateCatLoop) {
//   alert("setting index for " +this._name +" " );
        val = this._updateCatLoop.getCurrentRow(this._updateCatLoopLevel);
        if (this._type == 'Index') val = val + 1; // DDLm - start from 1
        this.setValue(val); // force the model to update 
      }
//      else if (this._default) {
//        val = this._default;
//        this.setValue(val); // force the model to update 
//      } 
      else {
        val = undefined;
      }
    }
    else if (val == ".") {  // raw is default
      // load the default if it exists but don't write it to the CIF
      val = this._ctxt.getItemDefault(this, 
            this._updateCatLoop, this._updateCatLoopLevel);
    }

    else if (this._container == "Single") {
    
      if (this._type == "Text" || this._type == "Char" || this._type  =="Symop") {
      } 
      else if (this._type == "Uchar" || this._type == 'Code') {
        if (val && typeof val == 'string')
          val = val.toLowerCase();
        else if (this._container == 'Tuple'  && val instanceof Array) {
          for (var i = 0; i<val.length;i++) {
            val[i] = val[i].toLowerCase();
          }
        }
        else alert( this._name + " has value " + val );
      } 
      else if (this._type == "Index") {
  //      alert(this._name + " Index value " + val);
      }
      else if (this._type == "Integer" || this._type == 'Count' ) {
         if (typeof val == 'string') {
           var out = parseInt(val) ;
           if (out == NaN ) { 
             throw new Error("dRELcontext " + "Error coercing string to int: " + val);
           }
           val = out;
         }
      }
      else if (this._type == "Real") {
         if (typeof val == 'string') {
           var out = parseFloat(val) ;   // not so rigorous!
           if (out == NaN ) { 
             throw new Error("dRELcontext " + "Error coercing string to float: " + val);
           }
           val = out;
         }
      }
      else if (this._type == "Complex") {
         if (val instanceof numeric.T) {
         }
         else if (typeof val == 'string') {
           var out = parseFloat(val) ;   // not so rigorous!
           if (out == NaN ) { 
             throw new Error("dRELcontext " + "Error coercing string to float: " + val);
           }
           val = out;
         }
      }
      else {
        if (! (this._type in this._ignoretypes) ) {
          var messg = "dRELcontext " + "unexpected data type: " + this._type +
            " for " + this._name + " with val " + val;
          this._ctxt.error(messg);
          throw new Error(messg);
        } 
   
      }
    }
    else {
     // this._type = List Matrix, Ref-table or Table
     if (typeof val !== "object") {
       // i.e. it may still be a raw unparsed string ...
          var messg = "dRELcontext " + "unexpected data type: " + this._type +
            " for " + this._name + " with val " + val;
          this._ctxt.error(messg);
          throw new Error(messg);
     }
    }

  return val;
};

/**
 * Invoked within transformed dREL.
 * @return Object
 */
ItemCon.prototype.__getVal = function() {

  // check if value already established
  if (! this._updateCatLoop) {
    // for single unlooped items
    this._raw = this._model.getRawVal();
    if (this._value === this._raw) return this._value;
    this._value = undefined; // erase this 
  } else if (!(typeof this._value == 'undefined')) return this._value;

    var val = this._decodeRawVal(this._raw);  // maybe undefined ...

    if (typeof val == 'undefined') {
      val = this.evaluate();
      // evaluate throws an exception. possible we never get here
      if (typeof val != 'undefined') {
        this.setValue(val); // set and update the model
      }
    }
      
    this._value = val;
    return val;
};

/**
 * Save computed value to the CIF data model. 
 * @memberof ItemCon.prototype
 * @param val
 * @return Object
 */
ItemCon.prototype.setValue = function(val) {
    // should check type and range info
  this._value = val;
  if (this._updateCatLoop) {
    this._updateCatLoop.updateLoopedItem(this, this._updateCatLoopLevel, val); 
    // hopefully the catcon model can update itself
  } else {
    this._updateModel();
  }
  return val;
};

/**
 * Save computed value to the CIF data model. 
 * @memberof ItemCon.prototype
 * @param val
 * @return Object
 */
ItemCon.prototype.setVal = function(val) {
    return this.setValue(val);
};

/**
 * @memberof ItemCon.prototype
 * @return null
 */
ItemCon.prototype._updateModel = function() {
  if (this._model) {
    this._model._updateValue(this._value);
  }
};

/**
 * @memberof ItemCon.prototype
 * @return Object
 */
ItemCon.prototype._definitionMethod = function() {
  var func = this._ctxt.getDefnFunction(this._defn, 'definition') ;

  if (! func) return;
  try {
    // push execution stack
    alert ("Eval definition method ...");
    // execute the compiled dictionary dREL method
       var val =  func(this._ctxt, this._ctxt._lib);
    // the method has side effects.
    return val;
  } catch (e) {
    alert( this._name + ":::" + e);
    this._ctxt.error(this._ctxt.stacktrace(e));
    throw e;
  }

  return "Oops. had a few issues ...";
};



/*
 * Validation method utilities for items
 *
 * isPresent() Is item in instance data? true/false
 * isValuePresent() Is value in instance data? true/false
 * getTextValue() Get text value from instance data textValue
 * getValue() Get value from instance data value
 * evaluate() Return result of Evaluation method result
 * validate() Execute Validation method report file
 */

/**
 * isPresent() Is item in instance data? true/false
 * @memberof ItemCon.prototype
 * @return Boolean
 */
ItemCon.prototype.isPresent = function() {
  model = this._ctxt._block.getItem(low_data_name);
  if ( model) return true;
  return false;
};

/**
 * Is value in instance data? true/false
 * @memberof ItemCon.prototype
 * @return Boolean
 */
ItemCon.prototype.isValuePresent = function() {
  if (! this._updateCatLoop) {
    this._raw = this._model.getRawVal();
  }
  var val = this._raw;  // maybe undefined ...
  if (typeof val == 'undefined') {
    return false; 
  }
  if (val == "?") {  
    return false; 
  }
  
  return true;
};

/**
 * Get text value from instance data textValue
 * @memberof ItemCon.prototype
 * @return String
 */
ItemCon.prototype.getTextValue = function() {
  if (this._updateCatLoop) {
    return this._raw;  // maybe undefined ...
  } 
  this._raw = this._model.getRawVal();
  return this._raw;
};

/**
 * Get value from instance data value
 * @memberof ItemCon.prototype
 * @return Object
 */
ItemCon.prototype.getValue = function() {
  return this._decodeRawVal(this.getTextValue());
};

/**
 * Return result of Evaluation method -> result
 * @memberof ItemCon.prototype
 * @return Object
 */
ItemCon.prototype.evaluate = function() {
  var func = this._ctxt.getDefnFunction(this._defn, 'evaluation') ;
  var result;
  if (func) {
    try {
      // push execution stack
      //          alert ("doing the eval");
      // execute the compiled dictionary dREL method
      result = func(this._ctxt, this._ctxt._lib);
      //          alert("eval " +this._name + " :: " + val);
     
    } catch (e) {
      alert( this._name + ":::" + e);
      throw e;
    }
  }

  if (typeof result == 'undefined') {
    // some registered defaults?
    //  alert ("check for default on " + this._name);
    // this calls this.setValue();
    result = this._ctxt.getItemDefault(this, 
            this._updateCatLoop, this._updateCatLoopLevel);
  }
  return result;
};

/**
 * Execute validation method and assemble a report.
 * <ul>
 * <li>Get raw value.</li>
 * <li>Decode raw value.</li> 
 * <li>Verify data typing and report incongruities.</li>
 * <li>Compute (cif - Calc)/cif  and report delta >0.01</li>
 * <li>Invoke any dictionary defined validation method.</li>
 * </ul>
 * @memberof ItemCon.prototype
 * @return null
 */
ItemCon.prototype.validate = function() {
  var row =0;
  if (this._updateCatLoop) {
    row = this._updateCatLoop.getCurrentRow(this._updateCatLoopLevel);
  }

  if (this._purpose == 'Describe') {
    return;
  }
 
  var raw;
  if (! this._updateCatLoop) { // for single unlooped items
    raw = this._model.getRawVal();
  } else  {                   // for looped items
    raw = this._raw;
  }

  var val;
  try {
    val = this._decodeRawVal(this._raw);  // maybe undefined ...
  } catch (e) {

  }
  
  var a = this._ctxt.validateItem(this._defn, raw, val);
  this._ctxt.reportValidItem(this._name, row, a[0], a[1]);

  if (! this.isValuePresent())  return;

  //this._ctxt.error("QQQ " + this._name + ": " + this._container + ": " +
  //          this._type );
  
  if (this._container == 'Single' && 
            (this._type == 'Real' || this._type == 'Float' )) {
    var evalf = this._ctxt.getDefnFunction(this._defn, 'evaluation') ;
    if (evalf) {
      try {
        var eval = this.evaluate(); 
        var del = val - eval;
        if (val != 0.0 ) { 
          var ratio = Math.abs(del/val);
          if (ratio > 0.01) {
            this._ctxt.builtin.Alert(this,"B","|(cif -Calc)/cif| = " + 
                numeric.prettyPrint(ratio) + " where cif = " + raw + 
                    " and Calc = " + numeric.prettyPrint(eval)   );
          } 
        }
      } catch (e) {
         this._ctxt.builtin.Alert(this,"A","|(cif -Calc)/cif| eval failed " + e);
      }
    }
  }
  
  this._validationMethod(); // calls Throw() on errors
};

/**
 * Compile DDLm validation method
 * Collate dependencies and verify their presence in the CIF.
 * @memberof ItemCon.prototype
 * @return null
 */
ItemCon.prototype._validationMethod = function() {
  var deps = this._ctxt.getDefnFuncDepends(this._defn, 'validation') ;
  if (deps) {
    var items = deps['items'];
    var thisname = this._name.toLowerCase();
    var ctxt = this._ctxt;
    for (var dep in items) {
//       if (name == thisname) 
       var depname = dep.split('.');
       var cat_name = depname[0].substring(1); // strip leading '_'
       var item = depname[1];
       var cat = ctxt.getCategory(cat_name);    
       // getItem maps to getItemFromCache which pulls toplevel cache row
       if (! cat.hasItem(item) || ! cat.getItem(item).isValuePresent()) {
         if (dep == thisname)  { return; }
         ctxt.builtin.Throw(this,"Dependent item " + dep + " is missing.");
       } 
       //this._ctxt.info("Validating " + thisname + ":  dependency " +
       //         dep + " is present.");
    }
  }

  var func = this._ctxt.getDefnFunction(this._defn, 'validation') ;
  if (! func) return;
  try {
      // push execution stack
      // alert ("Eval validation method ...");
      // execute the compiled dictionary dREL method
      var val =  func(this._ctxt, this._ctxt._lib);
      // the method has side effects.
      //return val;
      return  "Success for '" + this._raw ;
  } catch (e) {
      this._ctxt.error(this._ctxt.stacktrace(e));
      throw e;
  }
  return "Oops. had a few issues ...";
};



/**
 * @constructor
 * @param context {Context}
 * @param lookupName {String} DDLm function name
 * @param defn {ItemDefn} Dictionary definition reference.
 */
function FunCon(context, lookupName, defn) {
  this._ctxt = context;
  this._name = lookupName;
  this._defn = defn;
  this._type = defn.getAttribute(this._ctxt._data_type);
  this._container = defn.getAttribute(this._ctxt._data_container);
  this._purpose = defn.getAttribute(this._ctxt._data_purpose);
  this._shortName = defn.getAttribute(this._ctxt._cat_attribute_id);
  if (this._shortName) this._shortName = this._shortName.toLowerCase();
}

/**
 * This is invoked directly from compiled dREL.
 * @memberof FunCon.prototype
 * @return {Object}
 */
FunCon.prototype.apply = function() {
	// arguments is a list of arguments passed to function call

	var func = this._ctxt.getDefnFunction(this._defn, 'evaluation') ;
	var val;
	if (func)  {
		try {
//			alert ("doing the eval");
			// execute the compiled dictionary dREL method
			val = func(this._ctxt, this._ctxt._lib, arguments);
			// the method has side effects.
			if (val == undefined) {
				val = this._value; // presumably now established
			}
//			alert(this._name + " success! :: " + val);
		} catch (e) {
			alert( this._name + ":::" + e);
			throw e;
		}
	}
	return val;
};

/** 
 * @memberof FunCon.prototype
 * @param val
 * @return null
 */
FunCon.prototype.setValue = function(val) {
	this._value = val;
};

/** 
 * @memberof FunCon.prototype
 * @param val
 * @return null
 */
FunCon.prototype.setVal = function(val) {
	return this.setValue(val);
};



/**
 * This is a wrapper around a dictionary access object.
 * It is called by Context.getDefn()
 * @constructor
 * @param context
 * @param defn
 */
function ContextSysDefnWrapper(context, defn ) {
   this._ctxt = context; 
   this._defn = defn;
}

/**
 * 
 * @param attrib
 * @return {Object} Attribute reference from the dictionary.
 */
ContextSysDefnWrapper.prototype.getAttributeRef = function(attrib ) {
     var aref = this._defn.getAttributeRef(this._ctxt, attrib);
     return aref;
};


/**
 * Context() refers to the "Execution Context", within which all
 * evaluations or validations take place.
 * There is one Context() created for each data_block in a CIF.
 * 
 * An execution Context is passed to every dREL method as its 
 * first argument (the second argument is the function library).
 *
 * External callers can invoke actions by the Context  via the
 * instance's call(type, viewName, model) function.
 *
 * @constructor
 * @param jsdict {MetaDict}
 * @param jscif   {CifCtrlr}
 * @param jsblock {BlockCtrlr}
 * @param globals {BlockCtrlr} List of preceeding global_ blocks.
 * @param logger	{CifJs}
 * @param vldnHandler {ValidationBase}
 */
function Context(jsdict, jscif, jsblock, globals, logger, vldnHandler) {
  this._dict = jsdict; 
  this._cif = jscif; 
  this._block = jsblock;  // this is the primary data_block we are dealing with
  this._globals = [];
  for (var i = 0; i<globals.length; i++) { this._globals.push(globals[i]);}
  this._lib = new Library();  

  this._logger = logger;
  this._vhandle = vldnHandler;
  this._initial = {};
  for (var item in jsblock._items) {
    this._initial[item] = jsblock[item];
  }

  this._callStack = [];
  this._categories = {}; // assume all hierarchy category names are unique!
  this._items = {};      // and all toLowerCase()
  this._functions = {};
  this.builtin =  new BuiltInFuncs() ;

  this.stacktrace = function() {
    return new Error().stack;
  };
  this.stacktrace1 = function() {
    // this don't work. WTH?
    function st2(f) {
      return !f ? [] : 
        st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + f.arguments.join(',') + ')']);
    }
    return st2(arguments.callee.caller);
  };

  for (var key in this._dict._ddl_map) {
    this[key] = this._dict._ddl_map[key];
  }
}

Context.prototype._log = function(data) {
  if (this._logger) this._logger.log(data); 
};
Context.prototype.debug = function(data) {
  if (this._logger) this._logger.debug(data); 
};
Context.prototype.info = function(data) {
  if (this._logger) this._logger.info(data); 
};
Context.prototype.warn = function(data) {
  if (this._logger) this._logger.warn(data); 
};
Context.prototype.error = function(data) {
  if (this._logger) this._logger.error(data); 
};
Context.prototype.fatal = function(data) {
  if (this._logger) this._logger.fatal(data); 
};


/**
 * External methods and callers can invoke actions by the 
 * current instance of the Context by calling 
 * contextInstance.call(type, viewname, model);
 *
 *  Where type is one of: 
 *  <ul>
 *   <li> singleItem, 'singleItemDefn', 'singleItemValid'</li>
 *   <li> loopItem, 'loopItemDefn', 'ItemValid'</li>
 *   <li> GenCat,</li>
 *   <li> AddCat,</li>
 *   <li> Validate,</li>
 *   </ul>
 * @memberof Context.prototype      
 * @param type
 * @param viewName 
 * @param model   {Ctrlr}
 * @return {ItemCtxt} or null
 */
Context.prototype.call = function(type, viewName, model) {
  //var lookupName = viewName.toLowerCase(); 
  var lookupName = viewName;

  if (type == 'singleItem') {
    var item_ctxt;
    if (lookupName in this._items) {
      item_ctxt = this._items[lookupName]; 
    } else {
      //var defn = this._dict.hasItem(lookupName); 
      var defn = this._dict.hasItem(lookupName.toLowerCase()); 
      if (! defn) {
         alert("Context Eval for undefined item defn. Huh?");
         return null;
      }
      item_ctxt = new ItemCon(this, defn._name, model, defn);
      this._items[defn._name] = item_ctxt;
    }
    try {
      var val = item_ctxt.__getVal();
      alert("Eval result: " + val);
    } catch (e) {
      var messg ="Eval failed for: " + lookupName + "\n" + e ; 
      alert(messg);
      this.error(messg);
      throw e;
    }
    return item_ctxt;

  } else if (type == 'singleItemDefn') {
    var item_ctxt;
    if (lookupName in this._items) {
      item_ctxt = this._items[lookupName]; 
    } else {
      //var defn = this._dict.hasItem(lookupName); 
      var defn = this._dict.hasItem(lookupName.toLowerCase()); 
      if (! defn) {
         alert("Context Eval for undefined item defn. Huh?");
         return null;
      }
      item_ctxt = new ItemCon(this, lookupName, model, defn);
      this._items[lookupName] = item_ctxt;
    }
    try {
      var val = item_ctxt._definitionMethod();
      alert("Eval result: " + val);
    } catch (e) {
      var messg ="Eval failed for: " + lookupName + "\n" + e ; 
      alert(messg);
      this.error(messg);
      throw e;
    }
    return item_ctxt;

  } else if (type == 'singleItemValid') {
    var item_ctxt;
    if (lookupName in this._items) {
      item_ctxt = this._items[lookupName]; 
    } else {
      //var defn = this._dict.hasItem(lookupName); 
      var defn = this._dict.hasItem(lookupName.toLowerCase()); 
      if (! defn) {
         alert("Context validation for undefined item defn. Huh?");
         return null;
      }
      item_ctxt = new ItemCon(this, lookupName, model, defn);
      this._items[lookupName] = item_ctxt;
    }
    try {
      var val = item_ctxt._validationMethod();
      alert("Valid result: " + val);
    } catch (e) {
      var messg ="Validation failed for: " + lookupName + "\n" + e ; 
      alert(messg);
      this.error(messg);
      // throw e;
    }
    return item_ctxt;

  } else if (type == 'loopItem') {
    var defn = this._dict.hasItem(lookupName.toLowerCase()); 
    if (! defn) {
      alert("Context Eval for undefined item defn " + viewName + ". Huh?");
      return null;
    }
    var cat_item_name = defn.getAttribute(this._dict._cat_attribute_id);
//    cat_item_name = cat_item_name.toLowerCase();
    var cat_name;
    if (defn._category) cat_name = defn._category._name.toLowerCase();
        // this is broken for the new DDLm, sigh ...
    else cat_name = defn.getAttribute(this._dict._item_category);
 
    var loop_cat_con = this.getCategoryAsList(cat_name);
    try {
      for (var i = 0; i < loop_cat_con.length; i++) {
//        alert("get row " + i);
        loop_cat_con.getByIndex(i).getItem(cat_item_name).__getVal();
        // the item __getVal method calls setValue which updates the model
      }
      alert("Eval complete for: " + lookupName );
    } catch (e) {
      if (i>0 && loop_cat_con) { 
         var cat_item = loop_cat_con.getByIndex(0).getItem(cat_item_name);
         if (cat_item && cat_item._model) cat_item._model.refreshView();
      } 
      var messg ="Eval failed for: " + lookupName + "\n" + e ; 
      alert(messg);
      this.error(messg);
      throw e;
    } finally {
//      alert("Popping the loop for "+ cat_name );
      loop_cat_con.popLoopStack();
    }
//    this._dumpCatStacks();
    
  } else if (type == 'loopItemDefn') {
    var defn = this._dict.hasItem(lookupName.toLowerCase()); 
    if (! defn) {
      alert("Context Defn Eval for undefined item defn " + viewName + ". Huh?");
      return null;
    }
    var cat_item_name = defn.getAttribute(this._dict._cat_attribute_id);
//    cat_item_name = cat_item_name.toLowerCase();
    var cat_name;
    if (defn._category) cat_name = defn._category._name.toLowerCase();
        // this is broken for the new DDLm, sigh ...
    else cat_name = defn.getAttribute(this._dict._item_category);
 
    var loop_cat_con = this.getCategoryAsList(cat_name);
    try {
      for (var i = 0; i < loop_cat_con.length; i++) {
//        alert("get row " + i);
        loop_cat_con.getByIndex(i).getItem(cat_item_name)._definitionMethod();
      }
      alert("Defn Eval complete for: " + lookupName );
    } catch (e) {
      if (i>0 && loop_cat_con) { 
         var cat_item = loop_cat_con.getByIndex(0).getItem(cat_item_name);
         if (cat_item && cat_item._model) cat_item._model.refreshView();
      } 
      var messg ="Defn Eval failed for: " + lookupName + "\n" + e ; 
      alert(messg);
      this.error(messg);
      throw e;
    } finally {
      loop_cat_con.popLoopStack();
    }
    
  } else if (type == 'GenCat') {
    var defn = this._dict.hasCategory(lookupName.toLowerCase()); 
    if (! defn) {
      alert("Context Eval for undefined cat defn " + viewName + ". Huh?");
      return null;
    }
//    var cat_item_name = defn.getAttribute("_name.attribute_id");
    var cat_item_name = defn.getAttribute(this._dict._cat_attribute_id);
//    cat_item_name = cat_item_name.toLowerCase();
//    var cat_name = defn.getAttribute("_name.category_id");
    try {
      var cat_con = this.getCategory(lookupName.toLowerCase());
      //cat_con.evaluate();
    } catch (e) {
      var messg ="Eval failed for category : " + lookupName + "\n" + e ; 
      alert(messg);
      this.error(messg);
      throw e;
    }

  } else if (type == 'AddItem') {
    var defn = this._dict.hasItem(lookupName.toLowerCase()); 
    if (! defn) {
      alert("Context Eval for undefined item defn " + viewName + ". Huh?");
      return null;
    }
    var item_con = this.getItem(lookupName.toLowerCase());

  } else if (type == 'AddCat') {
    var defn = this._dict.hasCategory(lookupName.toLowerCase()); 
    if (! defn) {
      alert("Context Eval for undefined cat defn " + viewName + ". Huh?");
      return null;
    }
    var cat_con = this.getCategory(lookupName.toLowerCase());

  } else if (type == 'validate') {
    alert("Validate called for data block " + model._name);
    this.validateBlock();

  } else if (type == 'EvalAllMissing') {
    alert("Eval all missing for data block " + model._name);
    this.resolveAllUnknowns();
  } else {
    alert("Eval called for: " + type + " on " + lookupName);
  }

  if (lookupName in this._categories) {
    
  } else {

  }
};

/**
 * @memberof Context.prototype
 * @param name {String} The DDLm _definition.id or an alias _item.name
 * @return {ItemCtrlr}
 */
Context.prototype.blockHasItem = function(name) {
  var lname = name.toLowerCase();
  var defn = this._dict.getItemDefn(lname); 
  if (! defn) return null;
  var aliases = defn.getAliases();
  if (aliases) aliases.push(lname);
  else aliases = [lname];
  var blk = this._block;
  for (var i=0; i< aliases.length;i++ ) {
    var item = blk.getItem(aliases[i].toLowerCase()); 
    if (item) return item;
  }
  return null;
};

/**
 * Get a dictionary item definition as a wrapped object 
 * (within a dREL method?).
 * @memberof Context.prototype
 * @param lookupName
 * @return {ContextSysDefnWrapper}
 */
Context.prototype.getDefn = function(lookupName) {
  var defn = this._dict.getItemDefn(lookupName.toLowerCase()); 
  var defnWrap = new ContextSysDefnWrapper(this, defn);
  return defnWrap;
};

/**
 * Get an established {ItemCon} creating a new one if necessary.
 * @param data_name
 * @param nomodel
 * @return {ItemCon}
 */
Context.prototype.getItem = function(data_name, nomodel) {
  var low_data_name = data_name.toLowerCase();
  if (low_data_name in this._items) {
    return this._items[low_data_name];
  }

  var defn = this._dict.getItemDefn(low_data_name);
  if (! defn) {
    throw new Error("dRELcontext " + "No dict item definition found for " + 
      data_name);
  }

  // not supplied for unlooped items
  var model;
  if (nomodel) { 
    // create a dummy model??? Nah.
  } else { 
    model = this._block.getItem(low_data_name);
    if (! model && defn.hasAliases() ) {
      var aliases = defn.getAliases();
      for (var i=0; i< aliases.length; i++) {
        model = this._block.getItem(aliases[i]);
        if (model) break;
      }
    }
    if (! model) {
//      alert(" adding empty item to cif: " + data_name);
      model = this._cif.addItem(this._block, data_name);  // real full case name
    }
    if (! model) {
      throw new Error("dRELcontext " + "No model for " + data_name );
    }
  }

  // where does model come from ????? - i.e. the CIF data
  var item_ctxt = new ItemCon(this, data_name, model, defn);
  this._items[low_data_name] = item_ctxt;
  return item_ctxt;
};

/**
 * Get a {FunCon} object for evaluating dREL methods
 * @memberof Context.prototype
 * @param func_name
 * @return {FunCon}
 */
Context.prototype.getFunction = function(func_name) {
  if (func_name in this._functions) {
    return this._functions[func_name];
  }

  var func_cat = this._dict.hasCategory('function'); // this is a dubious call
  if (! func_cat) {
    throw new Error("dRELcontext " + "No dict category definition for functions" +
      func_name);
  }
  var func_def = func_cat.getItemByAttributeId(func_name);
  if (! func_def) {
    throw new Error("dRELcontext " + "No dict function definition for " + 
      func_name);
  }
  
  var func_ctxt = new FunCon(this, func_name, func_def);
  this._functions[func_name] = func_ctxt;
  return func_ctxt;

};

/**
 * Create a  context container for a given category, and pre-emptively,
 * all of its linked-set categories.
 * @memberof Context.prototype
 * @param catty_name
 * @return {CatCon}
 */

Context.prototype.getCategory = function(catty_name) {
  var cat_name = catty_name.toLowerCase();
  if (cat_name in this._categories) {
    return this._categories[cat_name];
  }

  var defn = this._dict.hasCategory(cat_name);
  if (! defn) {
    throw new Error("dRELcontext " + "No dict category definition found for " + 
      cat_name);
  }

  var joinSet = this._dict.getJoinedCats(cat_name);
  if (!(cat_name in joinSet)) {
    joinSet[cat_name] = defn;
  }
  var setRoot = null;
  var linked = {}; 
  var potentialEval = false;
/*
  var x = "";
  for (var catid in joinSet) {
    x = x +catid + ", ";
  }
  alert(cat_name + " linked to " +  x);
 */
  for (var catid in joinSet) {
    var linkedCatDefn = joinSet[catid];

    var model = this._block.getCategory(catid);
    if (! model) {
      this.info("Creating category " + catid );
      if (catid == cat_name)  potentialEval = true;
      model = this._cif.addCategory(this._block, catid); 
    }
    if (! model) {
      throw new Error("dRELcontext " + "No model for Category" + catid );
    }
  
    if (catid in this._categories) {
      throw new Error("dRELcontext " + "Aborted duplicate create of Category context for" + catid );
    }
    var cat_ctxt = new CatCon(this, catid, model, linkedCatDefn);
    this._categories[catid] = cat_ctxt;
    if (linkedCatDefn.getAttribute(this._join_set)) {
      linked[catid] = cat_ctxt;
      continue;
    } else {
      if (this._dict._ddl_version == 'DDLm') {
        // DDLm uses looped sub_category encapsulation instead of a tag...
        var parnt = linkedCatDefn._category;
        if (parnt) {
          var klass = parnt.getAttribute('_definition.class');
          if (klass && klass.toLowerCase() == 'loop') {
            linked[catid] = cat_ctxt;
            continue;
          }
        }
      }
      if (setRoot) {
        throw new Error("dRELcontext " + "Duplicate joinSet roots for " + 
           catid + " and " + cat_name );
      }
      setRoot = cat_ctxt;
    }
  }

  for (var catid in linked) {
    linked[catid]._parentCat = setRoot;
//  linked[catid]._index = setRoot._index;// all use the setRoot call stack //ddb
  }
  setRoot._joinSetCats = linked;

  if (potentialEval) {
    this._categories[cat_name].evaluate();
  }

  return  this._categories[cat_name];
};

/**
 * Called from transformed dREL "loop as"
 * @memberof Context.prototype
 * @param cat_name
 * @return {LoopCon}
 */

Context.prototype.getCategoryAsList = function(cat_name) {
  var cat = this.getCategory(cat_name);

  var joincats;
  var parentCat;
  if (cat._parentCat) {
    parentCat = cat._parentCat;
    if (parentCat._loop == undefined)
      parentCat.listify(this._dict, this._cif);
//    parentCat.pushLoopStack();
    joincats = parentCat._joinSetCats;
    // of which var cat is one.
  } else {
    // var cat is the joinset root cat
    parentCat = cat;
    if (cat._loop == undefined)
      cat.listify(this._dict, this._cif);
//    cat.pushLoopStack();
    joincats = cat._joinSetCats;
  } 
  for (var catid in joincats) {
    var childCat = joincats[catid];
    if (childCat._loop == undefined)
      childCat.listify(this._dict, this._cif);
//    if (childCat === cat) 
//      childCat.pushLoopStack();
  }


  var loopCon = new LoopCon(cat);  // wrap listable cat in a new Loop.  
//  this._callStack.push([cat_name, loopCon]);
  return loopCon;
};

/**
 * Called from transformed dREL  via a category[subscript] notation
 * @memberof Context.prototype
 * @param cat_name
 * @return {TableCon}
 */
Context.prototype.getCategoryAsTable = function(cat_name) {
  var cat = this.getCategory(cat_name);

  var joincats;
  var parentCat;
  var stackHeight = cat._index.length - 1;
  if (stackHeight < 0) stackHeight = 0; 
  if (cat._parentCat) {
    parentCat = cat._parentCat;
    if (parentCat._loop == undefined)
      parentCat.listify(this._dict, this._cif);
      parentCat.mapify(stackHeight); 
//    parentCat.pushLoopStack();
    joincats = parentCat._joinSetCats;
    // of which var cat is one.
  } else {
    // var cat is the joinset root cat
    parentCat = cat;
    if (cat._loop == undefined)
      cat.listify(this._dict, this._cif);
      cat.mapify(stackHeight); 
//    cat.pushLoopStack();
    joincats = cat._joinSetCats;
  } 
  for (var catid in joincats) {
    var childCat = joincats[catid];
    if (childCat._loop == undefined) { 
      childCat.listify(this._dict, this._cif);
      childCat.mapify(stackHeight); 
    }
    if (childCat === cat) {
//      childCat.pushLoopStack();
    }
  }

  var tableCon = new TableCon(cat);  // wrap associative array Cat in a Table 
//  There is no pushloop and no poploop on the underlying Cat
//  As long as access is strictly maintained via the 'tableCon'text, we 
//  *might* be ok.
  return tableCon;
};


/**
 * Used internally to retrieve default values for items.
 * @memberof Context.prototype
 * @param item_ctxt
 * @param parent_loop_ctxt
 * @param level
 * @return {Object}
 */
Context.prototype.getItemDefault = function(item_ctxt, parent_loop_ctxt, level) {
  if (parent_loop_ctxt) { 
    if (this._dict._ddl_version == 'DDL_star') {
      // this is ad-hoc bullshit.
      // look in dict for cat default store
      var cat_defaults = this._dict.getCatDefaults(parent_loop_ctxt._name);
      if (!cat_defaults && parent_loop_ctxt._parentCat) {
        cat_defaults = this._dict.getCatDefaults(parent_loop_ctxt._parentCat._name);
      }
      if (!cat_defaults) {
        alert("no defaults for " + item_ctxt._name);
        return;
      }
      var cat_key = parent_loop_ctxt.getCatKey(level);
  //    alert(" got CatKey " + cat_key + " for " + parent_loop_ctxt._name );
      
      var row_defaults = cat_defaults[cat_key];
  //    alert(row_defaults);
      var short_name = item_ctxt._shortName;
      if (short_name in row_defaults) {
        var val = row_defaults[short_name];
//        item_ctxt.setValue(val);  // trigger model update
        return val;
      } 
      short_name = item_ctxt._shortNameRaw;
      if (short_name in row_defaults) {
        var val = row_defaults[short_name];
//        item_ctxt.setValue(val);  // trigger model update
        return val;
      } 
    } else if (this._dict._ddl_version == 'DDLm') {
      if (item_ctxt._purpose == 'Describe') return;
      var index_item_name = item_ctxt._defn.getAttribute('_enumeration.def_index_id');
      var enum_deflt = item_ctxt._defn.getAttribute('_enumeration.default');
      if (index_item_name) {
        if (index_item_name == item_ctxt._name) {
          throw new Error("dRELcontext " + 
         "To avoid an infinite loop whilst being unable to resolve " + index_item_name + ", an Exception has been raised. Please review the dictionary definition!"); 
        }

        var index_item = this.getItem(index_item_name); // create context object 
        var short_name = index_item._shortName;
        var item = parent_loop_ctxt._defn.getItemByAttributeId(short_name); 
        var index_val;
        if (item) {
          index_item = parent_loop_ctxt.getItem(short_name); // load
          index_val = index_item.__getVal(); 
        } else {
          var joinSet = this._dict.getJoinedCats(parent_loop_ctxt._name);
          for (var catid in joinSet) {
            item = joinSet[catid].getItemByAttributeId(short_name);
            if (item) {
               alert("getJoin" +  parent_loop_ctxt._name + "catid " + catid + " : " + short_name);
               index_item = parent_loop_ctxt.getJoinSetItem(catid,short_name);
               index_val = index_item.__getVal(); 
               break;
            }
          }
        }
        if (index_val) {
          index_val = index_val.toLowerCase(); // is this really a good idea?
          var defn = item_ctxt._defn;
          var enumDefault = defn.getAttribute('_enumeration_default.value');
          if (!enumDefault) {
            var enumData = defn.getAttributeLoop('_enumeration_default.value');
            if (enumData) {
              var tags = enumData.map;
              var rows = enumData.rows;
              for (var i = 0; i< rows.length; i++ ) {
                if (rows[i][tags['_enumeration_default.index']].toLowerCase() == 
                     index_val) {
                  enumDefault = rows[i][tags['_enumeration_default.value']];
                  break;
                }
              }
            }
          }
//          alert (" enumerate lookup index value for " + index_item_name + " is " + index_val + ' and  ' + enumDefault); 
          // do we need to coerce it?
          if (enumDefault) {
            if (item_ctxt._type == 'Real') 
                enumDefault = parseFloat(enumDefault);
            else if (item_ctxt._type == 'Integer') 
                enumDefault = parseInt(enumDefault);
            else if (item_ctxt._type == 'Uchar' )  
                enumDefault = enumDefault.toLowerCase();
            else if (item_ctxt._type == 'Code' )   
                enumDefault = enumDefault.toLowerCase();
//            item_ctxt.setValue(enumDefault);  // trigger model update
            return enumDefault;
          }
        } else {
          alert (" no enumerate lookup index value for "+ index_item_name); 
        }
      } else if(enum_deflt) {
        if (item_ctxt._type == 'Real') 
          enum_deflt = parseFloat(enum_deflt);
        else if (item_ctxt._type == 'Integer') 
          enum_deflt = parseInt(enum_deflt);
        else if (item_ctxt._type == 'Uchar' )  
          enum_deflt = enum_deflt.toLowerCase();
        else if (item_ctxt._type == 'Code' )   
          enum_deflt = enum_deflt.toLowerCase();
        return enum_deflt;
      } else {
         alert("No default loading mechanism implemented for " + item_ctxt._defn._name); 
      }
    } else { 
      alert("No default loading mechanism for " + this._dict._ddl_version); 
    }
  }
  else {
    if (item_ctxt._purpose == 'Describe') return;
   // not looped.
    var val = item_ctxt._defn.getAttribute('_enumeration.default'); 
    if (val) {
      if (item_ctxt._type == 'Real') val = parseFloat(val);
      else if (item_ctxt._type == 'Integer') val = parseInt(val);
      else if (item_ctxt._type == 'Uchar' )  val = val.toLowerCase();
      else if (item_ctxt._type == 'Code' )   val = val.toLowerCase();
//      item_ctxt.setValue(val);  // trigger model update
      return val; 
    }
  }
  alert(" No default available for  " + item_ctxt._name);
   
};

/**
 * Retrieve compiled dREL Definition method from dictionary
 * @memberof Context.prototype
 * @param defn
 * @param purpose
 * @return {Function}
 */
Context.prototype.getDefnFunction = function(defn, purpose) {
  return this._dict.getDefnFunction(defn, purpose, this._lib);
};

/**
 * Retrieve collated dREL Definition method dependencies from dictionary
 * Internal method.
 * @memberof Context.prototype
 * @param defn
 * @param purpose
 * @return {Function}
 */
Context.prototype.getDefnFuncDepends = function(defn, purpose) {
  return this._dict.getDefnFuncDepends(defn, purpose, this._lib);
};

/**
 * External API function implemantation.
 * Search CIF data model for all unknwn "?" items and compute them
 * where possible.
 * @memberof Context.prototype
 * @return null
 */
Context.prototype.resolveAllUnknowns = function() {

  for (var name in this._initial) {
  try {
    var item = this.getItem(name);
    if (item._purpose == 'Describe') {
      continue;  // can't eval descriptive items
    }
    var cat_item_name = item._shortName;
    var item_defn = item._defn;
    var cat_name;
    if (item_defn._category) cat_name = item_defn._category._name.toLowerCase();
        // this is broken for the new DDLm, sigh ...
    else cat_name = item_defn.getAttribute(this._dict._item_category);
    var cat = this._dict.getCategory(cat_name);
    var has_key = cat.getAttribute(this._dict._category_key);
    if (! has_key) {
      has_key = cat.getAttribute(this._dict._category_keys);
    }
    if (has_key) {
//      alert(has_key);
      var loop_cat_con = this.getCategoryAsList(cat_name);
      this.warn("Calculate " + name + " as loop");
      for (var i = 0; i < loop_cat_con.length; i++) {
        try {
          var val = loop_cat_con.getByIndex(i).getItem(cat_item_name).__getVal();
        } catch (e) {
          alert(e);
        }
      }
      loop_cat_con.popLoopStack();
    } else {
      this.warn("Calculate " + name );
      var val = item.__getVal();
    }
        } catch (e) {
          alert( name + " : " + e);
        }
  }
//  this._dumpCatStacks();
};

/**
 * External API function implemantation.
 * Validate contents of all recognised CIF data items in the data_ block
 * where possible.
 * @memberof Context.prototype
 * @return null
 */
Context.prototype.validateBlock = function() {
  this._vhandle.resetBlock(this._block._name );
  this._vhandle.addBlock(this._cif, this._block._name );
  
  for (var name in this._initial) {
    try {
      var item = this.getItem(name);
      var cat_item_name = item._shortName;
      var item_defn = item._defn;
      var cat_name;
      if (item_defn._category) cat_name = item_defn._category._name.toLowerCase();
          // this is broken for the new DDLm, sigh ...
      else cat_name = item_defn.getAttribute(this._dict._item_category);
      var cat = this._dict.getCategory(cat_name);
      var has_key = cat.getAttribute(this._dict._category_key);
      if (! has_key) {
        has_key = cat.getAttribute(this._dict._category_keys);
      }
      if (has_key) {
  //      alert(has_key);
        var loop_cat_con = this.getCategoryAsList(cat_name);
        for (var i = 0; i < loop_cat_con.length; i++) {
          try {
            loop_cat_con.getByIndex(i).getItem(cat_item_name).validate();
          } catch (e) {
            alert(e);
          }
        }
        loop_cat_con.popLoopStack();
      } else {
        item.validate();
      }
    } catch (e) {
      alert( name + " : " + e);
    }
  }

};

/**
 * Invoke (shallow currently...) Type checking based on string regexes.
 * @memberof Context.prototype
 * @param defn {ItemDefn}
 * @param raw  {string} [or List or Table] CIF text representation of item.
 * @param val  {Object} Decoded Object representation.
 * @return null
 */
Context.prototype.validateItem = function(defn, raw, val) {
  return this._vhandle.checkType(defn, raw);
};

/**
 * Propogate DDLm Validation algorithm results to validation result handler.
 * @param name
 * @param row
 * @param type
 * @param range
 * @return null
 */
Context.prototype.reportValidItem = function(name, row, type, range) {
  // this._ctxt.reportValidItem(this._name,true, true);
  this._vhandle.addItem(this._block._name, name, row, type, range);
};


Context.prototype._dumpCatStacks = function() {
  this.error("---------POST EXECUTION STACK---------------");
  for (var cat_name in this._categories) {
    var cat = this._categories[cat_name]; 
    var indices = cat._index; 
    var str = "";
    for (var i=0; i<indices.length; i++) {
      str =  str + " : " + indices[i]; 
    }
    this.error( cat_name + "     " + indices.length + "  " + str);
  } 
};



/**
 * BuiltinFuncs is a container for built in functions, mostly taking {ItemCon} or 
 * {CatCon} object references as arguments. These contrast with the general Library
 * functions which operate purely on values.
 * In general these functions may appear in dREL methods though in simpler 
 * form - with implied arguments, or wrapped arguments.
 * @constructor
 *
 */
function BuiltInFuncs() { };

/**
 * Retrieve Contents of a definition from one item for run-time 
 * injection into another item defintion.
 * 
 * @memberof BuiltInFuncs.prototype
 * @param  itemCtxt {ItemCom} 
 * @return {string} value of the item's definition.
 */
BuiltInFuncs.prototype.Type_Contents = function(itemCtxt) {
  try {
    return  itemCtxt._defn.getAttribute('_type.contents');
  } catch (e) {
    alert("Failed call of Type_Contents  with arg " + itemCtxt); 
    throw e;
  }
};

/**
 * Sometimes in a Loop context, we do actually need to know the 
 * index of the current row.
 * @memberof BuiltInFuncs.prototype
 * @param catCtxt
 * @return {Integer}
 */
BuiltInFuncs.prototype.Current_Row = function(catCtxt) {
  try {
    return catCtxt.getCurrentRow();
  } catch (e) {
    alert("Failed call of Current_Row  with arg " + catCtxt); 
    throw e;
  }
};

/**
 *  This function is guaranteed to throw an exception.
 *  Hopefully we catch it higher up the call stack...
 *  dREL does not implement Exception handling, so this is merely
 *  a function call that never returns as far as dREL methods are
 *  concerned.
 * @memberof BuiltInFuncs.prototype
 * @param  itemCtxt {ItemCom} 
 * @param  fault 
 * @return {string} value of the item's definition.
 */
BuiltInFuncs.prototype.Throw = function(itemCtxt, fault) {
  try {
//    alert(itemCtxt._name + " " +  fault);
    var ctxt = itemCtxt._ctxt;
    var row = 0;
    if (itemCtxt._updateCatLoop) {
       row = itemCtxt._updateCatLoop.getCurrentRow();
    }
    ctxt._vhandle.appendItem(ctxt._cif, ctxt._block._name, itemCtxt._name, row, fault); 
  } catch (e) {
    alert("Failed call of Throw() with arg " +  fault); 
    throw e;
  }
  throw new Error("Validation error for " + itemCtxt._name + " : " +fault);
};

/**
 * Propogate a warning message to the Validation response handler.
 * What it does with it is completely out of dREL scope.
 * @memberof BuiltInFuncs.prototype
 * @param itemCtxt
 * @param level
 * @param message
 * @return null
 */
BuiltInFuncs.prototype.Alert = function(itemCtxt, level, message) {
  try {
    var ctxt = itemCtxt._ctxt;
    var row = 0;
    if (itemCtxt._updateCatLoop) {
       row = itemCtxt._updateCatLoop.getCurrentRow();
    }
    ctxt._vhandle.appendItem(ctxt._cif, ctxt._block._name, itemCtxt._name, row, message, level); 
  } catch (e) {
    alert("Failed call of Alert() with arg " +  message + " : " + e); 
  }
};

/**
 * Used in dREL Validation methods purely as a check for existence 
 * rather than a request for addition.
 * @memberof BuiltInFuncs.prototype
 * @param ctxt
 * @param itemName
 * @return {boolean}
 */
BuiltInFuncs.prototype.BlockHasItem = function(ctxt, itemName) {
  var item = ctxt.blockHasItem(itemName);
  if (item) return true;
  return false;
};

/**
 * Used in dREL Validation methods to check for known, non "?" values.
 * @memberof BuiltInFuncs.prototype
 * @param ctxt
 * @param aliasedItemName
 * @return {boolean}
 */
BuiltInFuncs.prototype.BlockHasItemValue = function(ctxt, aliasedItemName) {
  var cifItem = ctxt.blockHasItem(aliasedItemName);
  if (! cifItem) return false;
   
  var ctxtItem = ctxt.getItem(aliasedItemName);
  var raw;
  if (! ctxtItem._updateCatLoop) { // for single unlooped items
    raw = ctxtItem._model.getRawVal();
  } else  {                   // for looped items
    raw = ctxtItem._raw;
  }
  var val;
  try {
    val = ctxtItem._decodeRawVal(raw);  // maybe undefined ...
  } catch (e) {
    alert (e + " in BlockHasItemValue(" + aliasedItemName + ")");
  }
  if ((typeof val !== 'undefined') && (val != null)) return true;
  return false;
};

/**
 * Return canonical lowercase DDLm category name of an item _defintion.id
 * @memberof BuiltInFuncs.prototype
 * @param ctxt
 * @param itemName
 * @return {String}
 */
BuiltInFuncs.prototype.CategoryName = function(ctxt, itemName) {
  if (! itemName) return null;
  var lname = itemName.toLowerCase();
  var defn = ctxt._dict.getItemDefn(lname); 
  if (defn) return defn._category._name.toLowerCase();
  return null;
};

/**
 * Return canonical lowercase DDLm _object.id
 * @memberof BuiltInFuncs.prototype
 * @param ctxt
 * @param itemName
 * @return {String}
 */
BuiltInFuncs.prototype.ObjectName = function(ctxt, itemName) {
  if (! itemName) return null;
  var lname = itemName.toLowerCase();
  var defn = ctxt._dict.getItemDefn(lname); 
  if (! defn) return null;
  var shortNameRaw = defn.getAttribute(ctxt._cat_attribute_id);
  if (shortNameRaw) return shortNameRaw.toLowerCase();
  return null;
};


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.Context = Context;
}
