if (typeof require !== 'undefined') {
  require("./numeric-1.0.2.js");
}

/* 
 * define the indexOf func for browsers that don't have it by default
 */
if (!Array.prototype.indexOf) {
   Array.prototype.indexOf = function(item) {
      var i = this.length;
      while (i--) {
         if (this[i] === item) return i;
      }
   };
}


function Library()  {
  this.TwoPi= 2. * Math.PI;
  this.Pi = Math.PI;
  this.Deg2Rad = Math.PI/180.;
  this.E = Math.E;

  this._constants = [ 'TwoPi', 'Pi', 'Deg2Rad', 'E' ];


  this._pointWiseUnary = {
    'abs':'abs',
    'acos':'acos',
    'asin':'asin',
    'atan':'atan',
    'atan2':'atan2',
    'bnot':'bnot',
    'ceil':'ceil',
    'cos':'cos',
    'exp':'exp',
    'floor':'floor',
    'isFinite':'isFinite',
    'isNaN':'isNaN',
    'log':'log',
    'neg':'neg',
    'not':'not',
    'pow':'pow',
    'round':'round',
    'sin':'sin',
    'sqrt':'sqrt',
    'tan':'tan'
  };


  this._pointWiseBinary = {
    'add':'add',
    'and':'and',
    'band':'band',
    'bor':'bor',
    'bxor':'bxor',
    'div':'div',
    'eq':'eq',
    'gt':'gt',
    'lshift':'lshift',
    'lt':'lt',
    'mod':'mod',
    'mul':'mul',
    'or':'or',
    'rrshift':'rrshift',
    'rshift':'rshift',
    'sub':'sub'
  };



  this._pointWiseBinaryAssign = {
    'lshifteq':'lshifteq',
    'addeq':'addeq',
    'andeq':'andeq',
    'diveq':'diveq',
    'geq':'geq',
    'leq':'leq',
    'modeq':'modeq',
    'neq':'neq',
    'oreq':'oreq',
    'rrshifteq':'rrshifteq',
    'rshifteq':'rshifteq',
    'subeq':'subeq',
    'xoreq':'xoreq'
  };


  this._scalarFromNon = {
    'det':'det',
    'all':'all',
    'any':'any',
    'dot':'dot',
    'norm':'norm2',
    'norm2Squared':'norm2Squared',
    'sdot':'sdot',
    'sum':'sum'
  };
  this._numericUnaryFuncMapping = {
    'transpose':'transpose',
    'eigen':'eig'
  };

  this._numericFuncs = {
    'mapreduce':'mapreduce',

    'bench':'bench',
    'cLU':'cLU',
    'cLUsolve':'cLUsolve',
    'cdelsq':'cdelsq',
    'cdotMV':'cdotMV',
    'cgrid':'cgrid',
    'clone':'clone',
    'diag':'diag',
    'dim':'dim',
    'dopri':'dopri',
    'Dopri.at':'Dopri.at',
    'eig':'eig',
    'epsilon':'epsilon',
    'getBlock':'getBlock',
    'getDiag':'getDiag',
    'identity':'identity',
    'imageURL':'imageURL',
    'inv':'inv',
    'largeArray':'largeArray',
    'linspace':'linspace',
    'norminf':'norminf',
    'parseCSV':'parseCSV',
    'parseDate':'parseDate',
    'parseFloat':'parseFloat',
    'pointwise':'pointwise',
    'precision':'precision',
    'prettyPrint':'prettyPrint',
    'random':'random',
    'rep':'rep',
    'sLUP':'sLUP',
    'sLUPsolve':'sLUPsolve',
    'same':'same',
    'sclone':'sclone',
    'sdiag':'sdiag',
    'sdim':'sdim',
    'seedrandom':'seedrandom',
    'setBlock':'setBlock',
    'sgather':'sgather',
    'sidentity':'sidentity',
    'solveQP':'solveQP',
    'spline':'spline',
    'Spline.at':'Spline.at',
    'Spline.diff':'Spline.diff',
    'Spline.roots':'Spline.roots',
    'sscatter':'sscatter',
    'stranspose':'stranspose',
    'svd':'svd',
    't':'t',
    'T.<numericfun>':'T.<numericfun>',
    'T.conj':'T.conj',
    'T.fft':'T.fft',
    'T.get':'T.get',
    'T.getRow':'T.getRow',
    'T.getRows':'T.getRows',
    'T.ifft':'T.ifft',
    'T.reciprocal':'T.reciprocal',
    'T.set':'T.set',
    'T.setRow':'T.setRow',
    'T.setRows':'T.setRows',
    'T.transjugate':'T.transjugate',
    'tensor':'tensor',
    'transpose':'transpose',
    'uncmin':'uncmin',
    'version':'version'
  };
}

