/*
 * @file This module provides a Handler for the dREL Parse Tree 
 * which acts to convert dREL code into (mostly) statically typed 
 * JavaScript code.
 */

if (typeof require !== 'undefined') {
  var Lib = require("./library.js").Library;
  var Library = new Lib();
}

/**
 * This is a container for holding type information for each relevant node 
 * of the Parse Tree (Concrete Syntax Tree). 
 * Not every node requires a Type.
 * @constructor
 * @param info_dict {Object} Basically a hashtable of properties.
 */
function Type(info_dict) {
	this.class = null;// Global | local | Category | Item  
	this.type = null;// func | constant | CatRef | var | ItemRef |ListIndex |MapIndex
	this.cont = null;// container Scalar | List | Tuple | Matrix | Vector | Object
	this.base = null; 
	this.rank = null;
	this.dim = null;
//this.returnType = null;
//this.args = null;
// copy supplied keys
	for (key in info_dict) {
		this[key] = info_dict[key];
	}
}

/**
 * @memberof Type.prototype
 * @param other {Type} An {Object} or hashtable of Type properties to be copied. 
 * @return null
 */
Type.prototype.copy = function(other) {
 // copy supplied keys
 for (key in other) {
   this[key] = other[key];
 }
};


/**
 * This class handles a dREL Parse Tree object, visiting each node and 
 * creating a JavaScript based rendering of the sub branches, compatible
 * with the functionality provided by the dREL {Context}. 
 * Currently, probably better to create a new one of these every time you 
 * need to convert a dREL method - just in case the post-convert cleanup 
 * doesn't work so well.
 * @constructor
 */
function dREL_handler() {
  this._compileMode;    // FUNCTION or PROCEDURE - require different approaches
  this._methodClass;    // evaluation, definition or validation
  this._varCounter = 0;
  this._systemFunction = null; // special mode for handling system functions
  this._localForLists = {}; // a hash of stacks
  this._debug = 0;  // 0 or 1 => on or off
  this._dependencies = {'cats':{}, 'items':{}, 'funcs':{} };

  this._types = { };
//  grep -o "\['[A-Z_]*" drel.jison | sort -u | perl -p -e 's/[[]/    /' | perl -p -e 's/$/'"'"',/'
  this._defined = [
    'ARGLIST',
    'ASSIGN',
    'ASSIGN_EXPR',
    'BACKTICK_EXPR',
    'BREAK_EXPR',
    'COMPLEX_FLOAT',
    'COMPLEX_INT',
    'COMP_EXPR',
    'COMP_FOR_TEST_ARG',
    'DEL_EXPR',
    'DOTNAME',
    'DOT_ID_EXPR',
    'DO_EXPR',
    'ELLIPSIS',
    'ELSE_EXPR',
    'ELSIF_EXPR',
    'EXPRLIST',
    'FALSE',
    'FLOAT',
    'FOR_EXPR',
    'FUNCTION_CALL',
    'FUNCTION_EXPR',
    'FUNC_ARGLIST',
    'FUNC_ARG',
    'HEX',
    'IF_EXPR',
    'INLINE_IF_EXPR',
    'INT',
    'LIST_EXPR',
    'LONG',
    'LOOP_COND_EXPR',
    'LOOP_EXPR',
    'MATHOP_EXPR',
    'METHOD_CALL_ARG',
    'NAME',
    'NEXT_EXPR',
    'NONE',
    'NOOP',
    'OBJ_PROP',
    'OCTAL',
    'PASS_EXPR',
    'PRINT_EXPR',
    'PROCEDURE',
    'RANGE_EXPR',
    'REPEAT_EXPR',
    'RETURN_EXPR',
    'SLICEOP',
    'STAR_EXPR',
    'STATEMENTS',
    'STRING',
    'SUBSCRIPT',
    'SUBSCRIPT_EXPR',
    'SUBSCRIPTLIST',
    'TESTLIST',
    'TRUE',
    'WHILE_EXPR',
    'WITH_EXPR',
    'YIELD_EXPR' 
   ];
   for (var i = 0; i < this._defined.length; i++) {
     this._types[this._defined[i] ] = i + 1; 
   }
   // grep "\['MATHOP" drel.jison | grep -o -E "'[A-Z]+'" | sort -u
  this._mathOps = [
    'AND',
    'BITAND',
    'BITOR',
    'DIV',
    'DIVDIV',
    'INVERT',
    'LSHIFT',
    'MINUS',
    'MOD',
    'NEG',
    'NOT',
    'OR',
    'PLUS',
    'POS',
    'POW',
    'RSHIFT',
    'TIMES',
    'XOR'
  ];
  this._ops = {};
  for (var i = 0; i < this._mathOps.length; i++) {
    this._ops[this._mathOps[i] ] = i + 1; 
  }
  // these operators only apply to numbers 
  var types = this._ops;
  this.bool = {}; 
  this.bool[types.AND] = '&&';
  this.bool[types.OR]  = '||';

  this.bits = {}; 
  this.bits[types.BITAND]='&';
  this.bits[types.BITOR]='|';
  this.bits[types.LSHIFT]='<<';
  this.bits[types.RSHIFT]='>>';
  this.bits[types.XOR]='^';
  this.sign = {}; 
  this.sign[types.NEG]='-';
  this.sign[types.POS]='+';
  this.basic = {}; 
  this.basic[types.PLUS]='+';
  this.basic[types.MINUS]='-';
  this.basic[types.DIV]='/';
  this.basic[types.MOD]='%';
  this.basic[types.TIMES]='*';
  this.basic[types.DIVDIV]='//';
  
  this.numericTypes = {'Int': 1, 'Integer':1, 'Long':2, 'Float':3, 'Real':3, 
     'Complex':4, 'Measure':5, 'ComplexMeasure':6 };
 
  this._systemFuncs = {        // hack defined here 
    'Type_Contents':['ItemRef'], //func takes ItemRef arg and returns its type.c
    'Current_Row':['CatRef'],   //func takes CatRef arg and returns current row
    'Throw':['SubsItemRef','String'],  //func takes string arg 
    'Alert':['SubsItemRef','String', 'String'], //func ItemRef level code and mesg
    'BlockHasItem':['SubsCtxtRef','String'], // check block contains _item_name. return boolean 
    'BlockHasItemValue':['SubsCtxtRef','String'], // check  _item_name has a non '?' value
    'CategoryName':['SubsCtxtRef','String'], // return category class of  _item_name 
    'ObjectName':['SubsCtxtRef','String'] //   return object name of item in category
  };   
}

dREL_handler.prototype.debug = function(text) {
  // yeah yeah I know :-/
  if (! this._debug) return; 
  if (typeof CifJs == 'undefined') {
     console.debug(text);
  } else CifJs.debug(text);
};

dREL_handler.prototype.info = function(text) {
  // yeah yeah I know :-/
  if (! this._debug) return; 
  if (typeof CifJs == 'undefined') {
     console.info(text);
  } else CifJs.info(text);
};

dREL_handler.prototype.warn = function(text) {
//  if (! this._debug) return; 
  if (typeof CifJs == 'undefined') {
     console.warn(text);
  } else CifJs.warn(text);
};

dREL_handler.prototype.error = function(text) {
//  if (! this._debug) return; 
  if (typeof CifJs == 'undefined') {
     console.error(text);
  } else CifJs.error(text);
};

dREL_handler.prototype.fatal = function(text) {
//  if (! this._debug) return; 
  if (typeof CifJs == 'undefined') {
     console.fatal(text);
  } else CifJs.fatal(text);
};
 
/**
 * Compile a JavaScript source code from the supplied dREL parse tree.
 *  @memberof dREL_handler.prototype
 * @param name	{string} DDLm _definition.id for the method being processed. 
 * @param ast	{Object} The root node of the dREL method Parse Tree.
 * @param jsdict {Meta_Dict} A handle to the dictionary from where the method came.
 * @param globals {Library} A handle to a library of assumed externally supplied 
 * functions with associated argument Types and resultType Matrices.
 * @param klass {String} The DDLm associated parameter _method.class
 * @return {String} JavaScript function string, suitable for compiling and executing
 * within a dREL execution {Context} environment. 
 */
dREL_handler.prototype.compile = function(name, ast, jsdict, globals, klass ) {
  if (typeof(klass) ==='undefined') klass = 'evaluation';
  this._name = name;
  this._ast = ast;
  this._dict = jsdict;
  this._globals = globals;
  this._locals = [];
  this._methodClass = klass;
  var out = this._process(ast);
  return out;
};

/**
 * As for compile(), but return a (JS source, DDLm dependency hash) tuple.
 * While walking the CST, a list of dictionary data items on which the dREL method 
 * depends is assembled. This method returns the compiled code as well as 
 * the dependency list in a hash tree form.
 * @memberof dREL_handler.prototype
 * @param name	{string} DDLm _definition.id for the method being processed. 
 * @param ast	{Object} The root node of the dREL method Parse Tree.
 * @param jsdict {Meta_Dict} A handle to the dictionary from where the method came.
 * @param globals {Library} A handle to a library of assumed externally supplied 
 * functions with associated argument Types and resultType Matrices.
 * @param klass {String} The DDLm associated parameter _method.class
 * @return {Array} A 2 element JavaScript Array, containing the transformed function 
 * string, suitable for compiling and executing
 * within a dREL execution {Context} environment and hashtable Object containing the
 * dependencies.
 * @return  {Array}
 */
dREL_handler.prototype.compileDependencies = function(name, ast, jsdict, globals, klass ) {
  var jCode = this.compile(name,ast,jsdict,globals,klass);
  return [jCode, this._dependencies];
};

