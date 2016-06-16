/*
 * In principle we could use the DDL itself to check for various 
 * possible enumerations of type information, but there is 
 * not really a formal way to specify the representation of items
 * conforming to those values. Essentially we have to hardcode 
 * the appropriate case handling here :-/


_type.purpose
     Import
;                  >>> Applied ONLY in the DDLm Reference Dictionary <<<
                   Used to type the SPECIAL attribute "_import.get" that
                   is present in dictionaries to instigate the importation
                   of external dictionary definitions.
;
     Method
;                  >>> Applied ONLY in the DDLm Reference Dictionary <<<
                   Used to type the attribute "_method.expression" that
                   is present in dictionary definitions to provide the
                   text method expressing the defined item in terms of
                   other defined items.
;
     Audit
;                  >>> Applied ONLY in the DDLm Reference Dictionary <<<
                   Used to type attributes employed to record the audit
                   definition information (creation date, update version and
                   cross reference codes) of items, categories and files.
;
     Identify
;                  >>> Applied ONLY in the DDLm Reference Dictionary <<<
                   Used to type attributes that identify an item tag (or

     Extend
;                  *** Used to EXTEND the DDLm Reference Dictionary ***
                   Used in a definition, residing in the "extensions"
                   save frame of a domain dictionary, to specify a new
                   enumeration state using an Evaluation method.
;
     Describe
;                  Used to type items with values that are descriptive
                   text intended for human interpretation but may be
                   specially formatted to be machine parsible.
;
     State
;                  Used to type items with values that are restricted to
                   codes present in their "enumeration_set.state" lists.
;
     Key
;                  Used to type an item with a value that is unique within
                   the looped list of these items, and may be used as a
                   reference "key" to identify a specific packet of items
                   within the category.
;

     Link
;                  Used to type an item with a value that is unique within
                   a looped list of items belonging to another category.
                   The definition of this item must contain the attribute
                   "_name.linked_item_id" specifying the data name of the
                   key item for this list. The defined item represents a
                   a foreign key linking packets in this category list to
                   packets in another category.
;
     Composite
;                  Used to type items with value strings composed of
                   separate parts. These will usually need to be separated
                   and parsed for complete interpretation and application.
;
     Quantity
;                  Used to type an item with a recorded value, numerical
                   or otherwise, that is exact (i.e. it has no standard
                   uncertainty value). Typical examples: "5","A","blue"
;
     Measurand
;                  Used to type an item with a numerically estimated value
                   that has been recorded by measurement or derivation. This

     SU
;                  Used to type an item with a numerical value that is the
                   standard uncertainty of an item with the identical name
                   except for the suffix '_su'. The definition of an SU item
                   must include the attribute "_name.linked_item_id" which
                   explicitly identifies the associated measurand item.
;



_type.source

     Assigned
;               A quantity, as either an exact number or text value,
                assigned as a record of the data collected, analysed
                or modelled for a domain instance. This is a PRIMITIVE
                data item, in that this item cannot be determined
                from other defined items.
;
     Observed
;               A quantity, as either an exact number or text value,
                that records an observation made during the collection
                of data for a domain instance. This item is PRIMITIVE.
;
     Measured
;               A numerical value measured manually or instrumentally
                with an associated standard uncertainty value for a
                domain instance. This item is PRIMITIVE.
;
     Derived
;               A quantity derived from other data items within the
                domain instance. This item is NOT PRIMITIVE.
    Selected
;               A quantity selected arbitrarily to identify a packet of
                data present in a loop list. The quantity has no intrinsic
                meaning other than it being a unique string. This is
                in contrast to Assigned items whose values can determine
                derivation outcomes.  This item is NOT PRIMITIVE.
;
     Assembled
;               A quantity that has been assembled or syntactically
                composed as a preferred representation of other data
                items for the domain instance. An assembled item is
                in a sense redundant, and therefore NOT PRIMITIVE.
;


 
 */