Library.prototype._dummy = function(func) {
  return "Function " + func + " is not implemented";
};

/*
  Sign

  List
  Table

  NameCategory
  NameAttribute

  ListWrap
 */


Library.prototype.Matrix= function(mat) {
  return mat;
};
Library.prototype.Matrix.returnType = 
     {'class':'Global','type':'func','cont':'Matrix' };
Library.prototype.Matrix.args = ['Array'];


Library.prototype.Transpose= function(mat) {
     numeric.prettyPrint(mat);
  return numeric.transpose(mat);
};
Library.prototype.Transpose.returnType = 
     {'class':'Global','type':'func','cont':'Matrix' };
Library.prototype.Transpose.args = ['Matrix'];


Library.prototype.Minor = function() {
  return this._dummy('Minor()');
};
//Library.prototype.Minor.returnType = 
//     {'class':'Global','type':'func','cont':'Matrix' };
//Library.prototype.Minor.args = ['Matrix'];


Library.prototype.Cofactor= function() {
  return this._dummy('Cofactor()');
};

Library.prototype.Adjoint= function() {
  return this._dummy('Adjoint()');
};
//Library.prototype.Adjoint.returnType = 
//     {'class':'Global','type':'func','cont':'Matrix' };
//Library.prototype.Adjoint.args = ['Matrix'];


Library.prototype.Det= function(mat) {
  return numeric.det(mat);
};
Library.prototype.Det.returnType = 
     {'class':'Global','type':'func','cont':'Scalar','base':'Float' };
Library.prototype.Det.args = ['Matrix'];


Library.prototype.Inverse= function(mat) {
  return numeric.inv(mat);
};
Library.prototype.Inverse.returnType = 
     {'class':'Global','type':'func','cont':'Matrix' };
Library.prototype.Inverse.args = ['Matrix'];


Library.prototype.Eigen= function(mat) {
  // numeric returns complex eigenvalues and vectors as a composite object
  // { lambda: [ ] , E: [[ ]] } 
  return numeric.eig(mat);
};
Library.prototype.Eigen.returnType = 
     {'class':'Global','type':'func','cont':'Table' };
Library.prototype.Eigen.args = ['Matrix'];


Library.prototype.Vector= function(vec) {
  if (arguments.length > 1) {
    var list = [];
    for (var i=0; i <arguments.length; i++ ) {
      list.push(arguments[i]);
    }
    return list;
  }
  return vec;
};

Library.prototype.Vector.returnType = 
     {'class':'Global','type':'func','cont':'Vector' };
Library.prototype.Vector.args = ['Array'];

// this is a generic composite Matrix/Zvector thingy.:
Library.prototype.Array= function(vec) {
  if (arguments.length > 1) {
    var list = [];
    for (var i=0; i <arguments.length; i++ ) {
      list.push(arguments[i]);
    }
    return list;
  }
  return vec;
};
Library.prototype.Array.returnType = 
     {'class':'Global','type':'func','cont':'Array' };
Library.prototype.Array.args = ['Array'];



Library.prototype.Dim= function(mat) {
  return numeric.dim(mat);
};

Library.prototype.Dot= function(a,b) {
  return numeric.dot(a,b);
};

Library.prototype.Cross= function(a,b) {
  //return numeric.cross(a,b);
  return [(a[1]*b[2]-a[2]*b[1]), (a[2]*b[0] - a[0]*b[2]), (a[0]*b[1]-a[1]*b[0])]; 
};

Library.prototype.Wedge= function(a,b) {
  return this.Cross(a,b);
};
Library.prototype.Wedge.returnType = 
     {'class':'Global','type':'func','cont':'Vector' };
Library.prototype.Wedge.args = ['Array'];

Library.prototype.Norm= function(arg) {
  return numeric.norm2(arg);
};
Library.prototype.Norm.returnType = 
          {'class':'Global','type':'func','cont':'Scalar'};
Library.prototype.Norm.args = ['Vector'];


// ------------------ Trig -------------------------


Library.prototype.Sin= function(arg) {
  return Math.sin(arg);
};
Library.prototype.Sin.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Sin.args = ['Float'];


