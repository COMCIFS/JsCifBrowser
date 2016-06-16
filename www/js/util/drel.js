#!/usr/bin/env node

var path = require('path');
var sysargs = process.argv.splice(2);
if (sysargs.length !=2) {
  var thisfile = path.basename(process.argv[1]);
  console.log("Usage: " + thisfile + " dictfile ciffile");
  process.exit(code=1);
}
var cwd = process.cwd();
var dictfilename =  sysargs[0];
var ciffilename =  sysargs[1];
var dirpathname = path.dirname(dictfilename);
var dict_file_path = cwd + '/' + dictfilename ;
var cif_file_path = cwd + '/' + ciffilename ;
var esc = String.fromCharCode(27)+"[";
var warn = esc+"33m";
var error = esc+"31m";
var retext = esc+"0m";

// define this to avoid undefined alert messages in sub modules...
GLOBAL.alert = function(argue) {
  console.log(argue);
}

var reader = require("./star_reader.js").STAR_reader;
var dict_json = reader(dict_file_path);

var DDLWrapper = require("../dict/dict_wrapper.js").DDLWrapper;
var MetaDict = require("../dict/meta_dict.js").MetaDict;

var environ = {
  loadingDictQ : function() { return false;},
  info : function(argue) { console.log(argue);},
  debug : function(argue) { console.log(argue);},
  warn : function(argue) { console.log(warn + argue + retext);},
  log : function(argue) { console.log(argue);},
  error : function(argue) { console.log(error+ argue + retext);},
  fatal : function(argue) { 
    console.log(error+ argue + retext);
    process.exit(code=2); // is this wise?
  },
  userLoadsDict : function(filename) { 
    var json = reader(cwd + '/' + dirpathname + '/' + filename);
    meta_dict.wrapJSONDict(filename, json); //meta_dict pulled from global scope
    console.log(filename);
    meta_dict.buildFileImportList(filename); 
    meta_dict.resolveRequiredImports(); 
  }
}

var meta_dict = new MetaDict(environ);
meta_dict.wrapJSONDict(dictfilename, dict_json);
meta_dict.buildFileImportList(dictfilename); 
// resolve is recursive ...
meta_dict.resolveRequiredImports(); 

// dictionaries are now resolved


environ.warn("\nLoading CIF file: " + ciffilename + "\n");
var reader = require("./star_reader.js").STAR_reader;
var cif_json = reader(cif_file_path);
var CIF_controller = require("../cif/cif_controller.js").CIF_controller;
var cif_controller = new CIF_controller(cif_json, meta_dict, environ);

environ.warn("\nLoaded CIF file: " + ciffilename + "\n");

// cif is now loaded
var validationHandler = require("../dict/validation.js").ValidationBase;
//var validnHandler = new validationHandler( null, meta_dict, environ, 
//       ciffilename, cif_controller) ;   
var validnHandler = new validationHandler(meta_dict, environ, 
       ciffilename, cif_controller) ;   


// generate execution contexts - one for each data block.
var Context = require("../drel/drel_context.js").Context; // factory func
cif_controller.generateContexts(Context, validnHandler); 


// what do you want to do?
environ.warn("\nResolving unknown '?' items\n");
cif_controller.resolveMissingItems();


// what else do you want to do?
var blocks = cif_controller.getBlocks();
for (var i=0;i<blocks.length; i++) {
  var block = blocks[i];
  if (! block._type) continue; // probly the CIF header
  if (block._type == "global_") {
      continue;
  }  
  var blockid = block._name; 
  var ctxt = cif_controller.getContext(blockid);
  /* 
   * test 1
   */
  var itemName = "_cell.volume";
  var cifItem =  block.getItem(itemName); // ItemCtrlr value = '?'
  var vol;
  if (ctxt && cifItem) {
    // type = 'singleItem', // get value or run evaluation method 
    //        'singleItemDefn', // run definition method
    //        'loopItem',   // run evaluation method on looped item
    //        'loopItemDefn', // run defn method in looped context
    //        'GenCat',       // generate an absent category 
    //        'AddItem'       // add missing item as unknown '?' 
    //ctxt.call(type, itemName, cifItem);
    vol = ctxt.call('singleItem', itemName, cifItem);
    // apparently returns the starController object, not the value ...
  }
  if (vol) {
    environ.warn(ciffilename + "->" +blockid + "->"+itemName+ "->"+ vol._value);
  }
  /* 
   * test 2
   */
  itemName = "_atom_type.number_in_cell";
  var catName = "atom_type";
  cifItem =  block.getItem(itemName); // ItemCtrlr 
  var vol;
  if (ctxt && ! cifItem) { // item is missing
    var cat =  block.getCategory(catName); // CatCtrler 
    if (cat) {
      ctxt.call('addItem', itemName, cat); // add item to cif as '?'
      cifItem =  block.getItem(itemName); // LoopCtrlr 
      ctxt.call('loopItem', itemName, cifItem); // iterate eval over loop
    }
  }

}




environ.warn("\nValidating CIF file\n");
cif_controller.validateAllBlocks();
var strnArray = validnHandler.dumpAsArray();
//var util = require('util');


// Having done it, dump the new cif to stdout
environ.warn("\nDumping new CIF file\n");
var content = cif_controller.exportCIF(cif_controller);
var newcif = content.join(''); // concatenate list
environ.log(newcif);

//environ.log(util.inspect(strnArray, false, null));// concatenate list 
environ.warn("\nValidated CIF file\n");
environ.log('\n\n');
environ.log(strnArray.join(''));// concatenate list 


environ.warn("\nExecution complete.\n");
