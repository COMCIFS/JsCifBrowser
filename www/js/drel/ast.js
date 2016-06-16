#!/usr/bin/env node

var util = require('util');
var fs = require("fs");
var sysargs = process.argv.splice(2);
var cwd = __dirname;
var absolute_file_path = cwd + '/' + sysargs[0] ;
console.log(sysargs);
console.log(absolute_file_path);

//dummy to avoid lib errors
var numeric = { 'pointwise': function() { return;},
};

var esc = String.fromCharCode(27)+"[";
var warn = esc+"33m";
var error = esc+"31m";
var retext = esc+"0m";
// define this to avoid undefined alert messages in sub modules...
GLOBAL.alert = function(argue) {
  console.log(argue);
}



// Load the Library

var Lib = require("./library.js").Library;
var libby = new Lib();
//console.log("Minor() return type " + libby.Minor.return );
//console.log("Minor() arg 0 " + libby.Minor.args[0] );
//console.log(libby.Minor());

var atom_type = require('./auxdata.js').atom_type;
// libby._atom_type = atom_type; // push data into lib.

// Load the JSON format CIF Core DDLm dictionary
//var core_3 = require("../../dict/core_3.js").cif_dict;
//var core_3 = require("../../data/cif_ddlm.js").cif_dict;
//var dictfilename = "cif_core.dic";
var dictfilename = "cif.dic.js";
var core_3 = require("../../dic/" + dictfilename).cif_dict;
var dict_json = new core_3()._dict;

var DictWrapper = require("../dict/dict_wrapper.js").DictWrapper;
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


//var jsdict = DictWrapper(rawDict, console);
//jsdict.dumpCats();


// Read the dREL sample
var drel_parser = require("./drel.js").parser;
var source = fs.readFileSync(absolute_file_path, "utf-8");
var ast = drel_parser.parse(source);
console.log(util.inspect(ast, false, null));


// Compile the ast to javascript
var DREL = require("./drel_handler.js").dREL_handler;
var dREL = new DREL();
var name = "_atom_site.symmetry_multiplicity";
var method = dREL.compile(name, ast,meta_dict,libby);

console.log(source);
console.log(method);

//var result = method(cif,jsdict);

console.log("done");

//for (var key in libby) {
//   console.log(key);
//}  