Library.prototype.Sind= function(arg) {
  var val = Math.sin(arg * this.Deg2Rad);  
  return  val;
};
Library.prototype.Sind.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Sind.args = ['Float'];


Library.prototype.Cos= function(arg) {
  return Math.cos(arg);
};
Library.prototype.Cos.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Cos.args = ['Float'];


Library.prototype.Cosd= function(arg) {
  return Math.cos(arg * this.Deg2Rad);
};
Library.prototype.Cosd.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Cosd.args = ['Float'];


Library.prototype.Tan= function(arg) {
  return Math.tan(arg);
};
Library.prototype.Tan.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Tan.args = ['Float'];


Library.prototype.Tand= function(arg) {
  return Math.tan(arg * this.Deg2Rad);
};
Library.prototype.Tand.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Tand.args = ['Float'];


Library.prototype.Asin= function(arg) {
  return Math.asin(arg);
};
Library.prototype.Asin.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Asin.args = ['Float'];

Library.prototype.Arcsin= function(arg) {
  return Math.asin(arg);
};
Library.prototype.Arcsin.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Arcsin.args = ['Float'];

Library.prototype.Asind= function(arg) {
  return Math.asin(arg) / this.Deg2Rad;
};
Library.prototype.Asind.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Asind.args = ['Float'];


Library.prototype.Acos= function(arg) {
  return Math.acos(arg);
};
Library.prototype.Acos.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Acos.args = ['Float'];


Library.prototype.Arccos= function(arg) {
  return Math.acos(arg);
};
Library.prototype.Arccos.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Arccos.args = ['Float'];


Library.prototype.Acosd= function(arg) {
  return Math.acos(arg) / this.Deg2Rad;
};
Library.prototype.Acosd.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Acosd.args = ['Float'];


Library.prototype.Arctan= function(arg) {
  return Math.atan(arg);
};
Library.prototype.Arctan.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Arctan.args = ['Float'];


Library.prototype.Atan= function(arg) {
  return Math.atan(arg);
};
Library.prototype.Atan.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Atan.args = ['Float'];


Library.prototype.Atand= function(arg) {
  return Math.atan(arg) / this.Deg2Rad;
};
Library.prototype.Atand.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Atand.args = ['Float'];


Library.prototype.Arctan2= function(a) {
  return Math.atan2(a,b);
};
Library.prototype.Arctan2.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Arctan2.args = ['Float'];


Library.prototype.Atan2= function(a,b) {
  return Math.atan2(a,b);
};
Library.prototype.Atan2.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Atan2.args = ['Float','Float'];


Library.prototype.Atan2d= function(a,b) {
  return Math.atan2(a,b) / this.Deg2Rad;
};
Library.prototype.Atan2d.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Atan2d.args = ['Float','Float'];


// ---------------- Complex --------------


Library.prototype.Complex= function(a,b) {
  return new numeric.T(a,b);
};
Library.prototype.Complex.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Complex'};
Library.prototype.Complex.args = ['Float','Float'];


Library.prototype.Phase= function(z) {
  return Math.atan2(Real(z),Imag(z));
};
Library.prototype.Phase.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Phase.args = ['Complex'];


Library.prototype.Real= function(z) {
  if (z.x) return z.x;
  return 0.;
};
Library.prototype.Real.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Real.args = ['Complex'];


Library.prototype.Imag= function(z) {
  if (z.y) return z.y;
  return 0.;
};
Library.prototype.Imag.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Imag.args = ['Complex'];


Library.prototype.ExpImag= function(x) {
  return new numeric.T(this.Cos(x) , this.Sin(x));
};
Library.prototype.ExpImag.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Complex'};
Library.prototype.ExpImag.args = ['Float'];


Library.prototype.Magn= function(z) {
  // Z is complex
  var sum = 0.;
  if (z.x) sum +=  z.x*z.x;
  if (z.y) sum +=  z.y*z.y;
// because 
// http://groups.google.com/group/numericjs/browse_thread/thread/57fbdb2cae2f0fb6
  return Math.sqrt(sum);
};
Library.prototype.Magn.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Magn.args = ['Complex'];


Library.prototype.ExpIm= function(x) {
  return numeric.T(Math.cos(x),Math.sin(x));
};
Library.prototype.ExpIm.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Complex'};
Library.prototype.ExpIm.args = ['Float'];



// -------------- objects -----------