/**
 * Accumulate a dependency list as NAMEs are encountered while walking the
 * Parse Tree.
 * @memberof dREL_handler.prototype
 * @param klass
 * @param name
 * @return null
 */
dREL_handler.prototype.addDependency = function(klass, name ) {
  var dclass = this._dependencies[klass];
  if (! dclass ) {
    alert(" Unexpected dependency class " + klass + " for " + name);
    return;
  }
  if (! (name in dclass)) {
    dclass[name] = 1;
  } else {
    dclass[name] += 1;
  }
};

/**
 * Retrieve the returnType of a Library function.
 * @memberof dREL_handler.prototype
 * @param name {String} 
 * @return {Type}
 */
dREL_handler.prototype._getGlobalType = function(name) {
  if (!( name in this._globals) ) return null;
  if (! (this._globals[name] instanceof Function) ) {
    return {'class':'Global', 'type':'Constant', 'cont':'Scalar', 'base':'Float'};

  } 
  var type = {'class':'Global', 'type':'Function' };
  var ret = this._globals[name].returnType;
  if (ret) {
    type['returnType'] = ret; 
  } 
  var args = this._globals[name].args;
  if (args) {
    type['args'] = args; 
  } 
  return type;
};

/**
 * Does the NAME exist as a function in the Library?
 * @memberof dREL_handler.prototype
 * @param name
 * @return Boolean
 */
dREL_handler.prototype._hasGlobal = function(name) {
  if (name in this._globals) {
    return true;
  }
  return false;
};

/**
 * Maintain local variable scope via a stack
 * @memberof dREL_handler.prototype
 * @return null
 */
dREL_handler.prototype._pushLocalStack = function() {
  var innerScope = {};
  var last = this._locals.length-1;
  var outerScope = this._locals[last];
  for (var key in outerScope) {
    innerScope[key] = outerScope[key];
  }
  this._locals.push(innerScope);
};

/**
 * Maintain local variable scope via a stack
 * @memberof dREL_handler.prototype
 * @return null
 */
dREL_handler.prototype._popLocalStack = function() {
  this._locals.pop();
};

/**
 * Push a new local variable name into active scope
 * @memberof dREL_handler.prototype
 * @param name {String} variable name.
 * @param type {Type} current data type of variable. 
 * @return {Type}
 */
dREL_handler.prototype._pushLocalVar = function(name, type) {
  var last = this._locals.length-1;
  var outerScope = this._locals[last];
  var dupe = this._copyTypeDict(type);
  if (dupe['class'] =='Category') {
    dupe['type'] = 'CatRef';
  } else if (dupe['class'] == 'Item') {
    dupe['type'] = 'ItemRef';
  }
  dupe['class'] = 'Local';

  outerScope[name] = dupe; 
  this.info("push local : " + name + " : "  +  this._dmp(dupe));
  return dupe;
};

/**
 * @memberof dREL_handler.prototype
 * @param name {String} New variable name
 * @param node {Node} CST/AST node annotated with type information.
 * @return {Type}
 */
dREL_handler.prototype._pushLocalVarFromNode = function(name, node) {
  return this._pushLocalVar(name,node[1].type);
};

/**
 * Does variable name exist in local scope?
 * @memberof dREL_handler.prototype
 * @param name {String}  
 * @return {Type} or false
 */
dREL_handler.prototype._localsHasName = function(name) {
  var last = this._locals.length-1;
  var outerScope = this._locals[last];
  if (name in outerScope) { return outerScope[name];} 
  return false;
};

/**
 * Propagate Type information from one node to another.
 * @memberof dREL_handler.prototype
 * @param to {Node} 
 * @param from {Node}
 * @return {Type}
 */
dREL_handler.prototype._copyType = function(to, from) {
  var to_type = this._copyTypeDict(from[1].type);
  to[1].type = to_type;
  return to_type;
};

/**
 * @memberof dREL_handler.prototype
 * @param src {Type} to be copied.
 * @return {Type}
 */
dREL_handler.prototype._copyTypeDict = function(src) {
  if (typeof src === "string") 
     throw new Error("Copying string when dict expected");
  var to_type = {};
  for (var key in src) { 
    to_type[key] = src[key];
  }
//  if (to_type['class'] == 'Local') {
//    if (this._localsHasName(name) {
//  }
  return to_type;
};

/**
 * @memberof dREL_handler.prototype
 * @param local {Type}
 * @return {Type}
 */
dREL_handler.prototype._copyLocalType = function(local) {
  // assumes 'Local' is a ref to dict object from _locals 
  var type =  this._copyTypeDict(local);
  return type;
};



/**
 * Process CST
 * @memberof dREL_handler.prototype
 * @param nodelist
 * @return {String} transformed code
 */
dREL_handler.prototype._process = function(nodelist) {
  var out = this._node(nodelist);
  return out;
};

/**
 * Walk a list of nodes (only used by WHILE_EXPR).
 * @memberof dREL_handler.prototype
 * @param nodelist 
 * @return {String} transformed code
 */
dREL_handler.prototype._walk = function(nodelist) {
  if (nodelist[1].term) return this._node(nodelist);
  var out = [];
  for (var i = 0; i < nodelist.length; i++) {
    var node = nodelist[i];
    out.push(this._node(node));
  }
  return out.join("");
};

/**
 * Handle a dREL {Node}. Basically one large "switch:case" expression
 * to handle every node type.
 * @memberof dREL_handler.prototype
 * @param node {Node}
 * @param hand {String} "LHS", "RHS" or undefined
 * @return {String} the transformed Node.
 */
