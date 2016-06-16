

function JSON_CIF2XDF(doc) {
  this._doc = doc
  this._xml = null;
} 

JSON_CIF2XDF.prototype.convertJSON = function(data) {
  this._data = data;
  this._xml = this._doc.createDocumentFragment();
  this._walk(this._data, this._xml); 

  xdf = this._xml;
  this._data = null;
  this._xml = null;
  return xdf; 
} 

JSON_CIF2XDF.prototype._walk = function(json, xml) {
  for (var node = 0; node < json.length; node++) {
    child = json[node];   
    type = child[0];
    if (type == 'global_' || type == 'data_') {
      var xdf = this._doc.createElement('XDF')
      var xmlns = this._doc.createAttribute('xmlns')
      xmlns.nodeValue = 'http://xml.gsfc.nasa.gov/DTD/XDF_017.dtd';
      xdf.setAttributeNode(xmlns);
      var name = this._doc.createAttribute('name')
      name.nodeValue = type;
      xdf.setAttributeNode(name);
      var cont = this._doc.createElement('structure');
      var name = this._doc.createAttribute('name')
      cont.setAttributeNode(name);
      var progeny = child[1];
      if (type == 'global_') {
      name.nodeValue = type;
      } 
      else {
      name.nodeValue = child[1];
      progeny = child[2];
      }
      xdf.appendChild(cont);
      xml.appendChild(xdf);
      this._walk(progeny, cont);
    } 
    else if (type =='save_') {
      var cont = this._doc.createElement('structure');
      var name = this._doc.createAttribute('name')
      name.nodeValue = child[1];
      cont.setAttributeNode(name);
      xml.appendChild(cont);
      this._walk(child[2], cont);
    }
    else if (type == 'loop_') {
      var cont = this._doc.createElement('structure');
      var name = this._doc.createAttribute('name')
      name.nodeValue = type;
      cont.setAttributeNode(name);
      xml.appendChild(cont);
      var list = this._doc.createElement('array');
      var name = this._doc.createAttribute('name')
      name.nodeValue = type;
      list.setAttributeNode(name);
      cont.appendChild(list);
      var axis = this._doc.createElement('axis');
      list.appendChild(axis);
      var values = this._doc.createElement('values');
      axis.appendChild(values);
      var fieldCnt = 0;
      for (var i = 0; i < child[1].length; i++) { 
        var tag = child[1][i]; 
        console.log(tag);
        if (typeof tag == 'string') {
          var field = this._doc.createElement('field');
          values.appendChild(field);
          var name = this._doc.createElement('name');
          field.appendChild(name);
          var text = this._doc.createTextNode(tag);
          name.appendChild(text);
          fieldCnt++;
        }
        else {
          var comment = this._doc.createComment(tag);
          values.appendChild(comment);
        }
      }
      var read = this._doc.createElement('read');
      var for1 = this._doc.createElement('for');
      var axis1 = this._doc.createAttribute('axisIdRef')
      axis1.nodeValue = 'rows';
      for1.setAttributeNode(axis1);
      var for2 = this._doc.createElement('for');
      var axis2 = this._doc.createAttribute('axisIdRef')
      axis2.nodeValue = 'fields';
      for2.setAttributeNode(axis2);
      var delimiter = this._doc.createElement('delimiter');
      var delim = this._doc.createAttribute('delimiter')
      delim.nodeValue = '\t';
      delimiter.setAttributeNode(delim);
      

      var data = this._doc.createElement('data');
      var values = child[2];
      var j = 0;
      var line = []
      var sep  = '\t';
      for (var i = 0; i < values.length; i++) { 
        var val = values[i]; 
        if (typeof val == 'string') {
          j++;
          if (j >=fieldCnt) {
            j = 0;
            line.push('\n');
            var dat = this._doc.createTextNode(line.join('')); 
            data.appendChild(dat);
            line = []
          } 
          if (j != 0) line.push(sep); 
          line.push(val); 
        } 
        else {
          line.push(sep); 
          if (val[0] == '@comment') {
            line.push('#' + val[1]); 
          }
          else {
            line.push("" + val); // convert to string
          }
        }
      }
      // dump up any residuals ????
      if (line.length > 0) {
        var dat = this._doc.createTextNode(line.join('')); 
        data.appendChild(dat);
      }
    }
    else if (type == 'item_') {
      var cont = this._doc.createElement('value');
      var name = this._doc.createAttribute('name')
      var text = this._doc.createTextNode(child[2]);
      name.nodeValue = type;
      cont.setAttributeNode(name);
      cont.appendChild(text);
      xml.appendChild(cont);
    }
    else if (type == '@comment') {
      var comment = this._doc.createComment(child[1]);
      xml.appendChild(comment);
    } else {
      throw new Error("Unknown type '" + type +"' while converting JSON to XML\n" + json ); 
    }
  }
} 