Library.prototype.Table= function(dict) {
  if (dict) return dict;
  return {};
};
Library.prototype.Table.returnType = 
     {'class':'Global','type':'func','cont':'Table' };
Library.prototype.Table.args = ['Table'];


Library.prototype.Map= function(dict) {
  return dict;
};

Library.prototype.map= function() {
  return this._dummy('map()');
};


Library.prototype.List= function(args) {
  if (arguments.length > 1) {
    var list = [];
    for (var i=0; i <arguments.length; i++ ) {
      list.push(arguments[i]);
    }
    return list;
  }
  if (arguments.length == 1) {
    return args;
  }
  return [];
};
Library.prototype.List.returnType = 
          {'class':'Global','type':'func','cont':'List'};
Library.prototype.List.args = ['Array'];



Library.prototype.Measure= function() {
  return this._dummy('Measure()');
};

Library.prototype.MultiUchar= function() {
  return this._dummy('MultiUchar()');
};
Library.prototype.Uchar = Uchar;

Library.prototype.Tuple= function(arg) {
  return arg;
};
Library.prototype.Tuple.returnType = 
          {'class':'Global','type':'func','cont':'Tuple'};
Library.prototype.Tuple.args = ['Array'];


Library.prototype.Float= function(x) {
  return  x; // in javascript all ints are actually floats.
  //return new Float(x);
};
Library.prototype.Float.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Float.args = ['Int'];


Library.prototype.Matrix2D= function(mat) {
  return mat;
};


Library.prototype.Integer= function(x) {
  return new Int(x);
};

Library.prototype.Char= function() {
  return this._dummy('Char()');
};

Library.prototype.Numb= function() {
  return this._dummy('Numb()');
};


// ---------------- Math --------------

Library.prototype.Sqrt= function(arg) {
  return Math.sqrt(arg);
};
Library.prototype.Sqrt.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Sqrt.args = ['Float'];


Library.prototype.Exp= function(arg) {
  return Math.exp(arg);
};
Library.prototype.Exp.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Exp.args = ['Float'];


Library.prototype.Mod= function(a,b) {
  return  a % b;
};
Library.prototype.Mod.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Mod.args = ['Float','Float'];


Library.prototype.Abs= function(x) {
  return Math.abs(x);
};
Library.prototype.Abs.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Float'};
Library.prototype.Abs.args = ['Float'];


Library.prototype.Sum= function(list) {
  return numeric.sum(list);
};


Library.prototype.Rem= function(x) {
  return  x % 1.0;
};

Library.prototype.Log= function(arg) {
  return Math.log(arg);
};

Library.prototype.Ln= function() {
  return this._dummy('Ln()');
};

// ---------------- Numeric --------------

// truncation
Library.prototype.Int= function(x) {
  if (x>=0) return Math.floor(x);
  else return Math.ceil(x);
};
Library.prototype.Int.returnType = 
     {'class':'Global','type':'func','base':'Int' };
Library.prototype.Int.args = ['multi'];

Library.prototype.IntV= numeric.pointwise(['x[i]'],
  'if (x[i]>=0) ret[i] = Math.floor(x[i]);else ret[i] = Math.ceil(x[i]);');
/*
Library.prototype.IntV= function() {
  return function() { return
  numeric.pointwise(['x[i]'],'ret[i] = Library.Int(x[i]);'); 
  };
}
Library.prototype.IntV= numeric.pointwise(['x[i]'],
        'ret[i] = Library.Int(x[i]);'); 
 */


Library.prototype.Nint= function(x) {
  if (x>0.0) return this.Int(x+.5);
  else       return this.Int(x-.5);
};


Library.prototype.First= function(list) {
  return list[0];
};

Library.prototype.Last= function(list) {
  return list[list.length-1];
};

Library.prototype.Len= function(list) {
  return list.length;
};
Library.prototype.Len.returnType = 
     {'class':'Global','type':'func','cont':'Scalar', 'base':'Int' };
Library.prototype.Len.args = ['multi'];


Library.prototype.Max= function() {
  return this._dummy('Max()');
};

Library.prototype.Min= function() {
  return this._dummy('Min()');
};

Library.prototype.MaxI= function() {
  return this._dummy('MaxI()');
};

Library.prototype.MinI= function() {
  return this._dummy('MinI()');
};

Library.prototype.TopHi= function() {
  return this._dummy('TopHi()');
};

Library.prototype.TopLo= function() {
  return this._dummy('TopLo()');
};


