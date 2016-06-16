/**
 * STAR_handler is a concrete instance of a STAR_observer
 * This particular instance generates hierarchical JSON
 * version of a STAR (Self defining Text ARchive) file.
 *
 */

function STAR_handler() { 
 this._reset()
}

STAR_handler.prototype._reset = function() {
  this.version="CIF";
  this._data = []
  this._stack = [this._data];
  this._open = this._stack[this._stack.length-1];
  this._modes = ["cif" ];
  this._mode = this._modes[ this._modes.length-1];

}

STAR_handler.prototype.releaseData = function() {
  data = this._data; 
  this._reset(); 
  return data;
}

STAR_handler.prototype.append = function(value) {
  this._open.push( value);
}
STAR_handler.prototype.replace = function(value) {
  var parent = this._stack[ this._stack.length-2];
  var slot = parent[parent.length -1];
  slot[slot.length -1] = value;
  this._open = value;
}
STAR_handler.prototype.push = function(value) {
  this._open.push( value);   // add new to open element
  this._modes.push(value[0]); // add latest name to modelist
  this._mode = value[0];      // this is active mode
  this._stack.push(value[value.length-1]); // push reference to new append slot (last)
  this._open = this._stack[ this._stack.length-1]; // current is content holder of value
//  console.log(this._data);
//  console.log(this._stack);
}
STAR_handler.prototype.pop = function(name) {
  var done = this._stack.pop() ; 
  this._open = this._stack[ this._stack.length-1];
  var mode = this._modes.pop() ; 
  this._mode = this._modes[ this._modes.length-1];
  
  // if name compare to what popped off 
}

STAR_handler.prototype.notifyEvent = function(event,data) {
  this[event](data);
}

STAR_handler.prototype.startDocument = function(data){
//  this._data = [];
//  console.log("start doc");
}
STAR_handler.prototype.endDocument = function(data){
//  console.log("end doc");
}
STAR_handler.prototype.startElement = function(data){
  var name = data[0];
  var attributes = data[1];
  if (name == "global_") {
    if (this.version == "CIF") this.popLoop();
    this.push( ['global_', [] ]);
  }
  else if (name == "data_") {
    if (this.version == "CIF") this.popLoop();
    this.push( ['data_', attributes, [] ]);
  }
  else if (name == "save_") {
    if (this.version == "CIF") this.popLoop();
    this.push( ['save_', attributes, [] ]);
  }
  else if (name =="loop_") {
    if (this.version == "CIF") this.popLoop();
    this.push( ['loop_', this.fixTagComments(attributes), [] ]);
  }
  else if (name =="tags_") {
    this.push( ['tags_', attributes ]);
  }
  else {  // an actual _element_name
    if (this.version == "CIF") this.popLoop();
    this.push( ['item_', name, [] ]);

  }
}
STAR_handler.prototype.endElement = function(data){
  if (data == 'save_') {
     this.popLoop();
  }
  this.pop(data);
}

STAR_handler.prototype.fixTagComments = function(data){
  for (var i = 0; i < data.length; i++) {
    var tag = data[i];
    if (typeof tag === 'string') continue;
    data[i].unshift('@comment');
  }
  return data;
}

STAR_handler.prototype.popLoop = function(){
  while (this._mode == "loop_") {
      this.pop(null);
  }
}

STAR_handler.prototype.endBlock = function(data){
  //console.log("end Block " );
  //console.log("before modes:" + this._modes); 
  while (this._mode != "cif") {
      this.pop(null);
  }
  //console.log("after modes:" + this._modes); 
}

STAR_handler.prototype.characters = function(data){
  if (this._mode == 'loop_') {
    this.append( data);
  }
  else if (this._mode == 'item_') {
    this.replace( data);
  }
  //console.log("characters: "  );
}
STAR_handler.prototype.comment = function(data){
  if (typeof data === 'string') {
    if (data != '' && data != '\n') {
      this.append( ['@comment', data]);
    }
    return; 
  }
  // must be array of strings
  if (data.length == 0) return;
  for (var i=0 ; i<data.length; i++) {
    var white = data[i];
    if (white == '' || white == '\n') continue;
    this.append( ['@comment', data[i]]);
  }
  // console.log("comment " + data);
}

STAR_handler.prototype.composite = function(data){
  //var util = require('util');
  //console.log("composite: " );
  //console.log(util.inspect(data, false, null));
 //  this.append( data);
  //this.replace( data);
  if (this._mode == 'loop_') {
    this.append( data);
  }
  else if (this._mode == 'item_') {
    this.replace( data);
  }
}

// For Node.js
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.STAR_handler = STAR_handler;
}

