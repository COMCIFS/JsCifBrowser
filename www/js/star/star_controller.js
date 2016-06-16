/**
 * @file This module contains MVC controllers for STAR entities common
 * to both CIF datafiles and CIF dictionaries and DDLs.
 */

/**
 * @constructor
 * @param frag {Array}
 */
function CommentCtrlr(frag) {
  this._data = frag;
  this._view = null;
}

/**
 * @memberof CommentCtrlr.prototype
 * @return {Array}
 */
CommentCtrlr.prototype.getJSON = function() {
  return this._data;
};

/**
 * @constructor
 * @param frag  {Array[]}
 * @param data  {Array[]}
 */
function SaveCtrlr(frag, data) {
  this._type = 'save_';
  this._name = frag[1];
  this._data = data;
  this._view = null;
}

/**
 * @memberof SaveCtrlr.prototype
 * @return {Array[]} 
 */
SaveCtrlr.prototype.getJSON = function() {
  return this._data;
};


/**
 * @constructor
 * @param name
 * @param cifWrapper
 */
function CategoryCtrlr(name, cifWrapper) {
  this._name = name;
  this._cif = cifWrapper;
  this._sub_cats = {};
  this._data = null;
  this._view = null;
  this._loop = {};
  this._listener;
}

/**
 * @memberof CategoryCtrlr.prototype
 * @return {Object}
 */
CategoryCtrlr.prototype.getSubCats = function() {
    return this._sub_cats;
};

/**
 * @memberof CategoryCtrlr.prototype
 * @return {Object}
 */
CategoryCtrlr.prototype.getItems = function() {
    return null;
};

/**
 * @memberof CategoryCtrlr.prototype
 * @return {Array}
 */
CategoryCtrlr.prototype.getAttributes = function() {
    return this._data;
};

/**
 * @memberof CategoryCtrlr.prototype
 * @param loopAndItemCtrlrs
 * @return null
 */
CategoryCtrlr.prototype.addListOfFragCtrlrs = function(loopAndItemCtrlrs) {
    this._data = loopAndItemCtrlrs;  // just a list of JSON items
};

/**
 * @memberof CategoryCtrlr.prototype
 * @param fragCtrlr
 * @return null
 */
CategoryCtrlr.prototype.addFragCtrlr = function(fragCtrlr) {
    if (this._data) {
      this._data.push(fragCtrlr); 
    } else {
      this._data = [fragCtrlr]; 
    }
};

/**
 * 
 * @memberof CategoryCtrlr.prototype
 * @return null
 */
CategoryCtrlr.prototype.listify = function() {
    // we assume there is only one chunk in this cat and that it is
    // a loop_ 
    if (! this._data || this._data.length == 0) {
      this.addFragCtrlr( new LoopCtrlr(null, this._cif));
    } 
    var loopCtrlr = this._data[0];
    this._loop = loopCtrlr;  // remove in the future.
    try {
      loopCtrlr.listify();
      return loopCtrlr;
    } catch (e) {
      throw new Error("CatCtrlr: bogus loop_ structure for category " + this._name); 
    }
};
    
/**
 * @memberof CategoryCtrlr.prototype
 * @return {Object}
 */
CategoryCtrlr.prototype.addDummyLoopRow = function() {
    if (! this._data || this._data.length == 0) {
      this.addFragCtrlr( new LoopCtrlr(null, this._cif));
    } 
    var loopCtrlr = this._data[0];
    this._loop = loopCtrlr;  // remove in the future.
    return loopCtrlr.addDummyLoopRow();
};

/**
 * @memberof CategoryCtrlr.prototype
 * @return null
 */
CategoryCtrlr.prototype.getLoopCtrlr = function() {
    if (! this._data || this._data.length == 0) {
      this.addFragCtrlr( new LoopCtrlr(null, this._cif));
    } 
    var loop_controller ;
    for (var i = 0; i < this._data.length; i++) {
        var frag = this._data[i];
        if (frag._json[0] == 'loop_' ) {
          loop_controller = frag;
          break;
        }
    } 
    this._loop = loop_controller;  // remove in the future.
    return  this._loop; 
};

  
/**
 * @constructor
 * @param frag
 * @param cifWrapper
 */
function ItemCtrlr(frag, cifWrapper) {
  this._cif = cifWrapper;
  this._name = frag[1];
  this._json = frag;
  this._view = null;
  this._changeListeners = [];
}

/**
 * @memberof ItemCtrlr.prototype
 * @return {Array}
 */
ItemCtrlr.prototype.getJSON = function() {
    return this._json;
};

/**
 * @memberof ItemCtrlr.prototype
 * @param callbackFunc
 * @return null
 */
