// from  http://www.webmasterworld.com/javascript/3077477.htm
//  - just to postpone using jquery...
//tooltip.js 
//var tool_layer = document.createElement("div"); 
//document.body.appendChild(tool_layer); 
//tool_layer.style.position = "absolute"; 
//tool_layer.style.visibility = "hidden";

//Define style for message box here: 
//tool_layer.style.border = "1px solid #000000";

var tooltip = { 
  timeout:null,
  tool_layer_id:'tooltip',
  tool_layer:null,
  popped:false,
  displayed:false, 
  clearTimeout: function() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
  },
  on:function(message, evnt){ 
    this.displayed = true; 
    this.tool_layer = document.getElementById(this.tool_layer_id);
    this.tool_layer.style.visibility = "visible"; 
    if (evnt) {
      var pos = this.getMousePosition(evnt);
      var dist = -15;
      this.tool_layer.style.left = (pos[0] + dist) + 'px'; 
      this.tool_layer.style.top  = (pos[1] + dist) + 'px'; 
      /*evnt.returnValue = false; */
    }
    return false; 
  }, 
  mouseOutCheck:function(ev) {
    var isIE = document.all ? true : false;
    if (!isIE) {
      if (ev.target === this.tool_layer && 
         ! ev.target.contains(ev.relatedTarget))  this.off();
    }
    return false;
  },
  getMousePosition: function(ev) {
    var isIE = document.all ? true : false;
    var _x;
    var _y;
    if (!isIE) {
      _x = ev.pageX;
      _y = ev.pageY;
    }
    if (isIE) {
      _x = ev.clientX + document.body.scrollLeft;
      _y = ev.clientY + document.body.scrollTop;
    }
    posX = _x;
    posY = _y;
    var  pos=Array(posX,posY);
    return pos;
  },
  off:function(){ 
    this.clearTimeout();
    this.displayed = false; 
    this.popped = false;
    if (this.tool_layer) {  
      this.tool_layer.style.visibility = "hidden"; 
    }
  }, 

  move:function(evt){ 
//    this.clearTimeout();
    var dist = -15; 
    if (! this.tool_layer)  
      this.tool_layer = document.getElementById(this.tool_layer_id);
    if(this.tool_layer && (! this.popped) ){ 
      if (1 === 1) {
        // skip the rest
      }
      else if (document.addEventListener) { 
        this.tool_layer.style.left = ((evt.clientX + window.pageXOffset)+dist) + 'px'; 
        this.tool_layer.style.top = ((evt.clientY + window.pageYOffset)+dist) + 'px'; 
      } 
      else if (window.opera) { 
        this.tool_layer.style.left = ((evt.clientX + window.pageXOffset)+dist) + 'px'; 
        this.tool_layer.style.top = ((evt.clientY + window.pageYOffset)+dist) + 'px'; 
      } 
      else if (window.event) { 
        if (document.compatMode && document.compatMode!= 'BackCompat') { 
          this.tool_layer.style.left = ((event.clientX + document.documentElement.scrollLeft)+dist) + 'px'; 
          this.tool_layer.style.top = ((event.clientY + document.documentElement.scrollTop)+dist) + 'px'; 
        } 
        else { 
          this.tool_layer.style.left = ((event.clientX + document.body.scrollLeft)+dist) + 'px'; 
          this.tool_layer.style.top = ((event.clientY + document.body.scrollTop)+dist) + 'px'; 
        } 
      } 
      else if (document.layers) { 
        this.tool_layer.left = evt.pageX+dist; 
        this.tool_layer.top = evt.pageY+dist; 
      } 
    } 
    this.popped = true;
  } 
} 