Library.prototype.AtoI= function(strn) {
  return parseInt(strn);
};
Library.prototype.AtoI.returnType = 
          {'class':'Global','type':'func','cont':'Scalar','base':'Int'};
Library.prototype.AtoI.args = ['String'];


//   --------------------  utility -------------------


Library.prototype.Sort= function(list,func) {
  if (func) return list.sort(func);
  function sf(a,b){ return (a-b); }
  return list.sort(sf);
};

Library.prototype.Reverse= function(list) {
  return list.reverse(); // changes original list
};



Library.prototype.SubString= function(s1,s2) {
  return  1 + s1.indexOf(s2);
};


/*
 * This takes a list of sublists and returns a Strip comprised of the 
 * indexth entries of each of the sublists
 */
Library.prototype.Strip= function(list, index) {
  var retVal = new Array(list.length);
  for (var i = 0; i < list.length; i++) {
    retVal[i] = list[i][index];
  }
  return retVal;
};
Library.prototype.Strip.returnType = 
          {'class':'Global','type':'func','cont':'List'};
Library.prototype.Strip.args = ['Array','Int'];
// how do I say Array of Arrays???


Library.prototype.ElemInList= function(elem, list) {
  if (list.indexOf(elem) >= 0) return true; 
  // not identical objects
  if (elem instanceof Array) {
    for (var i = 0; i<list.length; i++) {
      var match = true;
      var item = list[i];
      for (var j = 0; j<elem.length; j++) {
           
//         alert(i + " " + j +" " + item[j] + " ::: " + elem[j] + " ::: " + (item[j] != elem[j]));
         if (item[j] != elem[j]) {
           match = false;
           break;
         } 
      }   
      if (match) {
        return true;
      }
    }
  }
  return false;
};


Library.prototype.ElemNotInList= function(elem, list) {
  var res =(! this.ElemInList(elem,list)); 
//  alert ("check is " + elem + " not in " + list + " ? " + res);
  return res;
};

Library.prototype.RemoveFromList= function(list, elem) {
       alert("remove from list " + elem);
  var isarray = elem instanceof Array;  
       alert("isarray ? " + isarray);
  for (var i = 0; i<list.length; i++) {
    if (isarray) {
      var match = 1;
      var item = list[i];
      for (var j = 0; j<elem.length; j++) {
         
       alert(i + " " + j +" " + item[j] + " ::: " + elem[j] + " ::: " + (item[j] != elem[j]));
        if (item[j] != elem[j]) {
          match = 0;
          break;
        } 
      }   
      if (match) {
       alert("deleted item " + i);
       list.splice(i,1);
       return;
      }
     
    } else {
      if (list[i] === elem) {
         alert("deleted item " + i);
         list.splice(i,1);
        return;
      }
    }
  }
};


Library.prototype.Seitz= function() {
  return this._dummy('Seitz()');
};


Library.prototype.XXMyStart= function() {
  return this._dummy('XXMyStart()');
};

Library.prototype.XXStart= function() {
  return this._dummy('XXStart()');
};

Library.prototype.NameCategory= function() {
  return this._dummy('NameCategory()');
};

Library.prototype.NameAttribute= function() {
  return this._dummy('NameAttribute()');
};


Library.prototype.Consbrac1= function() {
  return this._dummy('Consbrac1()');
};


Library.prototype.xrange1= function() {
  return this._dummy('xrange1()');
};

Library.prototype.Warn= function() {
  return this._dummy('Warn()');
};

Library.prototype.Fatal= function() {
  return this._dummy('Fatal()');
};

Library.prototype.Abort= function() {
  return this._dummy('Abort()');
};

Library.prototype.SwitchSuEval= function() {
  return this._dummy('SwitchSuEval()');
};


//  ------------- Implementation ------------------


Library.prototype._copyHash= function(hash) {
  var ret = {};
  for (var key in hash) {
    ret[key] = hash[key];
  }
  return ret;
};

