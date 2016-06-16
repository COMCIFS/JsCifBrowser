// this is just to test parsing of composed types
var util = require('util');
var cont = 'List';
var base = 'List(Code(Int,Real),Symop)';
  var up = { 'cont':cont, 'args':[ ] };
  var stack = [];
  stack[0] = up;
  var p = 1;
  stack[p] = stack[0]['args'] ;
  var ch = [];
  for (var i=0; i<base.length;i++) {
    var c = base[i];
      console.log(c);
    if (c == ',' ) {
      var name = ch.join('');
      if (! name) continue;
      ch = [];
      console.log(up);
      console.log(p);
      console.log(stack);
      stack[p].push( { 'cont':name, 'args':[ ] });
    } else if (c == '(' ) {
      var name = ch.join('');
      ch = [];
      console.log(up);
      console.log(p);
      console.log(stack);
      stack[p].push( { 'cont':name, 'args':[ ] });
      stack.push( stack[p][0]['args']);
      p=p+1;
    } else if (c == ')' ) {
      var name = ch.join('');
      ch = [];
      console.log(up);
      console.log(p);
      console.log(stack);
      stack[p].push( { 'cont':name, 'args':[ ] });
      p = p-1;
    } else {
      ch.push(c);
    }
  }
  if (ch.length) {
    var name = ch.join('');
    stack[p].push( { 'cont':name, 'args':[ ] });
    p = p-1;
  }

console.log(util.inspect(up,false, null));

console.log(parseInt("abdc"));