function  ValidationBase(dict, logger, filename) {
  this._dict = null;
  this._logger = null;
  this._filename = null;
  this._stacks =  null;

  this._containerKeys = [
    'Single',   //  'single value'
    'Multiple', //  'values as List or by boolean ',|&!*' or range ":" ops'
    'List',     //  'list of values bounded by []; separated by commas'
    'Array',    //  'array of values bounded by []; separated by commas'
    'Matrix',   //  'matrix of values bounded by []; separated by commas'
    'Table',    //  'id:value elements bounded by {}; separated by commas'
    'Ref-table' // 'A STAR construction with key:value elements'
  ];
  this._contentKeys = [
    'Text',      // 'case-sens strings or lines of STAR characters',
    'Code',      // 'case-insens contig. string of STAR characters',
    'Filename',  // 'case-sens string indentifying an external file',
    'Uri'     ,  // 'case-sens string as universal resource indicator of a file',
    'Name',      // 'case-insens contig. string of alpha-num chars or underscore',
    'Tag' ,      // 'case-insens contig. STAR string with leading underscore',
    'Table'   ,  // 'table of "id":"value" pairs of Type (Code : Text)',
    'Date'    ,  // 'ISO standard date format <yyyy>-<mm>-<dd>',
    'Version' ,  // 'version digit string of the form <major>.<version>.<update>',
    'Dimension', // 'integer limits of an Array/Matrix/List in square brackets',
    'Range'    , // 'inclusive range of numerical values min:max',
    'Digit'    , // 'single digit unsigned number',
    'Count'    , // 'unsigned integer number',
    'Index'    , // 'unsigned non-zero integer number',
    'Integer'  , // 'positive or negative integer number',
    'Float'    , // 'floating-point real number',
    'Real'     , // 'floating-point real number',
    'Imag'     , // 'floating-point imaginary number',
    'Complex'  , // 'complex number <R>+j<I>',
    'Binary'   , // 'binary number \b<N>',
    'Hexadecimal',//'hexadecimal number \x<N>',
    'Octal'      //'octal number \o<N>',
  ];  
  this._containers = {};
  for (var i = 0; i < this._containerKeys.length; i++) {
     this._containers[this._containerKeys[i] ] = i + 1;
  }
  this._contents = {};
  for (var i = 0; i < this._contentKeys.length; i++) {
     this._contents[this._contentKeys[i] ] = i + 1;
  }

  if (arguments.length) { this._init(dict, logger, filename); }
}


ValidationBase.prototype._init = function(dict, logger, filename) {
  this._dict = dict;
  this._logger = logger;
  this._filename = filename;
}



ValidationBase.prototype.checkType = function(defn, value) {
  //var ddl = this._ctxt._dict.ddl;
  var container = defn.getAttribute(this._dict._data_container);
  if (! container) { container = 'Single' ;}  // DDLm default
  var content = defn.getAttribute(this._dict._data_type);
  var purpose = defn.getAttribute(this._dict._data_purpose);
  var dimension = defn.getAttribute(this._dict._data_dimension);

  var enumset_state = '_enumeration_set.state';  // DDLm
  var enumset = defn.getAttributeLoop(enumset_state);
  var enums ;
  if (enumset) {
    enums = {};
    var tags = enumset.map;
    var rows = enumset.rows;
    for (var i = 0; i< rows.length; i++ ) {
      enums[ rows[i][tags[enumset_state]]] = 1;
    }
  }

  var bucket =  this._checkContainer(container,value); 
  var type = this._checkContents(content,value,enums); 
  return [bucket, type];
} 