dREL_handler.prototype._node = function(node, hand) {
  var out = [];
  var types = this._types;
    var type = node[0];
    var t = types[type];
    this.info(type + " " + this._dmp(t));

    switch (t) {

      case types.ARGLIST:
        var j=1;
        for (var i = 2; i< node.length; i++) {
          j++;
          if (i>2) out.push(',');
          if (this._systemFunction)  {
            var args = this._systemFuncs[this._systemFunction]; 
            var argu = args[j-2];
            if (argu == 'SubsItemRef') {
              var part = this._name.split('.',2);
              if (part[0][0]== '_') part[0] = part[0].substring(1);
              out.push("Ctxt.getCategory('"+part[0]+"').getItem('"+part[1]+"')");
              if (i <node.length) out.push(','); 
              j++;
            }
            if (argu == 'SubsCtxtRef') {
              out.push("Ctxt");
              if (i <node.length) out.push(','); 
              j++;
            }
            if (argu == 'ItemRef') {
              out.push(this._node(node[i],'LEFT')); // we need Object ref
            } else if ( argu == 'CatRef') { 
              out.push("Ctxt.getCategory('");
              out.push(this._node(node[i],'LEFT')); // we need Object ref
              out.push("')");
            } else { 
              out.push(this._node(node[i])); // we need Object value
            }
          } else {
            out.push(this._node(node[i])); // we need Object value
          }
        }
        break;
      case types.ASSIGN:
        var asop = node[2];
        if (asop == '=' || asop == '<-') asop = "=";
        else if (asop == '+=' || asop == '+<-') asop = "+=";
        out.push(asop);
        break;
      case types.ASSIGN_EXPR:
        if (node[2][0] == 'LIST_EXPR') {
          var source = this._node(node[4],'RIGHT'); // process
          //convert python list assignment to javascript
          // allegedly list 'destructured assignment' works in mozilla js-1.7
          // but not in general
          var tv = "__QQtmp";  // temp variable
          out.push("var "+tv+"=");
          out.push(source);
          out.push(";\n");
          this._pushLocalVarFromNode(tv,node[4]);// node[4][1]._type ??
    this.info(this._dmp(node[4][1].type));
          for (var k=2;k<node[2].length;k++) {
            var tk = this._node(node[2][k]);
            out.push('var '+tk+ ' = '+tv+ '['+(k-2)+'];\n'); 
            var type_info = {'class':'Local','type':'var'};
            if (node[4][1].type.base) {
              var base = node[4][1].type.base;
    this.info(source);
    this.info(this._dmp(base));
              if (typeof base === 'string') {
                type_info.base = base;
                type_info.cont = 'Scalar';
              } else { // assume base is an array ???
                var basis = base[k-2]; 
                if (basis.cont) {   // element is a dict
                   type_info = basis;
                } else {  // else just a string type defn
                  type_info.base = basis; 
                }
              }
            } else {
              this.warn("No base type info for local var " +  tk);
            }
            this._pushLocalVar(tk,type_info);
          }
          break;
        }
        // otherwise - not a list assignment ...
        var source = this._node(node[4],'RIGHT'); // process
        var target = this._node(node[2],'LEFT'); // process
        //this.info(node[2]);
        this.info(target  + node[3][2] + source);
        var declared = false;
        var local = false;
        if (node[2][1].type.type == 'Name') {
          var name = node[2][2];
          local = this._localsHasName(name);
          if (! local) {
            out.push("var ");
            this._pushLocalVarFromNode(name,node[4]); 
            declared = true;
          }
        } else if (node[2][0] == 'NAME') {
          var name = node[2][2];
          local = this._localsHasName(name);
        }

        var to =  node[2][1].type.class;
        if (to == 'Item') {
          this.info(this._compileMode);
          this.info(this._name);
          if (this._compileMode == 'FUNCTION' && target.toLowerCase() == this._name.toLowerCase()) {
            out.push("return " + source);
          } else {
            out.push("return " + source);
/*
 * this was replaced by the above in order to make validation methods work. 
 //            out.push(target);
 //            out.push('.setVal('+source+')');
 */
          }
        } else if (to == 'Category') {
          out.push('Ctxt.setCategory('+target+', '+source+')');
        } else if (to == 'DDLCategory') {
          out.push(target);
          out.push('.setValue('+source+')');
        } else {
          if (node[3][2] == 'APPEND') {
            out.push(target);
            out.push('.push(');
            out.push(source);
            out.push(')');
            this.info("==================");
            this.info(this._dmp(node[2][1].type));
            this.info(this._dmp(node[4][1].type));
              // only if base not already defined
            if ( local  &&  ! ('base' in local)) {
              // in principle any mixture of things can be pushed into a list
              // the ASSUMPTION here is that you would only use a single type
              // update local variable record
              var tipe = node[4][1].type;
              if (tipe['cont'] == 'Scalar') {
                local.base = tipe['base'];
              } else {
                local.base = [{'cont': tipe['cont'], 'base': tipe['base'], 'dim':tipe['dim']} ];
              }
            }
            this.info("=======local?========" + name);
            this.info(source);
            this.info(this._dmp(this._localsHasName(name)));
            if ( !('base' in node[2][1].type)) {
              node[2][1].type.base = node[4][1].type.base;  // copy
            }
            this.info(this._dmp(node[4][1].type));
          } else if (node[3][2] == 'ENTRYREWRITE') {
            if (target in  this._localForLists) {
              var reflist = this._localForLists[target];
              out.push(target);
              var iii = reflist.length -1;
              out.push("[" + reflist[iii] + "] = ");
              out.push(source);
            } else {
              this.info(this._dmp(node));
              throw new Error(" Unhandled list entry replacement");
            }

            this.info("==================");
            this.info(this._dmp(node[2][1].type));
            this.info(this._dmp(node[4][1].type));
              // only if base not already defined
            if ( local  &&  ! ('base' in local)) {
              // update local variable record
              local.base = node[4][1].type.base;  
            }
            this.info("=======local?========" + name);
            this.info(source);
            this.info(this._dmp(this._localsHasName(name)));
            if ( !('base' in node[2][1].type)) {
              node[2][1].type.base = node[4][1].type.base;  // copy
            }
            this.info(this._dmp(node[4][1].type));
          } else {
            var op = this._node(node[3]); 
            if (op == "+=" && node[2][1].type.base == 'Complex') {
              out.push(target);
              out.push(' = ');
              out.push(target);
              out.push('.add(');
              out.push(source);
              out.push(')');
            } else {
              out.push(target);
              out.push(op);
              out.push(source);
            }
          }
        }
        if (declared){
           out.push(';\n//');
           var x = node[4][1].type;
           for (var k in x) {
             out.push(k+":"+x[k]+', ');
           }
        }
        break;
      case types.BACKTICK_EXPR:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'String'};
        var string_args = this._node(node[2]); 
        out.push("''+");
        out.push(string_args);
        break;
      case types.BREAK_EXPR:
        out.push('break;');
        break;
      case types.COMPLEX_FLOAT:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Complex'};
        out.push('new Complex(');
        out.push(node[2]);
        out.push(')');
        break;
      case types.COMPLEX_INT:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Complex'};
        out.push('new Complex(');
        out.push(node[2]);
        out.push(')');
        break;
      case types.COMP_EXPR:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Bool'};
        var first = this._node(node[2]); 
        var secnd = this._node(node[4]); 
        var type1 = node[2][1].type;
        var type2 = node[4][1].type;
        this.info("---------compare");
        this.info(this._dmp(type1));
        this.info(this._dmp(type2));
        var comp  = node[3]; 
        var base1 = type1['base'];
        var base2 = type2['base'];
        if (comp == 'NOTIN' || comp == 'IN' ) {
          //alert( base1 + " : " + comp + " : " + base2); 
          if (base1 == 'String' || base1 == 'Uchar' || base1 == 'Char' ||
              base2 == 'String' || base2 == 'Uchar' || base2 == 'Char' ) {
           if (comp == 'NOTIN') 
             out.push("(" +secnd + ".indexOf(" + first + ") == -1)" );
           else 
             out.push("(" +secnd + ".indexOf(" + first + ") >= 0)" );
          } else {
           if (comp == 'NOTIN') { 
            out.push(" Library.ElemNotInList(" + first+", " + secnd+ ") ");
           } else {
            out.push(" Library.ElemInList(" + first+", " + secnd+ ") ");
           }
          }
              
          
        } else {
          // maybe we need to do something more elaborate ...
          if (base1 == 'Uchar' || base2 == 'Uchar' ) {
            out.push(first);
            out.push(".toLowerCase()");
            out.push(" " + comp+ " ");
            out.push(secnd);
            out.push(".toLowerCase()");
          } else {
            out.push("(");
            out.push(first);
            out.push(" " + comp+ " ");
            out.push(secnd);
            out.push(")");
          }
        }
        break;
      case types.COMP_FOR_TEST_ARG:
        break;
      case types.DEL_EXPR:
        out.push('delete ');
        out.push(this._node(node[2]));
        out.push(';\n');
        break;
      case types.DOTNAME:
        // only occurence is when creating a category row of cat items
        // this._name should be the category
        // Ummm. No.  I got data:   _atom_type[a.type_symbol].radius_bond ...
        node[1].type = {'class':'Item', 'type':'ItemRef', 'base':node[2] } ; 
        out.push(node[2]);
        break;
      case types.DOT_ID_EXPR:
        out.push(this._node(node[2]));
        node[1].type = node[2][1].type; // make reference
        break;
      case types.DO_EXPR:

        var counter = this._node(node[2]);
        var start = this._node(node[3]);
        var stop = this._node(node[4]);
        var step = 1;
        if (node.length == 7) {
          step = this._node(node[5]);
        }

        out.push('for (var '+counter + '=' + start+';'+counter+'<='+stop+';' +
                   counter +' = ' + counter + ' + ' +step +'){\n');
        this._pushLocalVar(counter,node[3][1].type);
        this._pushLocalStack();
        if (node.length == 7) {
          out.push(this._node(node[6]));  // statements or ?
        } else {
          out.push(this._node(node[5]));  // statements or ?
        }
        this._popLocalStack();
        out.push('}');  
        break;
      case types.ELLIPSIS:
        break;
      case types.ELSE_EXPR:
        out.push('else {');
        // this._pushLocalStack();
        out.push(this._node(node[2]));
        // this._popLocalStack();
        out.push('}');
        break;
      case types.ELSIF_EXPR:
        out.push('else if (');
        out.push(this._node(node[2]));
        out.push(') {');
        // this._pushLocalStack();
        out.push(this._node(node[3]));
        // this._popLocalStack();
        out.push('}');
        break;
      case types.EXPRLIST:
        for (var i =2; i<node.length;i++) {
          if(i>2) out.push(', ');
          out.push(this._node(node[i]));
        }
        break;
      case types.FALSE:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Bool'};
        out.push('false');
        break;
      case types.FLOAT:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Float'};
        out.push(node[2]);
        break;
      case types.FOR_EXPR:
     
        //var target = this._node(node[2]);
        var source = this._node(node[3]);
            this.info(this._dmp(node[3][1].type));
        this._varCounter = this._varCounter + 1;
        if (node[2][0] == 'LIST_EXPR') {
          // list assignment 
          this._pushLocalStack();
          var c = '__QQi' +this._varCounter;
          var v = '__QQv' +this._varCounter;
          out.push('for (var '+c+'=0;'+c+'<'+source+'.length; '+c+'++) {\n');
          out.push('var '+v+'='+source+'['+c+'];\n');
          if ( source in this._localForLists) {
            this._localForLists[source].push(c);
          } else {
            this._localForLists[source] = [c];
          }

          var base = node[3][1].type.base;
//          this.info(this._dmp(node[3][1].type));
          //this.info(this._dmp(base));
          //this.info("list base typeof " + ( typeof base) + " length " + base.length);
          for (var m = 2; m < node[2].length; m++) {
            var tk = this._node(node[2][m]);
            out.push('var '+tk+ ' = '+v+ '['+(m-2)+'];\n'); 
            var type_info = {'class':'Local','type':'var', 'cont':'Scalar'};
            if (base) {
              if (typeof base === 'string') {
                type_info.base = base;
              } else {
                this.info("QQQQQ base" + this._dmp(base));
                var base_elem;
                if ("base" in base[0]) {
                  base_elem = base[0].base[m-2]; //
                } else if ("args" in base[0]) {
                  base_elem = base[0].args[m-2]; // not sure where this came from
                } 
                //this.info("base typeof " + ( typeof base_elem));
                if (typeof base_elem  === 'string') {
                  type_info.base = base_elem;
                } else {
                  type_info = this._copyTypeDict( base_elem); 
                  type_info.class = 'Local';
                  type_info.type = 'var';
                }
              }
            } else {
              this.warn("No base type info for local var " +  tk);
            }
            // for debugging purposes push out the data typing info
            out.push('//');
            for (var l in type_info) {
              out.push(l+":"+this._dmp(type_info[l])+', ');
            }
            out.push('\n');
            this._pushLocalVar(tk,type_info);
          }
          out.push(this._node(node[4]));
          this._popLocalStack();
          this._localForLists[source].pop();
          if (this._localForLists[source].length == 0) {
            delete this._localForLists[source];
          } 
          out.push('}');

        } else if (node[2][0] == 'NAME') {
          this._pushLocalStack();
          var c = '__QQi' +this._varCounter;
//          var v = '__QQv' +this._varCounter;
          out.push('for (var '+c+'=0;'+c+'<'+source+'.length; '+c+'++) {\n');
//          out.push('var '+v+'='+source+'['+c+'];\n');
          if ( source in this._localForLists) {
            this._localForLists[source].push(c);
          } else {
            this._localForLists[source] = [c];
          }

//          for (var k = 2; k < node[2].length; k++) {
            //var tk = this._node(node[2][2]);
            var tk = this._node(node[2]);
            out.push('var '+tk+ ' = '+source+'['+c+'];\n');
            var type_info = {'class':'Local','type':'var', 'cont':'Scalar'};
            if (node[3][1].type.base) {
              var base = node[3][1].type.base;
//            this.info(this._dmp(base));
//            this.info("base typeof " + ( typeof base));
              type_info.base = base;
            } else {
              this.warn("No base type info for local var " +  tk);
            }
            this._pushLocalVar(tk,type_info);
//          }
          out.push(this._node(node[4]));
          this._popLocalStack();
          this._localForLists[source].pop();
          if (this._localForLists[source].length == 0) {
            delete this._localForLists[source];
          } 
          out.push('}');

        } else {
          this.error(this._dmp(node));
          throw new Error(" Unexpected FOR_EXPR list assignment");
        }
        break;
      case types.FUNCTION_CALL:
        var func = this._node(node[2]); // process name
        node[1].type = node[2][1].type; // point to func return type
        var functionClass = node[2][1].type['class'];
        var ftyp = node[2][1].type['type'];
          this.info(this._dmp(node[2][1].type));
        if (functionClass == 'Category' || 
           (functionClass== 'Local' && ftyp == 'CatFunc') ) {
          // Its a Category assignment!
          if (node[2][1].type['type'] == 'CatFunc') {
            out.push(func + "(");
            var alist = node[3][2];
            for (var k = 2; k< alist.length; k++) {
              if (k>2) out.push(",");
              var arg_k =this._node(alist[k]); 
              if (alist[k][1].type.type == 'CatRef') {
                // a simple unadorned catref in a Dict function call must be quoted
                // the alternative was to just pass a Ctx.getCat
                out.push("'");
                out.push(arg_k);
                out.push("'");
              } else { 
                out.push(arg_k);
              }
            }
            out.push(")");
          } else {
            out.push("Ctxt.getCategory('" +func + "').addRow({\n");
            var alist = node[3][2];
            for (var k = 2; k< alist.length; k++) {
              if (alist[k][0] != 'ASSIGN_EXPR') {
                throw new Error("Non assignment argument in Category row creator for " + func);
              }
              var key  = this._node(alist[k][2]);
              var value = this._node(alist[k][4]);
              if (k>2) out.push(",\n");
              out.push("'"+key+"':" + value );
            }
            out.push("})");
          }
          break;
        } else if (functionClass == 'Item' ||
           (functionClass== 'Local' && ftyp == 'ItemFunc') ) {
          if (node[2][1].type['type'] == 'func') {
            out.push("Ctxt.getFunction('" +func + "').apply(");
            this.addDependency('funcs',func);
          } else if (node[2][1].type['type'] == 'ItemRef') {
            out.push(func + "(");
          } else {
            alert(" Uh oh " + func);
          }
          var alist = node[3][2];
          for (var k = 2; k< alist.length; k++) {
            if (k>2) out.push(",");
            var arg_k =this._node(alist[k]); 
            if (alist[k][1].type.type == 'CatRef') {
              // a simple unadorned catref in a Dict function call must be quoted
              // the alternative was to just pass a Ctx.getCat
              out.push("'");
              out.push(arg_k);
              out.push("'");
            } else { 
              out.push(arg_k);
            }
          }
          out.push(")");
          break;
        }
        // otherwise, its just a function call
        // but maybe it is a special system function???
        if (functionClass == 'system') {
          // set class variable for ARGLIST processing.
          this._systemFunction = node[2][1].type.base; // func name 
//          alert(this._systemFunction);
        }
        var args = this._node(node[3]); // process argument list
        if (functionClass == 'system') {
          // unset class variable
          this._systemFunction = null;
        }
        var argtypes = [];
        var alist = node[3][2]; 
        if (alist[0] == 'ARGLIST') {
          for (var k = 2; k< alist.length; k++) {
            argtypes.push(alist[k][1].type);
            
          }
        }
        this.info(this._dmp(argtypes));

        this.info(this._dmp(func));
        this.info(this._dmp(node[2][2]));
        
        if (func == 'Matrix') {
          // special case - convert Matrix Call to Vector
          if (argtypes.length == 1 && argtypes[0]["cont"] == "Vector") {
            func = 'Vector';
          }
        }

        var res;
        if (this._methodClass == 'evaluation' || this._methodClass == 'validation') {
          //res = this._globals.getFuncRetType(node[2][2],node[2][1].type,argtypes);
          if (functionClass == 'system') {
            res = ['Ctxt.builtin.'+func, {'class':'Evaluation','type':'func'} ];
          } else {
            res = this._globals.getFuncRetType(func,node[2][1].type,argtypes);
          }
        } else {
           // just a hack
           res = ['Ctxt.builtin.'+func, {'class':'Definition','type':'func'} ];
        }
        var target = res[0] + "." + func;
        if (res[0].indexOf('.') >0) target = res[0] ; // renamed
         
        node[1].type = res[1]; // return type, given the args
        this.info('return: ' + func);
        this.info(this._dmp(res));
        out.push(target);
        out.push('(');
        out.push(args);
        out.push(')');
         
        //this.info(node[2]);
        //if (node[2][1].type.type == 'Global') {
        //  target = "globals." + target;
        //}
        // rationalize result
        //node[1].type = {'type':'?', 'cont':'?'};
        break;
      case types.FUNCTION_EXPR:
        out.push('{');
        out.push(this._node(node[3])); //get args from javascript arguments array
        out.push(this._node(node[4]));
        out.push('}');
        break;
      case types.FUNC_ARGLIST:
        for (var i =2; i<node.length; i++) {
          var vname = this._node(node[i]);
          out.push('var ' );
          out.push(vname);
          out.push(' = arguments[2][' + (i-2) + '];' );// args 0, 1 are context and lib
//          out.push('alert(' + vname +');' );// args 0, 1 are context and lib
        }
        break;
      case types.FUNC_ARG:
        var varname = node[2];
        var container = node[3][2][2];
        var base = node[3][3][2];
        // the crap we gotta do !!!!! Obviously this is not true in general!
        if (container == 'Matrix') container = 'Vector'; //!!!!!!!!!!! 
        node[1].type={'class':'Local','type':'var','cont':container, 'base':base};
        this._pushLocalVar(varname, node[1].type);
        out.push(varname);
        break;
      case types.HEX:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Int'};
        out.push(parseInt(node[2],16));
        break;
      case types.IF_EXPR:
        out.push('if (');
        out.push(this._node(node[2]));
        out.push(') {\n');
        // this._pushLocalStack();
        out.push(this._node(node[3]));
        // this._popLocalStack();
        out.push('}');
        // handle else ifs and elses.
        for (var k = 4; k< node.length; k++) {
          out.push(this._node(node[k]));
        }
        break;
      case types.INLINE_IF_EXPR:
        out.push('if (');     // ) (
        out.push(this._node(node[2]));
        out.push(') {');       // 
        // this._pushLocalStack();
        out.push(this._node(node[3]));
        // this._popLocalStack();
        out.push('} else {');
        // this._pushLocalStack();
        out.push(this._node(node[4]));
        // this._popLocalStack();
        out.push('}');
        break;
      case types.INT:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Int'};
        out.push(node[2]);
        break;
      case types.LIST_EXPR:
        if (hand!='LEFT') {
          // list construction, not list assignment
          node[1].type = {'cont': 'List' }; 
          out.push('[');  
          var nl = node.length;
          var basis = [];
          
          for (var k = 2; k< nl; k++) {
            if (k>2) out.push(',');
            out.push(this._node(node[k]));
            if (node[k][1].type.cont == 'Scalar') {
              basis.push(node[k][1].type.base);
            } else {
              basis.push(node[k][1].type);
            }
          }
          out.push(']');
          this.info('List basis: ' + this._dmp(basis));
          base = 'Int'; // assume
          for (var k = 0; k<basis.length; k++) {
            var basek =  basis[k]; 
            if (! (basek in this.numericTypes)) { 
              // probably a mixed Tuple 
              base = basis; // go out with whole list. hope for best!
              break;
            }
            base = this._coerceBase(base,basek); 
          }
          node[1].type.base = base;
          node[1].type.dim = [nl-2];
          if (base in this.numericTypes) {
            node[1].type.cont = 'Vector';
          }
        } else {

        this.warn("----------------------");
        this.warn("----------UH OH-----------");
        this.warn("---------MISSING LEFT LIST ASSIGN-----------");
        }
        break;
      case types.LONG:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Long'};
        out.push(node[2]);
        break;
      case types.LOOP_COND_EXPR:
        this.info(this._dmp(node));
        var counter = this._node(node[2]);
        node[2][1].type = {'class':'Local', 'cont':'Scalar', 'base':'Int'}; 
        out.push(counter);
        if (node.length > 3) {  // just a declaration
          var comp = node[3];
          var compand = this._node(node[4]);
        }

        break;
      case types.LOOP_EXPR:
        this._varCounter +=1;
        var counter;
        var comp;
        var compand;
        if (node.length == 6) {
          out.push("var "); 
          counter = this._node(node[5]);
          out.push(counter);
          out.push("=-1;\n");// just the declration 
          if (node[5].length>3) {
            comp = node[5][3];
            compand = this._node(node[5][4]);
          }
        }
        var iter = this._node(node[2]);
        var cat = this._node(node[3]);
        var list = "__QQcat" + this._varCounter + "_" + cat; 
        var incr = "__QQ"+iter+"_";
        out.push("var " + list + "=Ctxt.getCategoryAsList('" + cat + "');\n"); 
//        out.push("alert('" + cat + "'+ 'cat length ' + " + list +".length);\n"); 
        this.addDependency('cats',cat);
        out.push("try{\n"); 
        out.push('for (var '+incr + '=0;'+incr+'<'+list+'.length;'+incr+'++){\n');
        out.push("var " + iter + "="+list+".getByIndex("+incr+");\n");
        this._pushLocalStack();
        if (counter) {
          out.push(counter); 
          out.push(" +=1;\n"); // increment the counter
          this._pushLocalVar(counter,node[5][2][1].type);
          if (comp) {
            out.push("if (!(" +counter +  comp + compand+ ")) continue;\n"); 
          }
        }
        var attribs = {'class':'Category', 'cont':'Map', 'base':cat};
        this._pushLocalVar(iter,attribs);
        out.push('//');
        for (var k in attribs) {
           out.push(k+":"+attribs[k]+', ');
        }
        out.push('\n');
        out.push(this._node(node[4]));  // statements or ?
        this._popLocalStack();
        out.push('}');  
        out.push("} catch (e) {\n"); 
        out.push("Ctxt.error(e);\n"); 
        out.push(" alert (e);\n"); 
        out.push("} finally {\n"); 
        out.push(list + ".popLoopStack();\n"); 
        out.push('}');  
        break;
      case types.MATHOP_EXPR:
        out.push(this._handleMathOp(node));
        break;
      case types.METHOD_CALL_ARG:
        out.push(this._node(node[2]));
        break;
      case types.NAME:
        var name = node[2];
        node[1].type = {'type':'Name'};
        var local;
        
        if (this._hasGlobal(name)) { // i.e. in the library
          node[1].type = this._getGlobalType(name);
          if (node.length>3) { 
            throw new Error("Error Indexing into Global function " + node);
          }
          // out.push("Global.");
          name = node.slice(2).join(".");
          if(node[1].type.type == 'Constant') {
            name = 'Library.' + name;
          }
        } else if (this._dict.hasFunction(name)) {  // func defined in dict
          this.info("--- DICTIONARY DEFINED FUNCTION --- " + name);
          var item = this._dict.getFunction(name);
          var type_info = this._resolveDictItemType(item);
          type_info['type'] = 'func';
          node[1].type = type_info;
          this.addDependency('funcs',name);
          // this.info(type_info);
        } else if (this._methodClass == 'definition' && 
                 name in this._systemFuncs ) {  //builtin func
          node[1].type = {'class':'system','type':'func', 'base': name };
        } else if ( name in this._systemFuncs ) {  // builtin func?
          this.warn("--- INVOKED SYSTEM FUNC FOR NON DEFN METHOD--- " + name);
          
          node[1].type = {'class':'system','type':'func', 'base': name };
           
        } else {
          local = this._localsHasName(name);
            this.info( "local ?" + name);
            this.info( this._dmp(local));
          if (local) {
            var type_info = this._copyLocalType(local); 
            node[1].type = type_info; // a copy ??? or a ref?
          } else if (this._methodClass != "evaluation"  && this._dict.ddl && 
                 this._dict.ddl.hasCategory(name)) {
            node[1].type = {'class':'DDLCategory', 'type':'CatRef', 'cont':'Map', 'base': name } ;
          } else if (this._methodClass != "evaluation"  && this._dict.ddl && 
                name[0]=='_' && this._dict.ddl.hasCategory(name.substring(1))) {
            node[1].type = {'class':'DDLCategory', 'type':'CatRef', 
                             'cont':'Map', 'base':name.substring(1)};
          } else if (this._dict.hasCategory(name) ) {
            node[1].type = {'class':'Category', 'type':'CatRef', 'cont':'Map', 'base': name } ;
            if (hand != 'LEFT') {
              this.addDependency('cats',name);
            }
          } else if (this._dict.hasCategory(name.toLowerCase()) ) {
            node[1].type = {'class':'Category', 'type':'CatRef', 'cont':'Map', 'base': name.toLowerCase() } ;
            name = name.toLowerCase();
            if (hand != 'LEFT') {
              this.addDependency('cats',name);
            }
          } else if (name[0]=='_' && this._dict.hasCategory(name.substring(1))) {
// THIS TEST IRKS ME NO-END!!!!!
            node[1].type = {'class':'Category', 'type':'CatRef', 
                             'cont':'Map', 'base':name.substring(1)};
            name = name.substring(1);
            if (hand != 'LEFT') {
              this.addDependency('cats',name);
            }
          } else if (name[0]=='_' && this._dict.hasCategory(name.substring(1).toLowerCase())) {
// but not as much as THIS one!!!!!
            node[1].type = {'class':'Category', 'type':'CatRef', 
                             'cont':'Map', 'base':name.substring(1).toLowerCase()};
            name = name.substring(1).toLowerCase();
            if (hand != 'LEFT') {
              this.addDependency('cats',name);
            }
          } else {
            // not recognised var name.
            // maybe we are declaring it right now!
            // this.warn("Not recognised name item " + node);
            node[1].type = {'type':'Name'};
          }
          this.info( " Node length " + node.length);
          if (node.length > 3) {  // formerly >3  
            var schema = this._dict;
            var tmp = name;
            var joined = null;
            var item;
            var attribute = node[3]; // the 'X' in something.X
            var k = 3;
            this.info(this._dmp(node[1].type));
            if (node[1].type.type == 'CatRef') {
              if (node[1].type['class'] == 'Category') {
                this.info("==== Its a cat ref");
              } else if (node[1].type['class'] == 'DDLCategory') {
                this.info("==== Its a DDL cat ref" + node[1].type['class'] );
                schema = this._dict.ddl;
              }
              var cat_name = node[1].type.base;
              var cat = schema.hasCategory(cat_name);
              if (! cat) {
                 if (cat_name[0] == '_') cat_name = cat_name.substring(1);
                 cat = schema.hasCategory(cat_name);
              }
              if (! cat) {
                 cat_name = cat_name.toLowerCase();
                 cat = schema.hasCategory(cat_name);
              }
              if (! cat) {
                alert ("failed to identify category " + cat_name);
              }
              item = cat.getItemByAttributeId(attribute);
              if (! item) {
                var joinSet = schema.getJoinedCats(cat_name);
                for (var catid in joinSet) {
                  item = joinSet[catid].getItemByAttributeId(attribute);
                  if (item) {
                    joined = catid;
                    break;
                  }
                }
              }
              //out.push(name);
              if (local) {
                out.push(node[2]);
              } else {
                if (node[1].type['class'] == 'Category') {
                  out.push("Ctxt.getCategory('");
                  out.push(node[1].type.base);
                  out.push("')");
                } else {
                    // no putput for a ddl ref
//                  out.push("Ctxt.getCategory('");
//                  out.push(node[1].type.base);
//                  out.push("')");
                }
              }
            } else {
              tmp = tmp + "." + attribute;            
              item = this._dict.hasItem(tmp);
              if (item) {
                // this a direct reference to an item
                attribute = tmp;
                if (hand != 'LEFT') {
                  this.addDependency('items', attribute);
                }
                out.push("Ctxt");
              } else {
                out.push(name);
              }
            }
            
            if (item) {
              if (hand != 'LEFT') {
                this.addDependency('items', item._name);
              }
              if (node[1].type['class'] == 'DDLCategory') {
                k = 4; // fudge to avoid subsequent
                  // for a definition method ...
                  out.push("Ctxt.getDefn('");
                  out.push(this._name);
                  out.push("').getAttributeRef('" );
                  out.push(name);
                  out.push(".");
                  out.push(attribute);
                  out.push("')");
              } else {   // CatRef?, but Class = Category or Local
                out.push(".");
                var type_info = this._resolveDictItemType(item);
                node[1].type = type_info;
                k = 4;
                //if (hand == 'LEFT') { } 
                if (joined) {    
                  out.push("getJoinSetItem('"+joined+ "','" + attribute +"')");
                } else {
                  out.push("getItem('" + attribute +"')");
                }
                if (hand != 'LEFT') {
            this.info(this._dmp(node));
            this.info(this._dmp(item._name));
                  if (node.length ==4) { // only if not otherwise specified.  
                    out.push(".__getVal()");
                  } else {
                    node[1].type['type'] = 'ItemRef';
                  }
                }
              }
            } else if (node[1].type.type == 'CatRef') {
              // not an item but a property of the cat
              node[1].type['type'] = 'CatFunc';
            }
            for (k; k<node.length;k++) {
              // indexing into a local var
              this.info("Indexing into local-var/Item contents");  
              out.push(".");
              out.push(node[k]);
            }
            this.info(this._dmp(node));
            break;
          } // end of adorned name
          // else not global and not a function and unadorned
        } // end of not global
            
        this.info(this._dmp(node));
        out.push(name);
        break;
      case types.NEXT_EXPR:
        out.push('continue');
        break;
      case types.NONE:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'None'};
        out.push('null');
        break;
      case types.NOOP:
        break;
      case types.OBJ_PROP:
        var first = this._node(node[2]);
        var secnd = this._node(node[3]);

          this.info("XXXXXXXXXXXXXXXXXX");
          this.info(this._dmp(node[2][1].type));
          this.info(this._dmp(node[3][1].type));
        var srctype = node[2][1].type;
        var proptype = node[3][1].type;
        if (srctype.type == 'CatRef' &&
            node[3][0] == 'DOT_ID_EXPR') {
          // we are indexing into a category
          var cat = this._dict.hasCategory(srctype.base);
          var item_name = proptype.base;  // this is just short .extension 
          var item = cat.getItemByAttributeId(item_name);
          var joined = null;
          if (! item) {
            var joinSet = this._dict.getJoinedCats(node[1].type.base);
            for (var catid in joinSet) {
              item = joinSet[catid].getItemByAttributeId(attribute);
              if (item) {
                joined = catid;
                break;
              }
            }
          }
              //out.push(name);
          if (item) {
              var type_info = this._resolveDictItemType(item);
              node[1].type = type_info;
              if (joined) {    
                secnd = "getJoinSetItem('"+joined+ "','" + secnd +"')";
                this.addDependency('cats',joined);
                this.addDependency('items',joined+ "." +secnd);
              } else {
                secnd = "getItem('" + secnd + "')";
              }
              if (hand != 'LEFT') {
                secnd = secnd + ".__getVal()";
              }
          }
        } else {

        }
        //var secnd = node[4];
        out.push(first);
        out.push(".");
        out.push(secnd);
        break;
      case types.OCTAL:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Int'};
        out.push(parseInt(node[2],8));
        break;
      case types.PASS_EXPR:
        out.push(';\n');
        break;
      case types.PRINT_EXPR:
        out.push('alert(');
        if (node[2][0] =='EXPRLIST') {
          var args = node[2];
          for (var i=2; i < args.length;i++) {
            if (i>2) out.push("+' '+"); 
            if (typeof args[i] == 'string') {
              out.push(args[i]); 
            } else {
              out.push(this._node(args[i])); 
            }
          }
        } else {
          if (typeof node[2] == 'string') {
            out.push(node[2]); 
          } else {
            out.push(this._node(node[2])); 
          }
        }
        out.push(')');
        break;
      case types.PROCEDURE:
        if ((node[2][2] instanceof Array && node[2][2][0] == 'FUNCTION_EXPR' ) || 
            (node[2][3] instanceof Array && node[2][3][0] == 'FUNCTION_EXPR' ) ) {
          this._compileMode = 'FUNCTION';
          this._pushLocalStack();
          out.push(this._node(node[2])); // node[2][2] ???
          this._popLocalStack();
        } else {
          this._compileMode = 'PROCEDURE';
          out.push('{');
          this._pushLocalStack();
          out.push(this._node(node[2]));
          this._popLocalStack();
          out.push('}');
        }
        break;
      case types.RANGE_EXPR:
        node[1].type = {'type':'Range', 'cont':'Scalar', 'base':'Int'};
        if (node.length ==2 ) { 
          out.push('0,-1');
        } else if (node.length ==3 ) { 
          out.push(this._node(node[2]));
          out.push(',-1');
        } else if (node.length ==4 ) { 
          out.push(this._node(node[2]));
          out.push(',');
          out.push(this._node(node[3]));
        }
      
        break;
      case types.REPEAT_EXPR:
        out.push('while (true) {');
        this._pushLocalStack();
        out.push(this._node(node[2]));
        this._popLocalStack();
        out.push('}');
        break;
      case types.RETURN_EXPR:
        out.push('return ');
             
        out.push(';\n');
        break;
      case types.SLICEOP: // extension on a RANGE_EXPR
        break;
      case types.STAR_EXPR:
        break;
      case types.STATEMENTS:
        for (var i = 2; i< node.length; i++) {
          out.push(this._node(node[i]));
          out.push(';\n');
        }
        break;
      case types.STRING:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'String'};
        out.push('\'');
        out.push(node[2]);  // escape the sucker!           
        out.push('\'');
        break;
      case types.SUBSCRIPT:
        var source =this._node(node[2]); 
        var index =this._node(node[3]); 
        var info = this._copyTypeDict(node[2][1].type);//simply copy a CatRef?
        var subtype = node[3][1].type;
        node[1].type = info;
        if (info.class == 'Category') {
          this.addDependency('cats',source);
          this.addDependency('items',source + "." + key);
          source = "Ctxt.getCategoryAsTable('" + source + "')";
        }
        if (info.class == 'Category' && subtype.type == 'ListIndex') {
          info.type = 'CatRef'; // or CatRow?
        } else if (info.class == 'Category' ) {
          info.type = 'CatRef'; // or CatInstance ?

        } else if (subtype.type == 'ListIndex') {
          info.cont = '?';
          if (node[3][2][0] == 'INT') {
            var idx = parseInt(index); 
            //var base = subtype.base;
            var base = info.base;
             if (typeof base === 'string') {
                info.base = base;
             } else if (idx != 'NaN')  {
                if (base.length == 1) {
                  node[1].type = base[0];
//                  info.base = base[0];// pull out only entry from list 
                } else {
                  info.base = base[idx];// pull out specific entry from list 
                }
             } else {
               this.warn("No base type info for subscript " +  index + " of " +
                        source);
             }
          } else {
            this.warn("No base type " + node[3][2] + " info for subscript " +  index + " of " +
                        source);
          }
        } else if (subtype.type == 'ListRange') {
          out.push(source);
          var sbase  = node[2][1].type.base;
          if (sbase == 'String' || sbase == 'Uchar' || sbase == 'Char') { 
            out.push('.substring(');
            out.push(index);
            out.push(')');
          } else {
            out.push('.slice(');
            out.push(index);
            out.push(')');
          }
          break;
        } else if (info.cont == 'Table' && subtype.type == 'MapIndex' ) {
           if (typeof info.base == 'string') {
             info.cont = 'Scalar';
           } else {
             this.warn("Unresolved subscript container: " + this._dmp(info));
           }
        }
        // if node2 is a category and node3 is a ListIndex, we index by row
        //             otherwise we index by key
        // else if container is a Map we need the type
        // of the value
        // else we need the type of the List element
        out.push(source);
        if (info.type == 'CatRef') {
          this.addDependency('items',source);
          if (subtype.type == 'ListIndex') {
            out.push('.getByIndex');
          } else {
            out.push('.getByKey');
          }
          out.push('(');
          out.push(index);
          out.push(')');
        } else {
          out.push('[');
          out.push(index);
          out.push(']');
        }
        break;
      case types.SUBSCRIPT_EXPR:  // this indexes into a list or dict
        out.push(this._node(node[2]));
        // if it is an Int it could be a list index, otherwise its a map key   
        node[1].type = this._copyTypeDict(node[2][1].type); 
        var base = node[1].type.base;
        this.info("XXXXXXX basic subscript type " + this._dmp(base));
        if (base in this.numericTypes && this.numericTypes[base] == 1) {
          if (node[1].type.type == 'Range') {
            node[1].type.type = 'ListRange';
          } else {
            node[1].type.type = 'ListIndex';
          }
        } else { 
          node[1].type.type = 'MapIndex';
        }
        this.info(this._dmp(node[1].type));
        break;
      case types.SUBSCRIPTLIST:
        // convert list of indices to nested list indices
        node[1].type = {'cont': 'List' }; 
        var len =  node.length -1; // penultimate
        for (var i = 2; i< len; i++) {
          out.push(this._node(node[i]));
          out.push('][');
        }
        out.push(this._node(node[len]));
        break;
      case types.TESTLIST:
        node[1].type = {'cont': 'List' }; 
        out.push('[');  
        for (var i = 2; i< node.length; i++) {
          out.push(this._node(node[i]));
          out.push(',');
        }
        //out.push(this._walk(node[2]));
        out.push(']');
        break;
        break;
      case types.TRUE:
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Bool'};
        out.push('true');
        break;
      case types.WHILE_EXPR:
        out.push('while (');
        out.push(this._node(node[2]));
        out.push(') {');
        this._pushLocalStack();
        out.push(this._walk(node[3]));
        this._popLocalStack();
        out.push('}\n');
        break;
      case types.WITH_EXPR:
        out.push("var ");
        out.push(node[2]);
        var attribs = {'class':'Category', 'cont':'Map', 'base':node[3]};
        this._pushLocalVar(node[2],attribs);
        out.push(' = Ctxt.getCategory(\'');
        out.push(node[3]);
        out.push('\')');
        out.push(';\n//');
        for (var k in attribs) {
           out.push(k+":"+attribs[k]+', ');
        }
        this.addDependency('cats',node[3]);
        break;
      case types.YIELD_EXPR:
        break;
      default:
        throw new Error("Unhandled dREL grammar construct: " + type);

    }
  return out.join("");
};

