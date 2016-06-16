#!/usr/bin/env node
//var path = require('path');
var sysargs = process.argv.splice(2);
var cwd = process.cwd();
var absolute_file_path = cwd + '/' + sysargs[0] ;

var util = require('util');
var reader = require("./star_reader.js").STAR_reader;
var out = reader(absolute_file_path);
console.log("function cif_dict() { this._dict =");
//console.log(util.inspect(out, false, null));
//console.log(util.format("%j", out)); 
console.log(JSON.stringify(out,null,2));
console.log("\n  ; }\n\nif (typeof require !== 'undefined' && typeof exports !== 'undefined') {\n   exports.cif_dict = cif_dict;\n}") ;