ValidationBase.prototype._checkContainer = function(container, value) {
  if (value == '?') return;
  var types = this._containers;
  var idx = this._containers[container];
  
  switch (idx) {
    case types.Single:      // 'single value'
      if (! (typeof value == 'string' )) return "Non string Single";
      return;
      break;
    case types.Multiple:    // 'values as List or by boolean ',|&!*' or range ":" ops'
      if (! (typeof value == 'string' )) return "Non string Multiple";
      return;
      break;
    case types.List:        // 'list of values bounded by []; separated by commas'
      if (value instanceof Array) return;
      return "Non List value";
      break;
    case types['Array']:   //'array of values bounded by []; separated by commas'
      if (value instanceof Array) return;
      return "Non Array value";
      break;
    case types.Matrix:    //'matrix of values bounded by []; separated by commas'
      if (value instanceof Array) return;
      return "Non Matrix value";
      break;
    case types.Table:     //'id:value elements bounded by {}; separated by commas'
      if (value instanceof Object) return;
      return "Non Table value";
      break;
    case types['Ref-table']: // Is a STAR construction with key:value elements
      if (value instanceof Object) return;
      return "Non Ref-table value";
      break;
    default:
      return "Unexpected container type " + container;
      break;
  }
  return false;
}


ValidationBase.prototype._checkContents = function(content, value, enums) {
  if (value == '?') return;
  var types = this._contents;
  var idx = this._contents[content];
  
  switch (idx) {
    case types.Text: // case-sens strings or lines of STAR characters
      if (typeof value == 'string' ) return;
      return "Non Text value"; 
      break;
    case types.Filename: // case-sens string indentifying an external file',
      if (typeof value == 'string' ) return;
      return "Non Filename value"; 
      break;
    case types.Uri: //case-sens string as universal resource indicator of a file
      if (typeof value == 'string' ) return;
      return "Non Uri value"; 
      break;
    case types.Code: // case-insens contig. string of STAR characters
      if (! (typeof value == 'string' )) return "Non string Code";
      if (enums) {
        if (value in enums) return;
        var lval = value.toLowerCase();
        if (lval in enums) return;
        var lenums = {};
        for (var key in enums) { 
          lenums[key.toLowerCase()] = 1;
        }
        if (lval in lenums) return;
      } else return;
      return "Non enum match"; 
      break;
    case types.Name: //case-insens contig. string of alpha-num chars or underscore
      if (! (typeof value == 'string' )) return "Non string Name";
      if ( !(/^[._a-zA-Z0-9]+$/.test(value)) ) return "Non conformant Name";
      if (enums) {
        if (value in enums) return;
        var lval = value.toLowerCase();
        if (lval in enums) return;
        var lenums = {};
        for (var key in enums) { 
          lenums[key.toLowerCase()] = 1;
        }
        if (lval in lenums) return;
      } else return;
      return "Non matching enum"; 
      break;
    case types.Tag: // case-insens contig. STAR string with leading underscore',
      if (! (typeof value == 'string' )) return "Non string Tag";
      if ( /^_[._a-zA-Z0-9]+$/.test(value) ) return;
      return "Non conformant Tag value";
      break;
    case types.Table: // 'table of "id":"value" pairs of Type (Code : Text)',
      if (value instanceof Object) return;
      return "Non Table";
      break;
    case types['Date']: // 'ISO standard date format <yyyy>-<mm>-<dd>',
      if (! (typeof value == 'string' )) return "Non string Date";
      if ( /^\d\d\d\d-\d\d-\d\d$/.test(value) ) return;
      return "Non conformant Date value";
      break;
    case types.Version: // version digit string of the form <major>.<version>.<update>',
      if (! (typeof value == 'string' )) return "Non string Version";
      if ( /^(\d+)\.(\d+)(\.(\d+)?)$/.test(value) ) return;
      return "Non conformant Version string";
      break;
    case types.Dimension: // integer limits of an Array/Matrix/List in square brackets',
      if (! (typeof value == 'string' )) return "Non string Dimension";
      // could be an array
      return; 
      break;
    case types.Range:       // 'inclusive range of numerical values min:max',
      if (! (typeof value == 'string' )) return "Non string Range";
      if ( /^(\d*)\:(\d*)$/.test(value) ) return;
      return "Non conformant Range string";
      break;
    case types.Digit:       // 'single digit unsigned number',
      if (! (typeof value == 'string' )) return "Non string Digit";
      if ( /^\d$/.test(value) ) return;
      return "Non conformant Digit string";
      break;
    case types.Count:       // 'unsigned integer number',
      if (! (typeof value == 'string' )) return "Non string Count";
      if ( /^\d+$/.test(value) ) return;
      return "Non conformant Count string";
      break;
    case types.Index:       // 'unsigned non-zero integer number',
      if (! (typeof value == 'string' )) return "Non string Index";
      if ( /^[1-9]\d*$/.test(value) ) return;
      return "Non conformant Index string";
      break;
    case types.Integer:     // 'positive or negative integer number',
      if (! (typeof value == 'string' )) return "Non string Integer";
      if ( /^-?\d+$/.test(value) ) return;
      return "Non conformant Integer string";
      break;
    case types.Float:       // 'floating-point real number',
    case types.Real:        // 'floating-point real number',
    case types.Imag:        // 'floating-point imaginary number',
      if (! (typeof value == 'string' )) return "Non string Float";
      if ( /^([-+]?[0-9]*\.?[0-9]*)(\([0-9]+\))?([eE][-+][0-9]+)?(\([0-9]*\.?[0-9]*([eE][-+][0-9]+)?\))?$/.test(value) ) return;
      return "Non conformant floating point value";
      break;
    case types.Complex:     // 'complex number <R>+j<I>',
      if (! (typeof value == 'string' )) return "Non string Complex";
      if ( /([-+]?[0-9]*\.?[0-9]*)(\([0-9]+\))?([eE][-+][0-9]+)?(\([0-9]*\.?[0-9]*([eE][-+][0-9]+)?\))?[+-]j([-+]?[0-9]*\.?[0-9]*)(\([0-9]+\))?([eE][-+][0-9]+)?(\([0-9]*\.?[0-9]*([eE][-+][0-9]+)?\))?/.test(value) ) return;
      return "Non conformant Complex string";
      break;
    case types.Binary:      // 'binary number \b<N>',
      if (! (typeof value == 'string' )) return "Non string Octal";
      if ( /^\\b\d+$/.test(value) ) return;
      return "Non conformant Binary string";
      break;
    case types.Hexadecimal: // 'hexadecimal number \x<N>',
      if (! (typeof value == 'string' )) return "Non string Octal";
      if ( /^\\x\d+$/.test(value) ) return;
      return "Non conformant Hexadecimal string";
      break;
    case types.Octal:       // 'octal number \o<N>',  
      if (! (typeof value == 'string' )) return "Non string Octal";
      if ( /^\\o\d+$/.test(value) ) return;
      return "Non conformant Octal string";
      break;
    default:
      return "Unrecognised _type.content string " + content;
      break
  }
    
}


