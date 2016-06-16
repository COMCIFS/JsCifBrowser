// hand crafted finite state machine parser for STAR/CIF2/CIF1

function StarObserver() {
  this._handlers = [];
  this.startDocument = function() { 
    this._notifyHandlers('startDocument', null);
  };
  this.endDocument = function() { 
    this._notifyHandlers('endDocument', null);
  };
  this.comment = function(tok) {
    this._notifyHandlers('comment', tok[1]);
  }
  this.startElement = function(tok, attributes) {
    this._notifyHandlers('startElement', [tok[1], attributes]);
  }
  this.endElement = function(tok) {
    if (tok) 
      this._notifyHandlers('endElement', tok[1]);
    else 
      this._notifyHandlers('endElement', null);
  }
  this.characters = function(tok) {
    this._notifyHandlers('characters', tok[1]);
  }
  this.composite = function(comp) {
    this._notifyHandlers('composite', comp);
  }
  this.endBlock = function() {
    this._notifyHandlers('endBlock', null);
  }
}
StarObserver.prototype.addHandler = function(handler){
  this._handlers.push(handler);
}

StarObserver.prototype._notifyHandlers = function(event, data) {
  var handlers = this._handlers;
  for (var i = 0, handlers; handler = handlers[i]; i++) {
    handler.notifyEvent(event, data);
  }
}


function StarParser() {
  this.tokChars = [' ','\t','\n','\r','\f','#','"',"'",'[',']','{','}',',',
          ':',';','_','d','D','g','G','l','L','s','S']; 
  this._tokenTypes = [
     'WSPACE','NEWLINE','COMMENT','DQUOTE','SQUOTE','LSQB','RSQB',
     'LPAR','RPAR','COMMA','COLON','SEMIC','DNAME','DATA','GLOBAL','LOOP',
     'SAVE','RSTRING','TQUOTE','MQUOTE', 'EOF', 'TQSTRING','MSTRING'];
  this._types = {};
  for (var i = 0; i < this._tokenTypes.length; i++) {
    this._types[this._tokenTypes[i] ] = i + 1; 
  }
  this._parseStates = ['INITIAL','DATA','GLOBAL','SAVE','LOOP','DATUM','MSTRING',
    'DNAME','TQSTRING','LIST','TABLE'];
  this._modes = {};
  for (var i = 0; i < this._parseStates.length; i++) {
    this._modes[this._parseStates[i] ] = i + 1; 
  }
  this.linecount = 0;
  this.yy = {'observer': new StarObserver()};
}

StarParser.prototype.debug = function(message) {
//  console.log(message);
}

StarParser.prototype.parse = function(source) {
  if (typeof source == 'string' || source instanceof String) {
    this._ich = 0;
    this._line = source;
    this._cch = this._line.length;
  } else this._file = source;
  var stack = [this._modes.INITIAL];
  this.yy.observer.startDocument();
  this._parse(stack, "dummy");
  this.yy.observer.endDocument();
  console.log("finished");
  return ;
};

StarParser.prototype._readline = function() {
  if (this._file) {
    this._line = this._file.readline();   
    this._ich = 0;
    this._cch = this._line.length;
    this.linecount++;
  } else {  
    if (this._ich >= this._cch) return null;
  }
  return this._line;
}

StarParser.prototype.error = function(message, token, mode) {
  console.log("Error reading line " + this.linecount);
  console.log(message  + mode);
  console.log(token);
     throw new Error("uh oh ");
}
StarParser.prototype.parseError = function(message) {
  console.log(message);
     throw new Error("uh oh2 ");
}


StarParser.prototype._modeSwitch = function(stack,mode, token) {
  if (stack.length >1) {
    stack.pop();
    this.yy.observer.endElement();
  }
    this.yy.observer.endBlock();
  stack.push(mode);
  if (mode == this._modes.DATA) {
    var strn = token[1].substring(5);
    token[1] = 'data_';
    this.yy.observer.startElement(token, strn);
  } else {
    this.yy.observer.startElement(token, []);
  }
};


