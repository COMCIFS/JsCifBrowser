#!/usr/bin/env node

exports.STAR_reader = function(absolute_file_path) {

  // path to this script
  var packageDir = __dirname;
  // load relative to this script
  var parser = require("../star/star_parser.js").STAR_parser;
  var Observer = require("../star/star_observer.js").STAR_observer;
  var Handler = require("../star/star_handler.js").STAR_handler;
  var handler = new Handler();
//  parser.yy.observer = new Observer();
  parser.yy.observer.addHandler(handler);
  
  var parse = exports.parse = function (input) {
      return parser.parse(input);
  };
  
  // load system modules
  var fs = require("fs");
  var source = fs.readFileSync(absolute_file_path, "utf-8");
  var out = parse(source);
  out = handler.releaseData();
  return out;
} 
  
  
if (!module.parent) {
  var path = require('path');
  var sysargs = process.argv.splice(2);
  if (sysargs.length !=1) {
    var thisfile = path.basename(process.argv[1]);
    console.log("Usage: " + thisfile + " dictfile");
    console.log("Synopsis: Reads a STAR format file and returns result as JSON");
    process.exit(code=1);
  } 
  var cwd = process.cwd();
  var absolute_file_path = cwd + '/' + sysargs[0] ;
  //  console.log(sysargs);
  //  console.log(absolute_file_path);
  var out = exports.STAR_reader(absolute_file_path);
  var util = require('util');
  console.log(util.inspect(out, false, null));
} 