Library.prototype.getFuncRetType = function(func,ftype, arglist) {
  var scalar  = 1;
  for (var i=0; i< arglist.length;i++) {
//    console.log("Arg "+ i + "-----------------");
//    console.log(arglist[i]);
 try {
    var cont = arglist[i].cont;
 } catch (e) {
   alert("lib function lookup error: " + func + " : " + ftype + " " + arglist);
   throw (e);
  
 }
    if (cont == 'Matrix' || cont =='Vector') {
      scalar = 0;
      break; 
    }
  }

  var lfname = func.toLowerCase();   
  if (! scalar){
    if (arglist.length == 1 && lfname in this._pointWiseUnary) {
      var cont = arglist[0]['cont'];
      var base = arglist[0]['base'];
      return ['numeric' + "." +this._pointWiseUnary[lfname], 
        {'class':'Global','type':'func','cont':cont,'base':base}];
    } 
    if (arglist.length == 1 && lfname in this._scalarFromNon) {
      var base = arglist[0]['base'];
      return ['numeric' + "." +this._scalarFromNon[lfname], 
        {'class':'Global','type':'func','cont':'Scalar','base':base}];
    } 
    if (arglist.length == 1 && lfname in this._numericUnaryFuncMapping) {
      if (func in this ) {
        if (this[func].returnType) 
          return ['Library',  this._copyHash(this[func].returnType) ]; 
      }
    }
    if (arglist.length == 2 && lfname in this._pointWiseBinary) {
      var c0 = arglist[0]['cont'];
      var c1 = arglist[1]['cont'];
      if (c0 == 'Scalar' && (c1 == 'Vector' || c1 == 'Matrix'))  
        return ['numeric' + '.' + this._pointWiseBinary[lfname], 
          {'class':'Global','type':'func','cont':c1,'base':arglist[1]['base']}];
      if (c1 == 'Scalar' && (c0 == 'Vector' || c0 == 'Matrix'))  
        return ['numeric' + '.' + this._pointWiseBinary[lfname], 
          {'class':'Global','type':'func','cont':c0,'base':arglist[0]['base']}];
      throw new Error("Error finding function " + func +  " : " +ftype); 
    }
    if (arglist.length == 2 && lfname in this._pointWiseBinaryAssign) {
      var c0 = arglist[0]['cont'];
      var c1 = arglist[1]['cont'];
      if (c0 == 'Scalar' && (c1 == 'Vector' || c1 == 'Matrix'))  
        return ['numeric', 
          {'class':'Global','type':'func','cont':c1,'base':arglist[1]['base']}];
      if (c1 == 'Scalar' && (c0 == 'Vector' || c0 == 'Matrix'))  
        return ['numeric', 
          {'class':'Global','type':'func','cont':c0,'base':arglist[0]['base']}];
      throw new Error("Error finding function " + func +  " : " +ftype); 
    }

    // maybe applying function pointwise to vector ??  
    if ((func + "V") in this) {
      if (this[func].returnType) { 
        var ret =  this._copyHash(this[func].returnType); 
        if (this[func].args && this[func].args.length == 1 
             && this[func].args[0] == 'multi') {
           ret['cont'] = arglist[0]['cont'];
           return ['Library.'+ func+"V", ret]; 
        }
      }
      // else drop thru to fail

    }
    // last resort ?
      if (func in this ) {
        if (this[func].returnType) 
          return ['Library',  this._copyHash(this[func].returnType) ]; 
      }

   
  } else if (func in this) {
    // use the default scalar math library
    var ret; 
    if (this[func].returnType) 
      ret =  this._copyHash(this[func].returnType); 
    else {
      ret = {'class':'Global','type':'func'};
      console.warn("No Library spec for function "+ func);
    }
    if (! this[func].args) {
      console.warn("Library has no '.args' spec for function "+ func);
      alert("Library has no '.args' spec for function "+ func);
    }
    if (this[func].args.length>0){
      if ('base' in ret) { 
        // function returns a specific type
        // do nothing
      } else if (arglist.length>0)
        ret['base'] = arglist[0]['base'];   // should coerce to greatest arg precis.
    } 
    // console.log("return base type " );
    // console.log(ret);
    return ['Library', ret]; 
  } 

  throw new Error("Error finding function " + func +  " : " +ftype); 

};

// -------------------------------------
function Uchar(s)  {
  this.value = s;
  this._s = s.toLowerCase();
}
Uchar.prototype.__cmp__ = function(other) {
  return  this._s == other.toLowerCase();
};
Uchar.prototype.toString = function() {
  return  this.value;
};


// -------------------------------------
/*
function  List(args) {
  if (arguments.length) { this._init(args); }
}

List.prototype = new Array();

List.prototype._init = function(args) {
  this.__tmpinit = Array.prototype._init;
  // now Array constructor thinks it belongs to DDL1
  this.__tmpinit(args);
}
 */




if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
  exports.Library = Library;
}