StarParser.prototype._parse = function(stack, token) {
  var line;
  var states = [];
  var modes = this._modes;
  var types = this._types;
  this.debug(stack);
  while (token) { 
    var mode = stack[stack.length -1];
    switch (mode) {
      case modes.INITIAL:
        while ((token = this._getToken())) {
          type = token[0];
          if (type == types.EOF) return;
          if (type == types.COMMENT) {
            this.yy.observer.comment(token);
          }
          if (type == types.COMMENT || type == types.WSPACE ||
              type == types.NEWLINE) continue; 
          break;
        }
        if (type == types.DATA ) {
          this._modeSwitch(stack, modes.DATA, token);
          break;
        }
        if (type == types.GLOBAL) {
          this._modeSwitch(stack, modes.GLOBAL, token);
          break;
        }
        this.error("unexpected token ", token); 
        break;   
      case modes.DATA:
      case modes.GLOBAL:
        while ((token = this._getToken())) {
          type = token[0];
          if (type == types.COMMENT) {
            this.yy.observer.comment(token);
            continue;
          }
          if (type == types.EOF) return;
          if (type == types.WSPACE ||
              type == types.NEWLINE) continue; 
          if (type == types.DATA ) {
            this._modeSwitch(stack, modes.DATA, token)
            break;
          }
          if (type == types.GLOBAL) {
            this._modeSwitch(stack, modes.GLOBAL, token)
            break;
          }
          if (type == types.DNAME) {
            stack.push(modes.DATUM);
            break
          }
          if (type == types.SAVE) {
            stack.push(modes.SAVE);
            var strn = token[1].substring(5);
            token[1] = 'save_';
            this.yy.observer.startElement(token, strn);
            break
          }
          if (type == types.LOOP) {
            stack.push(modes.LOOP);
            break
          }
          this.error("unexpected token ", token); 
          break;
        }
        break;   
      case modes.SAVE:
        while ((token = this._getToken())) {
          type = token[0];
          if (type == types.COMMENT) {
            this.yy.observer.comment(token);
            continue;
          }
          if (type == types.WSPACE ||
              type == types.NEWLINE) continue; 
          if (type == types.DNAME) {
            stack.push(modes.DATUM);
            break
          }
          if (type == types.SAVE) {
            if (token[1].length >5) {
              stack.push(modes.SAVE);
              var strn = token[1].substring(5);
              token[1] = 'save_';
              this.yy.observer.startElement(token, strn);
            } else {
              stack.pop();
              this.yy.observer.endElement(token);
            }
            break
          }
          if (type == types.LOOP) {
            stack.push(modes.LOOP);
            break
          }
          this.error("unexpected token ", token); 
          break;
        }
        break;   
      case modes.DATUM:
        this.yy.observer.startElement(token,[]);
        while ((token = this._getToken())) {
          type = token[0];
          if (type == types.MQUOTE) {
            var tok = this._readMString();
            this.yy.observer.characters(tok);              
            break;
          }
          if (type == types.COMMENT) {
            this.yy.observer.comment(token);
            continue;
          }
          if (type == types.NEWLINE) continue; 
          if (type == types.WSPACE) continue; 
          if (type == types.SQUOTE || type == types.DQUOTE ||
              type == types.RSTRING ) {
            this.yy.observer.characters(token);              
            break;
          }
          if (type == types.TQUOTE) { 
            var tok = this._readTQString(token);
            this.yy.observer.characters(tok);              
            break;
          }
          if (type == types.LSQB) {
            stack.push(modes.LIST); 
            var tok = this._parse(stack, token); 
            this.yy.observer.composite(tok);              
            break;
          }
          if (type == types.LPAR) {
            stack.push(modes.TABLE); 
            var tok = this._parse(stack, token); 
            this.yy.observer.composite(tok);              
            break;
          }
          this.error("unexpected token ", token); 
          break;
        }
        this.yy.observer.endElement(token);              
        stack.pop();
        break;   
      case modes.LIST:
        var datum = [];
        while ((token = this._getToken(modes.LIST))) {
          type = token[0];
          if (type == types.WSPACE) continue; 
          if (type == types.COMMA) continue; 
          if (type == types.NEWLINE) continue; 
          if (type == types.SQUOTE || type == types.DQUOTE ||
             type == types.RSTRING ) {
            //this.yy.observer.characters(token);              
            datum.push(token[1]);
            continue;
          }
          if (type == types.TQUOTE) { 
            token = this._readTQString(token);
            datum.push(token[1]);
            continue;
          }
          if (type == types.LPAR) {
            stack.push(modes.TABLE); 
            var data =this._parse(stack, token); 
            datum.push(data);
            continue;
          }
          if (type == types.LSQB) {
            stack.push(modes.LIST); 
            var data = this._parse(stack, token); 
            datum.push(data);
            continue;
          }
          if (type == types.RSQB) {
            stack.pop();
            return datum;
            break;
          }
          this.error("unexpected token ", token); 
          break;
        }
        break;   
      case modes.TABLE:
        var datum = {};
        var key;
        var value;
      while (true) { 
        while ((token = this._getToken(modes.TABLE))) {
          type = token[0];
          if (type == types.WSPACE) continue; 
          if (type == types.NEWLINE) continue; 
          if (type == types.SQUOTE || type == types.DQUOTE ||
             type == types.RSTRING ) {
             key = token[1];
             break;
          }
          if (type == types.RPAR) break;
          this.error("unexpected token ", token); 
        }
        if (type == types.RPAR) {
          stack.pop();
          return datum;
          break;
        }
        // got the key
        while ((token = this._getToken(modes.TABLE))) {
          type = token[0];
          if (type == types.WSPACE) continue; 
          if (type == types.COLON) continue; 
          if (type == types.NEWLINE) continue; 
          break;
        }
        // skipped over the COLON to the value
        type = token[0];
        if (type == types.SQUOTE || type == types.DQUOTE ||
             type == types.RSTRING ) {
          datum[key] = token[1];
        }
        else if (type == types.TQUOTE) { 
          token = this._readTQString(token);
          datum[key] = token[1];
        }
        else if (type == types.LPAR) {
          stack.push(modes.TABLE); 
          var data = this._parse(stack, token); 
          datum[key] = data;
        }
        else if (type == types.LSQB) {
          stack.push(modes.LIST); 
          var data = this._parse(stack, token); 
          datum[key] = data;
        }
        // got the value,  skip over whitespace or comma
        while ((token = this._getToken(modes.TABLE))) {
          type = token[0];
          if (type == types.WSPACE) continue; 
          if (type == types.COMMA) continue; 
          if (type == types.NEWLINE) continue; 
          break;
        }
        // what is the token?
        if (type == types.RPAR) { // finished composite object
          stack.pop()
          return datum;
          break;
        }
        this._pushbackToken(token);
      }
        break;
      case modes.LOOP:
        var headers = [];
        var looptok = token;
        while ((token = this._getToken())) {
          type = token[0];
          if (type == types.WSPACE) continue; 
          if (type == types.NEWLINE) continue; 
          if (type == types.COMMENT) {
            headers.push([token[1]]);
            continue; 
          }
          if (type == types.DNAME) {
            headers.push(token[1]);
            continue;
          }
          break;
        }
        this.yy.observer.startElement(looptok, headers);
        this._pushbackToken(token);
        // got the header, now get the values
        while ((token = this._getToken())) {
          type = token[0];
              this.debug(token);
          if (type == types.NEWLINE) continue;
          if (type == types.WSPACE) continue; 
          if (type == types.MQUOTE) {
            var tok = this._readMString();
            this.yy.observer.characters(tok);              
            continue;
          }
          if (type == types.COMMENT) {
            this.yy.observer.comment(token);              
            continue; 
          }
          if (type == types.SQUOTE || type == types.DQUOTE ||
             type == types.RSTRING ) {
            this.yy.observer.characters(token);              
            continue;
          }
          if (type == types.TQUOTE) { 
            var  token = this._readTQString(token);
            this.yy.observer.characters(token);              
            continue
          }
          if (type == types.LPAR) {
            stack.push(modes.TABLE); 
            var data = this._parse(stack, token); 
            this.yy.observer.composite(data);              
            continue;
          }
          if (type == types.LSQB) {
            stack.push(modes.LIST); 
            var data = this._parse(stack, token); 
            this.yy.observer.composite(data);              
            continue;
          }
          break;
        }
        stack.pop();
        this._pushbackToken(token);
        break;
      default:
        this.error("unexpected token ", token, mode); 
        break;
    } // end switch
  } // while 
}


