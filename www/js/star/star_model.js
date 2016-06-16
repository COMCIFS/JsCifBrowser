
/**
 This should  base class for a CIF model and a Dictionary model
 THIS FILE IS NOT USED!!
 */

function StarModel() {
  // this is an abstract class. We store no instance data here.
}


StarModel.prototype.getValueAsString = function(value) {
 var lines = [];
 this._renderItemValue(lines,value);
 return lines.join('');
}


StarModel.prototype._renderItemValue = function(text, value) {
  if (typeof value === 'string' ) { 
    if (value.match(/[\n\r\f]/)) {
      text.push('\n;');
      text.push(value);
      text.push('\n;');
      return;
    }
    if (!value.match(/[ \t]/)) {
//      this._log("no space for " + value);
      text.push(value);
      return;
    }
    if (!value.match(/'/)) {
      text.push('\"');
      text.push(value);
      text.push('\"');
      return;
    }
    if (!value.match(/"/)) {
      text.push("\'");
      text.push(value);
      text.push("\'");
      return;
    }
    text.push(value);
  }
  else if (typeof value == 'number') {
    //text.push("" + value);
    text.push(numeric.prettyPrint(value).trim());
  }
  else if (value instanceof numeric.T) {
    if (value.x) 
      //text.push("" + value.x );
      text.push(numeric.prettyPrint(value.x).trim());
    if (value.y){ 
      if (value.y<0.) text.push("-");
      else            text.push("+");
      //text.push("i" + Math.abs(value.y));
      text.push("i");
      text.push(numeric.prettyPrint(Math.abs(value.y)).trim());
    }
  }
  else if (value instanceof Array) {
    if (numeric) {
      text.push(numeric.prettyPrint(value));
    } else {
      text.push('[');
      for (var i = 0; i <value.length; i++) { 
        if (i) text.push(', ');
        this._renderItemValue(text, value[i]) ;
      }
      text.push(']');
   }
  }
  else {
    text.push('{');
    var i = 0;
    for (var key in value) {
      if (i) text.push(', ');
      this._renderItemValue(text, key); 
      text.push(':');
      this._renderItemValue(text, value[key]); 
      i++
    }
    text.push('}');
  }

}

StarModel.prototype.newGlobalBlock = function() {
  return ['global_', null, [] ];
}
StarModel.prototype.newDataBlock = function(name) {
  return ['data_', name, [] ];
}
StarModel.prototype.newSaveBlock = function(name) {
  return ['save_', name, [] ];
}

StarModel.prototype.newLoop = function() {
  return ['loop_', [], [] ];
}

StarModel.prototype.newItem = function(name, value) {
  return ['item_', name, value ];
}

StarModel.prototype.newComment = function(comment) {
  return ['@comment', comment ];
}

/**
 * This seems viable because you could "Add" an extra column and preserve
 * existing field row/col indices.
 *
 */
StarModel.prototype.setLoopRowColVal = function(loop, nfields, row, col, nval) {
  var vals = loop[2]; 
  var dindex = row*nfields + col;
  if (dindex > vals.length) 
    throw new Error("StarModel setLoopRowColVal length mismatch error");
  if (col == nfields) 

  // without comments, we could just step straight there :-/
  var l = -1;
  for (var f = 0 ; f < vals.length; f++) {
    var val = vals[f];
    if (l+1 == dindex) {
      if (typeof val == 'object' && val[0] =='@comment') {
        val[1] = nval;
      } else {
        vals[f] = nval;
      } 
      break;
    }
    if (typeof val == 'object' && val[0] =='@comment') {
    } else {
      l++;
    } 
       
  }
}


StarModel.prototype.setLoopIndexVal = function(loop, nfields, index, nval) {
  var vals = loop[2]; 
  if (index > vals.length) 
    throw new Error("StarModel setLoopIndexVal length mismatch error");
  var val =  vals[index];
  if (typeof val == 'object' && val[0] =='@comment') {
    val[1] = nval;
  } else {
    vals[index] = nval;
  } 
}