ItemCtrlr.prototype.addChangeListener = function(callbackFunc) {
    this._changeListeners.push(callbackFunc);
};

/**
 * @memberof ItemCtrlr.prototype
 * @return {Object}
 */
ItemCtrlr.prototype.getRawVal = function() {
    var raw = this._json;
    if (raw.length == 3) return raw[2]; // mostly

    for (var i=2; i <raw.length; i++) {
      if (typeof raw[i] == 'string') {
         return raw[i];
      } 
      var elem = raw[i];
      // otherwise it is  probably a comment array, so skip
      if ((elem instanceof Array) && elem.length> 1 && elem[0] =='@comment') {
        continue;
      }
      // Else it is probably a CIF2 list or dict object
      return elem;
    }

};

/**
 * @memberof ItemCtrlr.prototype
 * @param e
 * @return null
 */
ItemCtrlr.prototype._onViewChange = function(e) {
      if (!e) var e = window.event;
      var newVal = e.target;
      // but maybe we have to reparse the string???

      if (typeof this._json[2] != 'string') {
         alert("Former object is now a string???");
      }
      if (newVal.value) {
//         alert(frag[1] + " was " + frag + "\nnow " + newVal.value ); 
        this._json[2] = newVal.value;
//        this._cif.pushToContext(this);
      }
      // notify change listeners - Registered Context objects
      for (var i=0; i<this._changeListeners.length; i++) {
        this._changeListeners[i].modelChangedEvent('update');
      }
      // notify datum container objects - Cif data block or Dict cat or item defn
      this._cif.modelChangedEvent(this._name, 'update');
          
      // handle event
      // prevent bubbling???
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation();
};

/**
 * @memberof ItemCtrlr.prototype
 * @param val
 * @return null
 */
ItemCtrlr.prototype._updateValue = function(val) {
    this._json[2] = val;
    // convert val back to a string
    var txt ;
    try {
      txt = numeric.prettyPrint(val).trim(); // trim not supported by old browsers
      //      alert("updating " + this._name + " model to " + val);
    } catch (e) {
      alert(e);
      alert("error updating" + this._name);
      txt = "QQQQQQQQQQQQQ";
    }
    this._view = this._checkAndSwitchView(this._view, txt);
};

/**
 * @memberof ItemCtrlr.prototype
 * @param view
 * @param txt
 * @return {String}
 */
ItemCtrlr.prototype._checkAndSwitchView = function(view, txt) {
    // telling the renderer how to render is a crap design!
    if (! view ) {
      alert("NO VIEW!! for " + this._name + " with value " + txt); 
      return;
    }
    var renderer;
    if (this._cif ) {
      renderer = this._cif.getRenderer();
    }
//    alert(this._name + " !!! " + this._cif + "   " + view.tagName); 
    var lines;
    if (typeof txt == 'string'){
      lines = txt.match(/\n/g);
    } else {
      // an object so convert to string
      lines = [];
      BaseDictWrapper.prototype._renderItemValue(lines,txt);
      //renderer._renderItemValue(lines, txt);
      txt = lines.join('');
      lines = 'x'; // dummy
    }
    var text;
    if (view && view.tagName.toLowerCase() == 'textarea') {
      text = renderer._renderTextValue(view, txt, 'changed');
    } 
    return text; // the new? view node
};


/**
 * @constructor
 * @param frag
 * @param cifWrapper
 */
function LoopCtrlr(frag, cifWrapper) {
  this._cifBlock = cifWrapper;
  if (frag) {
    this._json = frag;
  } else {
    this._json =  ['loop_', [], [] ]; // a dummy fragment
  }
  this._view = null;
  this._tags ;
  this._rows;
  this._map;
  this._vals;
  this._keymap;
}

/**
 * @memberof LoopCtrlr.prototype
 * @return {Object}
 */