StarParser.prototype._readTQString = function(startok) {
  var match = startok[1]; // string to match 
  var datum = []
  var line = this._line;
  var sch = ich = this._ich;
  var ch;
  var cch = this._cch; 
  var notyet = true;
  while(notyet) {
    for (; ich < cch; ich++) {
      ch = line.charAt(ich); 
      if (ch == match.charAt(0)) {
        if (line.substring(ich,ich+3) == match) {
          notyet = false;
          break;
        }
      }
    }
    datum.push(line.substring(sch,ich));
    if (ich == cch) { 
       line = this._readline();
       cch = line.length;
       ich = sch = 0;
       if (! line) break;
    }
  } 
  ich = ich + 3; 
  return this._token(this._types.TQSTRING, datum.join(''), ich);
}

StarParser.prototype._readMString = function() {
  var datum = []
  var line = this._line;
  var sch = ich = this._ich;
  var ch;
  var cch = this._cch; 
  var primed = false;
  var notyet = true;
  var strn;
  while(notyet) {
    for (; ich < cch; ich++) {
      ch = line.charAt(ich); 
      if (primed && ch == ';') {
        notyet = false;
        ich++;
        break;
      }
      if (ch == '\n' || ch == '\f' || ch == '\r' ) {
        if (! this.file) this.linecount++;
        primed = true;
        ich++;
        break;
      }
      primed = false;
    }
    strn = line.substring(sch,ich);
    //datum.push(strn);
    datum.push(strn);
    sch = ich;
    if (ich == cch) { 
       line = this._readline();
       cch = line.length;
       ich = sch = 0;
       if (! line) break;
    }
  } 
  strn = datum.join('');
  strn = strn.substring(0, strn.length-2);
  return this._token(this._types.MSTRING, strn, ich);
};

