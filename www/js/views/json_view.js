

function JSON_CIF2HTML(doc, filename, prefix) {
  this._doc = doc
  this._filename = filename;
  this._prefix = prefix;
  this._xml = null;
} 

JSON_CIF2HTML.prototype.convertJSON = function(data) {
  this._data = data;
  this._xml = this._doc.createDocumentFragment();
  var sup = this._doc.createElement('div');
  var klass = this._doc.createAttribute('class');
  klass.nodeValue = "supplement";
  this._xml.appendChild(sup);
  var h2 = this._doc.createElement('h2');
  klass = this._doc.createAttribute('class');
  klass.nodeValue = "title";
  var title = this._doc.createTextNode(this._filename);
  sup.appendChild(h2);
  h2.appendChild(title);
  this._walk(this._data, sup); 

  var html = this._xml;
  this._data = null;
  this._xml = null;
  return html; 
} 

JSON_CIF2HTML.prototype._walk = function(json, xml) {
  for (var node = 0; node < json.length; node++) {
    child = json[node];   
    type = child[0];
    if (type == 'global_' || type == 'data_' || type == 'save_') {
      var dl = this._doc.createElement('dl');
      xml.appendChild(dl);
      var dt = this._doc.createElement('dt');
      dl.appendChild(dt);
      var id = this._doc.createAttribute('id');
      dt.setAttributeNode(id);
      var a = this._doc.createElement('a');
      dt.appendChild(a);
      var href = this._doc.createAttribute('href');
      a.setAttributeNode(href);
      var strn; 
      if (type == 'global_') {
        strn = type;
      } 
      else {
        strn = child[1];
      }
      text = this._doc.createTextNode("[+]\240");
      a.appendChild(text);
      text = this._doc.createTextNode(strn);
      strn = this._prefix + strn; 
      id.nodeValue = strn;
      href.nodeValue = "#"; // +strn;
      a.appendChild(text);
      id.nodeValue = strn;
      a.setAttribute('onclick',"CifJs.displayStateFlip('" + strn + "');event.returnValue=false;return false;");

      var dd = this._doc.createElement('dd');
      dd.style.display = "none";
      dl.appendChild(dd);
      var progeny = child[1];
      if (type == 'data_' || type =='save_' ) {
        progeny = child[2];
      }
      this._walk(progeny, dd);
    } 
    else if (type == 'loop_') {
      var dl = this._doc.createElement('dl');
      var dt = this._doc.createElement('dt');
      dl.appendChild(dt);
      var text = this._doc.createTextNode("loop_ data");
      dt.appendChild(text);
      dl = this._doc.createElement('dl');
      var span = this._doc.createElement('span');
      dl.appendChild(span);
      var klass = this._doc.createAttribute('class')
      klass.nodeValue = "XDF_arrayheader";

      var values = this._doc.createElement('values');
      span.appendChild(values);
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

      var pre = this._doc.createElement('pre');
      dl.appendChild(pre);
      klass = this._doc.createAttribute('class')
      klass.nodeValue = 'XDF_textval';
      var style = this._doc.createAttribute('style');
      klass.nodeValue = "white-space: pre-wrap;";

      var values = child[2];
      var j = -1;
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
            pre.appendChild(dat);
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
        pre.appendChild(dat);
      }
      xml.appendChild(dl);

    }
    else if (type == 'item_') {
      var dl = this._doc.createElement('dl');
      var dt = this._doc.createElement('dt');
      dl.appendChild(dt);
      var klass = this._doc.createAttribute('class')
      klass.nodeValue = "XDFValue";
      var text = this._doc.createTextNode(child[1]);
      dt.appendChild(text);
      var dd = this._doc.createElement('dd');
      klass = this._doc.createAttribute('class')
      klass.nodeValue = "XDF_textval";
      var txt = "?";
      if (child[2]) {
         txt = child[2];
      }
      var text = this._doc.createTextNode(txt);
      dd.appendChild(text);
      dl.appendChild(dd);
      xml.appendChild(dl);
    }
    else if (type == '@comment') {
      var comment = null;
      if (xml === this._xml.firstChild) {
        if (xml.hasChildNodes() && xml.lastChild.nodeName == 'DL' &&
            xml.lastChild.hasChildNodes() && xml.lastChild.lastChild.nodeName == 'DD' && 
            xml.lastChild.firstChild.id == this._prefix + "header") {
          var pre = xml.lastChild.lastChild.lastChild;
          var text = this._doc.createTextNode("\n" + child[1]);
          pre.appendChild(text);
          continue;
        }
        var dl = this._doc.createElement('dl');
        xml.appendChild(dl);
        var dt = this._doc.createElement('dt');
        dl.appendChild(dt);
        var id = this._doc.createAttribute('id');
        dt.setAttributeNode(id);
        var a = this._doc.createElement('a');
        dt.appendChild(a);
        var href = this._doc.createAttribute('href');
        a.setAttributeNode(href);
        var header = "header";
        var strn = this._prefix + header
        id.nodeValue = strn;
        href.nodeValue = "#" ; // +strn;
        text = this._doc.createTextNode("[+]\240");
        a.appendChild(text);
        text = this._doc.createTextNode(header);
        a.appendChild(text);
       // a.setAttribute('onclick',"CifJs.displayStateFlip('" + strn + "')");
        a.setAttribute('onclick',"CifJs.displayStateFlip('" + strn + "');event.returnValue=false;return false;");
        //a.onclick = new Function("CifJs.displayStateFlip('" + strn + "')");
        var dd = this._doc.createElement('dd');
        dd.style.display = "none";
        dl.appendChild(dd);
        comment = this._doc.createElement('pre');
        dd.appendChild(comment);
        
        var text = this._doc.createTextNode(child[1]);
        comment.appendChild(text);
      } 
      else {
        try {
          comment  = this._doc.createComment(child[1]);
          xml.appendChild(comment);
        } catch (e) {
          console.log(child[1]);
          console.log(e);
          continue;        
        } 
      }
    } else {
      throw new Error("Unknown type '" + type +"' while converting JSON to XML\n" + json ); 
    }
  }
} 