LoopCtrlr.prototype.getRawVal = function() {
    return null;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return {LoopCtrlr}
 */
LoopCtrlr.prototype.listify = function() {
    // only listify once
    if (this._tags) return this;

    var tags = [];
    var tagmap = {};
    var rows = [];
    if (! this._json) {
      this._tags = tags;
      this._rows = rows;
      this._map = tagmap;
      this._vals = [];
      return this;
    }

    var taglist = this._json[1]; // ['loop_', [header], [values]]
    // cull comments from taglist;
    var k = 0;
    for (var i = 0; i < taglist.length; i++) { 
      var tag = taglist[i]; 
      if (typeof tag == 'string') {
        tag = tag.toLowerCase();
        tags.push(tag);
        tagmap[tag] = k;
        k++;
      }
    }
    var fieldCnt = tags.length;
 
    var values = this._json[2];
    var j = -1;
    var line = [];
    var vlen = values.length;
    for (var i = 0; i < vlen; i++) { 
      var val = values[i]; 
      if (typeof val == 'string' || val[0] != '@comment' ) {
        line.push(i);
        if (line.length >=fieldCnt) {
          rows.push(line);
          line = [];
        }
      } 
    }
    if (line.length > 0) { 
      throw new Error("LoopCtrlr " + "Incomplete loop_ list for " + this._name); 
    }
//alert("processing the loop " + this._name + "tags: " + taglist); 
//alert("tags " + tags);
//alert("rows " + rows);
//alert("data " + loop[2]);
    this._tags = tags;
    this._rows = rows;
    this._map = tagmap;
    this._vals = this._json[2];
    return this;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return {Array}
 */
LoopCtrlr.prototype.getJSON = function() {
    return this._json;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return {Integer}
 */
LoopCtrlr.prototype.getRows = function() {
    return this._rows.length;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return {Array}
 */
LoopCtrlr.prototype.getTags = function() {
    return this._tags;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return {Object}
 */
LoopCtrlr.prototype.getKeyMap = function() {
    return this._keymap;
};

/**
 * @memberof LoopCtrlr.prototype
 * @param map
 * @return {Object}
 */
LoopCtrlr.prototype.setKeyMap = function(map) {
    return this._keymap = map;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return Integer
 */
LoopCtrlr.prototype.addDummyLoopRow = function() {
    var taglen = this._tags.length;
    var line = [];
    var j = this._vals.length;
    var dummy = [];
    for (var i=0; i<taglen; i++) {
      this._vals.push('?');
      dummy.push('?');
      line.push(j++);
    }
    this._rows.push(line);
    
    if (this._view) {
      var renderer = this._cifBlock.getRenderer();
      var node = renderer.addLoopRow(this, this._view, dummy, 'changed'); 
    }
    
    return this._rows.length - 1;
};


/**
 * @memberof LoopCtrlr.prototype
 * @param item_name
 * @return null
 */
LoopCtrlr.prototype.addAttribute = function(item_name) {
    var loop_chunk = this._json;

    var preLoopTags ;
    if (! this._tags) preLoopTags =  this.listify()._tags;
    else preLoopTags = this._tags;
//    alert(parnt._name + " child " + item_name + "preloopTags " + preLoopTags);

    this._tags = null; // reset for next pass

    //this._loop = {'tags': tags, 'rows':rows, 'map':tagmap};
    var prelen = preLoopTags.length;
    loop_chunk[1].push(item_name); // add tag_name
    var list =  loop_chunk[2];  // loop info
    var k = 0;
    for (var i = 0; i < list.length; i++) {
//      alert(i + " " +  list[i] + " : " +  typeof list[i]) ; 
      if (typeof list[i] == 'object' && list[i][0] =='@comment') {
        continue;
      }
      k = k + 1;
      if (k >= prelen) {
        list.splice(++i,0,'?');
        k = 0;
      }
    }
    if (list.length == 0) {
       list.push('?');
    }
    // regenerate the headers
    this.listify();

/*
    if (! loop_frag._view) {
      if (renderer && parnt._view) {
        renderer._renderLoop(loop_frag, parnt._view, blockid);
      }
//      loop_frag._view = parnt._view;
    }

    loop_frag.refreshView();
 */

  
};

/**
 * @memberof LoopCtrlr.prototype
 * @param key
 * @return {Object}
 */
LoopCtrlr.prototype.getRowByKey = function(key) {
    if (this._keymap) { 
      return  this._keymap[key];
    }
};

/**
 * @memberof LoopCtrlr.prototype
 * @param tag_name
 * @param rowN
 * @return {Object} 
 */
LoopCtrlr.prototype.getFieldForRow = function(tag_name, rowN) {
    var row = this._rows[rowN];
    if (row == undefined) {
      throw new Error("LoopCtrlr: Bad item row " +rowN + "for " + tag_name );
    }
    var idx = this._map[tag_name];
    if (idx == undefined) {
      var x = "";
      for (var key in this._map) {
        x = x +key + ": " + this._map[key];
      }
      alert( "map= " + x);
      throw new Error("LoopCtrlr: No loop map for " + tag_name ); 
    }
    var vptr = row[idx];
    var raw = this._vals[vptr];
    return raw;
};

/**
 * @memberof LoopCtrlr.prototype
 * @param tag_name
 * @param rowN
 * @param value
 * @return null
 */
LoopCtrlr.prototype.setFieldForRow = function(tag_name,rowN, value) {
    var row = this._rows[rowN];
    var idx = this._map[tag_name];
    if (idx == undefined) {
      throw new Error("DrelContext: No loop map for " + tag_name +
           " in category " + this._name);
    }

    var vptr = row[idx];
    this._vals[vptr] = value;
    this.refreshField(vptr); 

};

/**
 * @memberof LoopCtrlr.prototype
 * @return Integer
 */
LoopCtrlr.prototype.countFields = function() {
    var loop = this._json;
    var header = loop[1];
    var n = 0;
    for (var f = 0 ; f < header.length; f++) {
      var val = header[f];
      if (typeof val == 'object' && val[0] =='@comment') continue;
      n++;  
    }
    return n;
};

/**
 * @memberof LoopCtrlr.prototype
 * @param col
 * @return {Object}
 */
LoopCtrlr.prototype.getFieldNameByCol = function(col) {
    var loop = this._json;
    var header = loop[1];
    var n = 0;
    for (var f = 0 ; f < header.length; f++) {
      var field = header[f];
      if (typeof field == 'object' && field[0] =='@comment') continue;
      if (n == col) return field;
      n++;
    }
    return null;
};

/**
 * @memberof LoopCtrlr.prototype
 * @return null
 */
LoopCtrlr.prototype.refreshView = function() {
    // technically this cshould all be handled by the renderer, no?
    if (this._view) {
      var oldview = this._view;
      var pn = oldview.parentNode;
      var renderer = this._cifBlock.getRenderer();
      var replacement = renderer._doc.createDocumentFragment();
      var node = renderer._renderLoop(this, replacement, this._cifBlock._name); 
      pn.replaceChild(node,oldview);
      this._view = node;
    }
};

/**
 * @memberof LoopCtrlr.prototype
 * @param vptr
 * @return null
 */
LoopCtrlr.prototype.refreshField = function(vptr) {
    if (this._view) {
      var renderer = this._cifBlock.getRenderer();
      var node = renderer.updateLoopValue(this._view, vptr, this._vals[vptr], 'changed'); 
    }

};

/**
 * @memberof LoopCtrlr.prototype
 * @param e
 * @return null
 */
LoopCtrlr.prototype._onViewChange = function(e) {
    if (!e) var e = window.event;
    var container = e.target;
    var newVal = container.value; // a string
    var ref = container.getAttribute('data-loopRef');
    var loop = this._json;
    var nfields = this.countFields();
    if (ref[0] =='h') {
      var index = ref.substring(2); // strip 'hc' for header column/comment
      this._setListIndexVal(loop[1], nfields, index, newVal);
    } else if (ref[0] =='r') {
      var rc = ref.split(/[rc]/);   // like rnnncmmm for row,col
      if (newVal == '') newVal = '?';
      var row = parseInt(rc[1]);
      var col = parseInt(rc[2]);
      this._setLoopRowColVal(loop, nfields, row, col, newVal);
      // notify container object
      this._cifBlock.modelChangedEvent(this.getFieldNameByCol(col), 'update');
    }
      
    // handle event
    // prevent bubbling???
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
};


/**
 * This seems viable because you could "Add" an extra column and preserve
 * existing field row/col indices.
 * @memberof LoopCtrlr.prototype
 * @param loop
 * @param nfields
 * @param row
 * @param col
 * @param nval
 * @return null
 */
LoopCtrlr.prototype._setLoopRowColVal = function(loop, nfields, row, col, nval) {
    var vals = loop[2];
    var dindex = row*nfields + col;
    if (dindex > vals.length)
      throw new Error("Model setLoopRowColVal length mismatch error");
  
    // without comments, we could just step straight there :-/
    var l = -1;
    for (var f = 0 ; f < vals.length; f++) {
      var val = vals[f];
      if (l+1 == dindex) {
        if (typeof val == 'object' && val[0] =='@comment') {
          val[1] = nval;
          //alert(" set the model comment value");
        } else {
          vals[f] = nval;
          //alert(" set the model value");
        } 
        break;
      }
      if (typeof val == 'object' && val[0] =='@comment') {
      } else {
        l++;
      }
    }
};

/**
 * @memberof LoopCtrlr.prototype
 * @param theList
 * @param nfields
 * @param index
 * @param nval
 * @return null
 */
LoopCtrlr.prototype._setListIndexVal = function(theList, nfields, index, nval) {
    if (index > theList.length)
      throw new Error("Model setLoopIndexVal length mismatch error");
    var val =  theList[index];
    if (typeof val == 'object' && val[0] =='@comment') {
      val[1] = nval;
    } else {
      theList[index] = nval;
    }
};



if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.CategoryCtrlr = CategoryCtrlr;
  exports.ItemCtrlr = ItemCtrlr;
  exports.LoopCtrlr = LoopCtrlr;
  exports.CommentCtrlr = CommentCtrlr;
  exports.SaveCtrlr = SaveCtrlr;
}