StarParser.prototype._getToken = function(mode) {
  var line = this._readline();
  var types = this._types;
  var sch = ich = this._ich;
  var cch = this._cch;
  if (! line ) return this._token(types.EOF,'',ich);   // no more lines 
  var ch = line.charAt(ich); 
  var ch1, ch2;

  if (ch == ' ' || ch == '\t') {
    for (++ich; ich < cch; ich++) {
      ch = line.charAt(ich); 
      if (ch != ' ' && ch != '\t' ) {
        break;
      }
    }
    return this._token(types.WSPACE, line.substring(sch,ich),ich);
  }
  if (ch == '\n' || ch == '\f' || ch == '\r') {
    if (! this.file) this.linecount++;
    if (ich <cch) { 
      var ch1 =line.charAt(ich + 1);
      if (ch1 == ';') {
        ich += 2;
        return this._token(types.MQUOTE, ch + ch1, ich) ;
      }
      if (ch1 == '\n' || ch1 == '\f' || ch1 == '\r') {
        if (! this.file) this.linecount++;
        return this._token(types.NEWLINE, ch + ch1, ++ich) ;
      } 
    } // one or more sequential newlines
    return this._token(types.NEWLINE, ch, ++ich) ;
  }
  if (ch == '#') {
    for (ich++; ich < cch; ich++) {
      ch = line.charAt(ich); 
      if (ch == '\n' || ch == '\f' || ch == '\r') {
        //ich--;
        break;
      }
    }
    // strip leading '#'
    return this._token(types.COMMENT, line.substring(sch+1,ich), ich);
  }
  if (ch == '"' || ch == "'") {
    if (ich >=cch) { 
      return this.parseError("Quote mismatch on line:\n" +line);
    }
    ch1 = line.charAt( ++ich); 
    if (ch1 != ch) {
      for (; ich < cch; ich++) {
        ch1 = line.charAt(ich); 
        if (ch1 == ch) {
          ch2 = line.charAt(ich+1); 
          if (mode == this._modes.LIST || mode == this._modes.TABLE) {
            return this._token(types.DQUOTE, line.substring(sch+1,ich),++ich);
          } 
          if (ch2 == '\n' || ch2 == '\f' || ch2 == '\r' ||
              ch2 == ' ' || ch2 == '\t') {
            return this._token(types.DQUOTE, line.substring(sch+1,ich),++ich);
          }
        }
        if (ch1 == '\n' || ch1 == '\f' || ch1 == '\r') {
          break;
          //ich--;
        }
      }
      return this.parseError("Quote mismatch on line:\n" );
    }
    if (ich >=cch) { 
      return this.parseError("Quote mismatch on line:\n" +line);
    }
    ch2 = line.charAt( ++ich); 
    if (ch2 != ch) {    // null string '' or ""
      --ich;
      return this._token(types.DQUOTE, line.substring(sch,ich),ich);
    } 
    // else triple quote 
    ++ich;
    return this._token(types.TQUOTE, line.substring(sch,ich),ich);
  }
  if (ch == '[') {
    return this._token(types.LSQB, ch, ++ich);
  }
  if (ch == ']') {
    return this._token(types.RSQB, ch, ++ich);
  }
  if (ch == '{') {
    return this._token(types.LPAR, ch, ++ich);
  }
  if (ch == '}') {
    return this._token(types.RPAR, ch, ++ich);
  }
  if (ch == ',') {
    if (mode == this._modes.LIST || mode == this._modes.TABLE) {
      return this._token(types.COMMA, ch, ++ich);
    }
  }
  if (ch == ':') {
    if (mode == this._modes.TABLE)
      return this._token(types.COLON, ch, ++ich);
  } 
//  if (ch == ';') {
//    return this._token(types.SEMIC, ch, ++ich);
//  } 
  if (ch == '_') {  // _datum_name
    for (++ich ; ich < cch; ich++) {
      var ch1 = line.charAt( ich); 
      if (ch1 == ' ' || ch1 == '\t' || ch1 == '\n' || ch1 == '\f' || ch1=='\r') {
        return this._token(types.DNAME, line.substring(sch, ich), ich);
      }
    }
    return this.parseError("Incomplete datum name:\n" +line);
    // or maybe buffer has run out?
  } 
  if (ch == 'd' || ch == 'D' ) {
    var subs = line.substring(ich, ich + 5).toLowerCase();
    if (subs.length == 5 && subs == 'data_') {
      for (ich += 5; ich < this._cch; ich++) {
        var ch1 = line.charAt(ich); 
        if (ch1 == ' ' || ch1 == '\t' || ch1 == '\n' || ch1 == '\f' || ch1=='\r') {
          return this._token(types.DATA, line.substring(sch, ich), ich);
        }
      }
      return this.parseError("Incomplete data_ name:\n" +line);
      // or maybe buffer has run out?
    }
    // else drop through to raw string
  } else if (ch == 'g' || ch == 'G' ) {
    var subs = line.substring(ich, ich + 7).toLowerCase();
    if (subs.length == 7 && subs == 'global_') {
      for (ich += 7; ich < cch; ich++) {
        var ch1 = line.charAt(ich); 
        if (ch1 == ' ' || ch1 == '\t' || ch1 == '\n' || ch1 == '\f' || ch1=='\r') {
          return this._token(types.GLOBAL, line.substring(sch, ich), ich);
        }
      }
      return this.parseError("Incomplete global_ name:\n" +line);
      // or maybe buffer has run out?
    }
  } else if (ch == 'l' || ch == 'L' ) {
    var subs = line.substring(ich, ich + 5).toLowerCase();
    if (subs.length == 5 && subs == 'loop_') {
      ich += 5;
      var ch1 = line.charAt(ich); 
      if (ch1 == ' ' || ch1 == '\t' || ch1 == '\n' || ch1 == '\f' || ch1=='\r') {
         return this._token(types.LOOP, line.substring(sch, ich), ich);
      }
    }
  } else if (ch == 's' || ch == 'S' ) {
    var subs = line.substring(ich, ich + 5).toLowerCase();
    if (subs.length == 5 && subs == 'save_') {
      for (ich += 5; ich < cch; ich++) {
        var ch1 = line.charAt(ich); 
        if (ch1 == ' ' || ch1 == '\t' || ch1 == '\n' || ch1 == '\f' || ch1=='\r') {
          return this._token(types.SAVE, line.substring(sch, ich), ich);
        }
      }
      return this.parseError("Incomplete save name:\n" +line);
      // or maybe buffer has run out?
    }
  }

  // otherwise, its a raw/undelimited string
  for (++ich; ich < cch; ich++) {
    var ch1 = line.charAt(ich); 
    if (ch1 == ' ' || ch1 == '\t' || ch1 == '\n' || ch1 == '\f' || ch1=='\r') {
      break;
    }
    if (ch1 == ',' || ch1 == ':' ||
        ch1 == '[' || ch1 == ']' || ch1 == '{' || ch1=='}') {
      if (mode == this._modes.LIST || mode == this._modes.TABLE) break;
    }
  }
  return this._token(types.RSTRING, line.substring(sch, ich), ich);
};

StarParser.prototype._pushbackToken = function(token) {
  // this will probably fail in file mode
  var type = token[0];
  if (type == this._types.NEWLINE &&(! this.file)) this.linecount--;
  var len = token[1].length;
  if (type == this._types.SQUOTE || type == this._types.DQUOTE) {
     len = len + 2;
  } 
  this._ich = this._ich - len;
}

StarParser.prototype._token = function(toktype, strn, stop) {
  this._ich = stop ;
//  this.debug("" + toktype  + " " + stop + ":"  +this._cch +
//       " '" + strn + "'" );
  return [toktype, strn, stop]; 
};

// For Node.js
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.StarParser = StarParser;
  exports.STAR_parser = new StarParser;
}