/*
 * Called for a newly loaded CIF
 */
ValidationBase.prototype.reset = function() {
 if (this._stacks) {
    for (var blk in this._stacks) {
      this.resetBlock(blk);
    }
  }

  if (this._cifRoot) {
    this._view.removeChild(this._cifRoot);
  }
  this._stacks =  null;
}


ValidationBase.prototype.resetBlock = function(blockid) {
  if (this._stacks && (blockid in this._stacks)) {
    var stack = this._stacks[blockid];
    var view = stack['view'];
    delete this._stacks[blockid];
    // view[0].removeChild(view[1]);
  }
}



ValidationBase.prototype._getStack = function( blockname ) {
  var stack;
  if (! this._stacks) {
    this._stacks = {};
    this._cifRoot = this._addCif();
  }
  if (blockname in this._stacks) {
     stack = this._stacks[blockname];
  } else {
     stack = { 'view' : [ this._cifRoot], 'undef':{ }, 'items':{ } } ;
     this._stacks[blockname] = stack;
  }
  return stack;
}

ValidationBase.prototype._addCif = function() {
  
  return this._filename;
}

ValidationBase.prototype.addBlock = function(cif, blockname) {
  var stack = this._getStack(blockname);
  var viewAncestors = stack['view'];
  if (viewAncestors.length > 1) {
    // already added this block
    return;
  }

  var parnt = viewAncestors[viewAncestors.length -1];

  var div = blockname;

  // update our records
  viewAncestors.push(div);

  var strn = blockname;

  // update our records
  // viewAncestors.push(table);
  var undef = stack['undef'];

  var block = cif.getBlock(blockname);
  for (var i = 0; i < block._unresolved.length; i++)  {
    undef[block._unresolved[i]._name] = "Undefined item name.";
  }

  for (var i = 0; i < block._unresolvedLoopItems.length; i++)  {
    undef[block._unresolvedLoopItems[i]] = "Undefined Looped item name.";
  }

}


