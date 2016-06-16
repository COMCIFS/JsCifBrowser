/**
  * STAR_observer provides an 'observer design pattern'
  * interface wrapping the STAR parsers' output event stream. 
  * Handler instances should register and then respond to these methods.
  */
function STAR_observer() {
  this._handlers = [];
}

STAR_observer.prototype.addHandler = function(handler){
  this._handlers.push(handler);
}

STAR_observer.prototype._notifyHandlers = function(event, data) {
  var handlers = this._handlers;
  for (var i = 0, handlers; handler = handlers[i]; i++) {
    handler.notifyEvent(event, data);
  }
}

STAR_observer.prototype.startDocument = function(){
  this._notifyHandlers('startDocument',null);
}
STAR_observer.prototype.endDocument = function(){
  this._notifyHandlers('endDocument',null);
}
STAR_observer.prototype.comment = function(data){
  this._notifyHandlers('comment',data);
}
STAR_observer.prototype.startElement = function(type, attributes){
  this._notifyHandlers('startElement',[type,attributes]);
}
STAR_observer.prototype.endElement = function(type){
  this._notifyHandlers('endElement',type);
}
STAR_observer.prototype.characters = function(data){
  this._notifyHandlers('characters',data);
}
STAR_observer.prototype.composite = function(data){
  this._notifyHandlers('composite',data);
}
STAR_observer.prototype.endBlock = function(){
  this._notifyHandlers('endBlock',null);
}

// For Node.js
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.STAR_observer = STAR_observer;
}