/**
 * Compare two numeric argument types and return the least precise or
 * more redundant base.
 * @memberof dREL_handler.prototype
 * @param base1 {String}
 * @param base2 {String}
 * @return {String}
 */
dREL_handler.prototype._coerceBase = function(base1,base2) {
  if (! (base1 in this.numericTypes)) 
    this.warn("Unrecognised numeric base: " + this._dmp(base1));
  if (! (base2 in this.numericTypes)) 
    this.warn("Unrecognised numeric base: " + this._dmp(base2));
  if ( base1 && base2) ;
  else return null;
  if (this.numericTypes[base1] > this.numericTypes[base2]) 
    return base1;
  return base2;
};

/**
 * Specific function to handle binary and unary MATHOP_EXPR
 * @memberof dREL_handler.prototype
 * @param node {Node} MATHOP_EXPR
 * @return {String} Transformed JavaScript.
 */
dREL_handler.prototype._handleMathOp = function(node) {
  var out = [];
  var types = this._ops;
  var type = node[3];
  var t = types[type];
  this.info("math op " + this._dmp(type) + " " + this._dmp(t));
  
    
  switch(t) {
    case types.AND:
    case types.OR:
      this.info(this._dmp(node));
      node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Bool'};
      out.push(this._node(node[2]));
      out.push(this.bool[t]);
      out.push(this._node(node[4]));
      break;
    case types.NOT:
      out.push('!');
      node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':'Bool'};
      out.push(this._node(node[4]));
      break;


    case types.BITAND:
    case types.BITOR:
    case types.LSHIFT:
    case types.RSHIFT:
    case types.XOR:
      var first = this._node(node[2]);
      var secnd = this._node(node[4]);
      if (t == types.XOR && ((node[2][1].type.cont == 'Vector' &&
                              node[4][1].type.cont == 'Vector' ) ||
                             (node[2][1].type.cont == 'Array' &&
                              node[4][1].type.cont == 'Array' ) )) {
        out.push("Library.Wedge("+ first+","+secnd+")"); 
        this._copyType(node, node[2]);

      } else {
        var base = this._coerceBase(node[2][1].type.base, node[4][1].type.base);
        node[1].type = {'type':'Constant', 'cont':'Scalar', 'base':base};

        out.push(first);
        out.push(this.bits[t]);
        out.push(secnd);
      }
      break;

    case types.INVERT:
      var first = this._node(node[2]);
      this._copyType(node, node[2]);
      //first ^ parseInt((new Array(x.toString(2).length+1)).join("1"),2);
      out.push('~');
      out.push(first);
      break;

    case types.NEG:
    case types.POS:
      var first = this._node(node[4]);
      this._copyType(node, node[4]);
      var cont = node[4][1].type.cont;
      
      if (cont == 'Matrix' || cont =='Vector' || cont =='Array') {
        if (t == types.NEG) { 
          out.push("numeric.neg("+ first+")"); 
        } else {
          out.push(first);
        }
      }  
      else { 
        out.push(this.sign[t]);
        out.push(first);
      }  
      
      break;

    case types.DIV:
    case types.DIVDIV:  // enforced integer division, even for floats
    case types.MINUS:
    case types.MOD:
    case types.PLUS:
    case types.TIMES:
      var first = this._node(node[2]);
      this.info(this._dmp(node[3]));
      var secnd = this._node(node[4]);
      node[1].type = {'type':'?ZZ', 'cont':'Scalar'};

      var cont1 = node[2][1].type.cont;
      var cont2 = node[4][1].type.cont;
      this.info(node);
      this.info(node[2][1].type);
      this.info(node[4][1].type);
      var base = this._coerceBase(node[2][1].type.base, node[4][1].type.base);
      if (cont1 =='Array' || cont1 == 'List' ) {// added list. not sure its right
        // resort to dynamic run-time checking rather than compile-time
        if (cont2 == 'Array' || cont2 == 'Matrix' || cont2 == 'Vector' ) {
          if (t == types.TIMES) { 
            out.push("numeric.dot("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.PLUS){
            out.push("numeric.add("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.sub("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix operator " + node);
        } else if(cont2 == 'Scalar') {
          if (t == types.TIMES) { 
            out.push("numeric.mul("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.PLUS){
            out.push("numeric.add("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.sub("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.DIV){
            //out.push("numeric.divMS("+ first+","+secnd+")"); 
            out.push("numeric.div("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Array operator " + node);
        } else 
          throw new Error("Unhandled Array operator " + node);
      } else if (cont1 =='Matrix' ) {
        if (cont2 == 'Matrix') {
          if (t == types.TIMES) { 
            out.push("numeric.dotMMbig("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
            
          } else if  (t == types.PLUS){
            out.push("numeric.addMM("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.subMM("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix operator " + node);
        } else if(cont2 == 'Vector') {
          if (t == types.TIMES) { 
            out.push("numeric.dotMV("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          }else 
            throw new Error("Unhandled Matrix operator " + node);
        } else if(cont2 == 'Array') {
          if (t == types.TIMES) { 
            out.push("numeric.dot("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.PLUS){
            out.push("numeric.add("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.sub("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.DIV){
            //out.push("numeric.divMS("+ first+","+secnd+")"); 
            out.push("numeric.div("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix/Array operation " + node);

        } else if(cont2 == 'Scalar') {
          if (t == types.TIMES) { 
            out.push("numeric.mulMS("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.PLUS){
            out.push("numeric.addMS("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.subMS("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.DIV){
            //out.push("numeric.divMS("+ first+","+secnd+")"); 
            out.push("numeric.div("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix operator " + node);
        }
      } else if (cont1 == 'Vector') {
        if (cont2 == 'Matrix') {
          if (t == types.TIMES) { 
            out.push("numeric.dotVM("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix operator " + node);
        } else if(cont2 == 'Array') {
          if (t == types.TIMES) { 
            out.push("numeric.dot("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.PLUS){
            out.push("numeric.add("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.sub("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.DIV){
            //out.push("numeric.divMS("+ first+","+secnd+")"); 
            out.push("numeric.div("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix/Array operation " + node);
        } else if(cont2 == 'Vector') {
          if (t == types.TIMES) {
            out.push("numeric.dotVV("+ first+","+secnd+")"); 
            node[1].type = {'type':'?', 'cont':'Scalar'};
          }else if  (t == types.PLUS){
            out.push("numeric.addVV("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          }else if  (t == types.MINUS){
            out.push("numeric.subVV("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          }else 
            throw new Error("Unhandled Matrix operator " + node);
        } else if(cont2 == 'Scalar') {
          if (t == types.TIMES) {
            out.push("numeric.mulVS("+ first+","+secnd+")"); 
            node[1].type = {'type':'?', 'cont':'Scalar'};
          }else if  (t == types.PLUS){
            out.push("numeric.addVS("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          }else if  (t == types.MINUS){
            out.push("numeric.subVS("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          }else if  (t == types.DIV){
            out.push("numeric.divVS("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          }else 
            throw new Error("Unhandled Vector operator " + node);
        }
      } else if (cont1 == 'Scalar') {
        if (cont2 == 'Matrix') {
          if (t == types.TIMES) { 
            out.push("numeric.mul("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          } else if (t == types.PLUS) { 
            out.push("numeric.add("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          } else if (t == types.MINUS) { 
            out.push("numeric.sub("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          } else 
            throw new Error("Unhandled Matrix operator " + node);
        } else if(cont2 == 'Array') {
          if (t == types.TIMES) { 
            out.push("numeric.mul("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.PLUS){
            out.push("numeric.add("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.MINUS){
            out.push("numeric.sub("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else if  (t == types.DIV){
            //out.push("numeric.divMS("+ first+","+secnd+")"); 
            out.push("numeric.div("+ first+","+secnd+")"); 
            this._copyType(node, node[2]);
          } else 
            throw new Error("Unhandled Matrix/Array operation " + node);
        } else if (cont2 == 'Vector') {
          if (t == types.TIMES) { 
            out.push("numeric.mulSV("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          } else if (t == types.PLUS) { 
            out.push("numeric.addSV("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          } else if (t == types.MINUS) { 
            out.push("numeric.subSV("+ first+","+secnd+")"); 
            this._copyType(node, node[4]);
          } else 
            throw new Error("Unhandled Vector operator " + node);
        }
        else if (cont2 == 'Scalar') {
          var b1 = node[2][1].type.base;
          var b2 = node[4][1].type.base;
          this.info(" b1, b2 " + this._dmp(b1) + ":: " + this._dmp(b2));
          if (b1 == 'Complex') {
            out.push(first);
            if (t == types.TIMES) { 
              out.push(".mul(");
            } else if  (t == types.PLUS){
              out.push(".add(");
            } else if  (t == types.MINUS){
              out.push(".sub(");
            } else if  (t == types.DIV){
              out.push(".div(");
            }
            out.push(secnd + ")");
          } else if (b2 == 'Complex') {
            out.push("Library.Complex(");
            out.push(first);
            out.push(",0)");
            if (t == types.TIMES) { 
              out.push(".mul(");
            } else if  (t == types.PLUS){
              out.push(".add(");
            } else if  (t == types.MINUS){
              out.push(".sub(");
            } else if  (t == types.DIV){
              out.push(".div(");
            }
            out.push(secnd + ")");
          } else {
            out.push("(" +first);
            out.push(this.basic[t]);
            out.push(secnd + ")");
          } 
        } else 
          throw new Error("Unhandled Scalar operator " + node[3] + 
              " between " + cont1 + " and " + cont2 + " ::: " +node);
      } else {
        // dunno what cont1 is.
          out.push("("+first);
          out.push(this.basic[t]);
          out.push(secnd + ")");
      }
      // transfer type info
      node[1].type.base = base;

/*
      out.push('\n//');
      var attribs = node[2][1].type;
//      this.info("=======Math RES========");
//      this.info(node[1].type);
//      this.info(node[2]);
//      this.info(node[3]);
//      this.info(node[4]);
      for (var k in attribs) {
        out.push(k+":"+attribs[k]+', ');
      }
      out.push('\n//');
      var attribs = node[4][1].type;
      for (var k in attribs) {
        out.push(k+":"+attribs[k]+', ');
      }
      out.push('\n');
 */
      break;

    case types.POW:
      node[1].type = {'cont':'Scalar', 'base':'Float'};
      out.push('Math.pow(');
      out.push(this._node(node[2]));
      out.push(',');
      out.push(this._node(node[4]));
      out.push(')');
      this.info(this._dmp(node[2][1].type));
      this.info(this._dmp(node[4][1].type));
      var base = this._coerceBase(node[2][1].type.base, node[4][1].type.base);
      node[1].type.base = base;
      break;
    default:
      throw new Error("Unhandled dREL Math operator " + node);

  }
  return out.join("");
};

/**
 * This is a wrapper around two DDL specific Type resolvers, 
 * given the different definition styles of DDLm and DDLstar
 * @memberof dREL_handler.prototype
 * @param item {ItemDefn} Dictionary definition
 * @return {Type} 
 */
dREL_handler.prototype._resolveDictItemType = function(item) {
  if (this._dict._ddl_version == 'DDL_star') 
    return this._resolveDDLstarDictItemType(item);
  if (this._dict._ddl_version == 'DDLm') 
    return this._resolveDDLmDictItemType(item);
};

/**
 * Type resolver for dictionry items defined in DDLstar.
 * @memberof dREL_handler.prototype
 * @param item {ItemDefn} Dictionary definition
 * @return {Type} 
 */
dREL_handler.prototype._resolveDDLstarDictItemType = function(item) {
/*
    _type.container              Matrix
    _type.container              Single       
    _type.container              Table
    _type.container              Tuple
    _type.container              Tuple[Tuple]
    _type.container              Tuple[Vector,Vector]
    _type.container              Vector
 */
  var type_info = {'class':'Item'}; 
  var cont = item.getAttribute(this._dict._data_container);
  if (cont == "Single") cont = "Scalar";

  var dim = item.getAttribute(this._dict._data_dimension);
  var base = item.getAttribute(this._dict._data_type);
  if (base.toLowerCase() == 'inherited'){ // DDLm
     this.info(" NO TYPE INFORMATION for Inherited"); 
//  throw new Error("dREL_handler: No type info deduced for Inherited item " + name +"." + attribute + " :-(" );
  } 
  if (cont != "Scalar") {
//            var dat = this._resolveDictFunctionItem(cont,dim,base);
//            cont = dat[0];
//            base = dat[1];
    var contents = cont.split(/[,[\]]/);
    var container = contents[0];
    var basaldef = [];
    if (container == 'Matrix' && dim &&
       (dim instanceof Array ) && dim.length == 1) {
      // because DDLm no longer defines 'Vector' type, we gotta do it ourselves
      container = 'Vector';
      basaldef = base;
      cont = container;
    }
    if (container == 'Tuple' || container == 'List' || container == 'Table') {
      if (contents.length > 1) { // only occurred in DDL_star
        for (var i = 1; i <contents.length && contents[i]; i++) {
          var dimen = 1;
          if (dim && dim[1]) {
            dimen = dim[1];
          } 
          basaldef.push({'cont': contents[i], 'base': base, 'dim':dimen});
        }
      } else if (dim) {
        this.info("Item dim is: " + (typeof dim));
        if (this._dict._ddl_version != 'DDLm') {
          basaldef = base;
        } else {
          if (dim instanceof Array ) {
            //basaldef = [];
            for (var i = 0; i < dim.length; i++) {
              var elem = dim[i];
              if (elem instanceof Array) {
                if (elem.length == 1) {
                  if (base == 'Real')
                     basaldef.push({'cont': 'Vector', 'base': base, 'dim':elem});
                  else {
                  }
                }else if (elem.length == 2) {
                  if (base == 'Real')
                     basaldef.push({'cont': 'Matrix', 'base': base, 'dim':elem});
                  else {
                  }
                }
              } else {
                     basaldef.push({'cont': 'Scalar', 'base': elem });
              }
            }
          } else {
            basaldef = base;
          }
        }
         // a list of "what" exactly?
      
      } else { // no dim defined
          basaldef = base;
      }
    }
    cont = container;
  }
  type_info.dim = dim;
  type_info.cont = cont;
  type_info.base = basaldef;
  this.info ("DICT item type: "+ this._dmp(type_info));
  return type_info;

/*
              var type_info ={'class':'Item'} ; 
              var base = item.getAttribute(this._dict._data_type);
              if (base.toLowerCase() == 'inherited'){ // DDLm
                 this.info(" NO TYPE INFORMATION for Inherited"); 
//                 throw new Error("dREL_handler: No type info deduced for Inherited item " + name +"." + attribute + " :-(" );
              } else {

              }
              type_info.base = base;
              var cont = item.getAttribute(this._dict._data_container);
              if (cont == "Single") cont = "Scalar";
              type_info.cont = cont;
              var dim = item.getAttribute(this._dict._data_dimension);
              if (cont == 'Matrix' && dim &&
                  (dim instanceof Array ) && dim.length == 1) {
    // because DDLm no longer defines 'Vector' type, we gotta do it ourselves
this.info("CONVERT MATRIX " + item._name + " TO VECTOR");
                cont = 'Vector';
                type_info.cont = cont;
              }
              type_info.dim = dim;
  */
/*
              var type_info ={'class':'Item'} ; 
              var cont = item.getAttribute(this._dict._data_container);
              if (cont == "Single") cont = "Scalar";
              type_info.cont = cont;
              var dim = item.getAttribute(this._dict._data_dimension);
              type_info.dim = dim;
              var base = item.getAttribute(this._dict._data_type);
              type_info.base = base;
 */

};

/**
 * Type resolver for dictionry items defined in DDLm.
 * @memberof dREL_handler.prototype
 * @param item {ItemDefn} Dictionary definition
 * @return {Type} 
 */
dREL_handler.prototype._resolveDDLmDictItemType = function(item) {
/*  _type.container              List
    _type.container              Matrix
    _type.container              Ref-table
    _type.container              Single 
    _type.container              Table

    _type.contents               Code
    _type.contents               Code,Matrix(Index,Index,index)
    _type.contents               Code,Symop
    _type.contents               Complex
    _type.contents               Count
    _type.contents               Index
    _type.contents               Integer
    _type.contents               List(Code,Symop)       
    _type.contents               List(Real,Real,Real,Real)
    _type.contents               Matrix(Real,Real,Real)
    _type.contents               Real   
    _type.contents               Symop
    _type.contents               Table
    _type.contents               Text

 */
  basicTypes = {'Symop':1,'Text':1,'Code':1}; 

  var type_info = {'class':'Item'}; 
  var cont = item.getAttribute(this._dict._data_container);
  if (cont == "Single") cont = "Scalar";

  var dim = item.getAttribute(this._dict._data_dimension);
  var base = item.getAttribute(this._dict._data_type); // string assumed!

  if (! base) {
    type_info.dim = dim;
    type_info.cont = cont;
    this.info ("DICT item type: "+ this._dmp(type_info));
    this.warn ("No " + this._dict._data_type + " defined for " +item._name);
    return type_info;
  }
  if (base.toLowerCase() == 'inherited'){ // DDLm
     this.info(" NO TYPE INFORMATION for Inherited"); 
  } 

  var up = { 'cont':cont, 'args':[ ] };
  var stack = [];
  stack[0] = up;
  var p = 1;
  stack[p] = stack[0]['args'] ;
  var ch = []; 
  if (base) {
  for (var i=0; i<base.length;i++) {
    var c = base[i];
    if (c == ',' ) {
      var name = ch.join('');
      if (! name) continue; // maybe last was a close bracket
      ch = [];
      if ((name in this.numericTypes) || (name in basicTypes)) {
        stack[p].push( name);
      } else {
        stack[p].push( { 'cont':name, 'args':[ ] });
      }
    } else if (c == '(' ) { 
      var name = ch.join('');
      ch = [];
      stack[p].push( { 'cont':name, 'args':[ ] });
      stack.push(stack[p][0]['args']);
      p=p+1;
    } else if (c == ')' ) {
      var name = ch.join('');
      ch = [];
      if (name) {
        if ((name in this.numericTypes) || (name in basicTypes)) {
          stack[p].push( name);
        } else {
          stack[p].push( { 'cont':name, 'args':[ ] });
        }
      }
      p = p-1;
    } else {
      ch.push(c);
    }
  }
  }
  if (ch.length) {
    var name = ch.join('');
    stack[p].push( { 'cont':name, 'args':[ ] });
    p = p-1;
  }
//  this.info ("DICT item  "+item._name + " contents: "+ this._dmp(up));
//  this.info ("DICT item  "+item._name + " contents: "+ this._dmp(stack));
  var basaldef;
  if (base) basaldef = base;
  if (up['args'].length == 1 && up['args'][0]['args'].length == 0) {
    basaldef = up['args'][0]['cont']; // simple type
  } else {
    basaldef = up['args']; // complex type
    if (basaldef[0]['cont'] == 'Matrix') {
       basaldef[0]['cont'] = 'Vector'; // only if args = 'Real',...
    } 
  }

  // make multiple copies, by reference, if required
  if (cont == 'List' && dim && dim.length == 1 && basaldef.length == 1) {
    var rep = parseInt(dim[0]); 
    for (var k = 1; k<rep; k++) {
      basaldef.push(basaldef[0]); 
    } 
  }
  if (cont == 'Matrix' && dim && dim.length == 1) {
    cont = 'Vector';
  }
  
  type_info.dim = dim;
  type_info.cont = cont;
  type_info.base = basaldef;
  this.info ("DICT item type: "+ this._dmp(type_info));
  return type_info;
};


dREL_handler.prototype._dmp = function(obj) {
 var text = [];
 this._renderObject(text,obj);
 return text.join('');
};

dREL_handler.prototype._renderObject = function(text, value) {
  if (typeof value === 'string' ) { 
    if (value.match(/[\n\r\f]/)) {
      text.push('\n');
      text.push(value);
      text.push('\n');
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
    if (!value.match(/[ \t]/)) {
//      this._info("no space for " + value);
      text.push(value);
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
     // text.push("" + value.x );
     text.push(numeric.prettyPrint(value.x).trim());
    if (value.y){ 
      if (value.y<0.) text.push("-");
      else            text.push("+");
      // text.push("i" + Math.abs(value.y));
      text.push("i");
      text.push(numeric.prettyPrint(Math.abs(value.y)).trim());
    }
  }
  else if (value instanceof Array) {
//    if (numeric) {
//      text.push(numeric.prettyPrint(value));
//    } else {
      text.push('[');
      for (var i = 0; i <value.length; i++) { 
        if (i) text.push(', ');
        this._renderObject(text, value[i]) ;
      }
      text.push(']');
//   }
  }
  else {
    text.push('{');
    var i = 0;
    for (var key in value) {
      if (i) text.push(', ');
      this._renderObject(text, key); 
      text.push(':');
      this._renderObject(text, value[key]); 
      i++;
    }
    text.push('}');
  }

};



if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.dREL_handler = dREL_handler;
}