ValidationBase.prototype.addItem = function(blkname, name, row, cont, type) {
  var stack = this._getStack(blkname);
  var viewAncestors = stack['view'];
  var parnt = viewAncestors[viewAncestors.length -1];
  var items = stack['items'];
  var itemRec = items[name];

  if (! itemRec) {
    itemRec = this._addItemRec(parnt, blkname,  name);
    items[name] = itemRec
  }

// var tab = itemRec['messages'];
 var tr = this._addItemRecRow(itemRec, row);

 if (cont) {
   this._invalidateRec(itemRec);
   tr.push(cont);
 }
 if (type) {
   this._invalidateRec(itemRec);
   tr.push(type);
 }
}


ValidationBase.prototype._addItemRec = function(parnt, blkname, name) {
  var vtd = [];
  var rtd = [];
  var table = [];
  return {'valid':[true, vtd] , 'rows' : [0, rtd, { } ], 'messages': table };
}


ValidationBase.prototype._addItemRecRow = function(itemRec, row) {
  var rowdata = itemRec['rows'];
  var rowcnt = rowdata[0] ;
  var rowdef = rowdata[2];
  if (row in rowdef) {
    return rowdef[row];
  }
  rowcnt = rowcnt + 1;
  if (rowcnt >1) {
    //var y = rowdata[1].firstChild;
    //if (y) rowdata[1].removeChild(y);
    text = rowcnt;
    rowdata[1].push(text);
  }
  rowdata[0] = rowcnt;
  var tr = [];
  rowdef[row] = tr;
  return tr;
}


ValidationBase.prototype._invalidateRec = function(itemRec ){
   itemRec['valid'][0] = false;
}

ValidationBase.prototype.appendItem = function(cif, blkname, name, row, fault, level){

  var stack = this._getStack(blkname);
  var viewAncestors = stack['view'];
  if (viewAncestors.length == 1) {
    this.addBlock(cif, blkname);
  }
  var parnt = viewAncestors[viewAncestors.length -1];

  var itemRec = stack['items'][name];
  if (! itemRec) {
    itemRec = this._addItemRec(parnt, blkname, name);
    stack['items'][name] = itemRec
  }
   this._invalidateRec(itemRec)
   var tab = itemRec['messages'];
   var tr = this._addItemRecRow(itemRec, row);

 if (! level) {
    text = fault;
  } else {
   //  var map = {'A':'red', 'B':'orange', 'C':'yellow'};
    text = "Alert level " + level + ": " + fault;
  }
  tr.push( text);

}


ValidationBase.prototype.dumpAsArray1 = function(){
 return this._stacks;
}

ValidationBase.prototype.dumpAsArray = function(){
 var data = this._stacks;
 var out = [];
 out.push('# ' + this._filename + '\n');
 for (var blk in data) {
    out.push('data_' + blk + '\n');
    var block = data[blk];
    var undef = block['undef'];
    for (var und in undef) {
      out.push("  " +und + "     '" + undef[und] +"'\n");
    }
    var items = block['items'];
    for (var item in items) {
      var rec = items[item]; 
      var valid = rec['valid'];
      if (valid[0]) continue;
      var rows = rec['rows'];
      if (rows[0] == 1) { 
        var messages = rows[2][0];
        out.push("  " +item + "    '" + messages.join(' ') + "'\n");
      } else {
        var messages = rows[2];
        out.push(item + '\n');
        for (var row in messages) {
          var mlist = messages[row].join(' ');
          out.push("     " + row +"   " +  mlist + '\n');
        }

      }
    }
 }
 return out;
}


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.ValidationBase = ValidationBase;
}

