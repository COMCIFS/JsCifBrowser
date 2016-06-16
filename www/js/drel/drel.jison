/*
  This is a Jison grammar file for the dREL language, loosely built on the
  Python grammar but which uses '{','}' statement block delimiters rather
  than whitespace indentation. 
  Original at:   http://docs.python.org/reference/grammar.html

  Jison is a Flex/Bison analogue written in Javascript and which produces
  a self-contained javascript parser for the grammar that runs under the nodeJS
  environment, or equally well within a standard web browser.

  Start symbols for the grammar:
        single_input is a single interactive statement;
        file_input is a module or sequence of commands read from an input file;
        eval_input is the input for the eval() functions.
  NB: compound_stmt in single_input is followed by extra NEWLINE!

  For checking this grammar, load it into:  
      http://zaach.github.com/jison/try/usf/

  Doug du Boulay  

  Note: There are a lot of shift reduce conflicts, but it seems to function ok.
 */

%lex

%s multiline
%x dquote squote tsquote tdquote 

digit                        [0-9]
id                           [a-z_A-Z][a-z_A-Z0-9]*

%%
"#".*                        /* ignore comment */
"\\"[\n\r\f]+                /* skip newlines after line continuation */
[fF]"unction"                return 'FUNCTION';
[iI]"f"                      return 'IF';
[eE]"lse"                    return 'ELSE';
[wW]"ith"                    return 'WITH';
[lL]"oop"                    return 'LOOP';
[fF]"or"                     return 'FOR';
[bB]"reak"                   return 'BREAK';
[nN]"ext"                    return 'NEXT';
[rR]"eturn"                  return 'RETURN';
[wW]"hile"                   return 'WHILE';
[rR]"epeat"                  return 'REPEAT';
[dD]"o"                      return 'DO';
[aA]"s"                      return 'AS';
in                         return 'IN';
is                         return 'IS';
or                         return 'OR';
and                        return 'AND';
not                        return 'NOT';
[nN]"one"                    return 'NONE';
[tT]"rue"                    return 'TRUE';
[fF]"alse"                   return 'FALSE';
"null"                       return 'NUL';
[pP]"ass"                    return 'PASS';
[pP]"rint"                   return 'PRINT';
[dD]"el"                     return 'DEL';
[yY]"ield"                   return 'YIELD';
[fF]"rom"                    return 'FROM';
[lL]"ambda"                  return 'LAMBDA';
{id}                         return 'NAME';
"++<-"                       return 'APPEND';
"++="                        return 'APPEND';
"--<-"                       return 'ENTRYREWRITE';
"--="                        return 'ENTRYREWRITE';
"<<-"                        return 'SOMETHING';
"+<-"                        return 'INCR';
"+="                         return 'INCR';
"-<-"                        return 'DECR';
"-="                         return 'DECR';
"=="                         return 'EQUALITY';
"!="                         return 'NOTEQUAL';
"="                          return 'ASSIGN';
"<-"                         return 'ASSIGN2';
"+"                          return 'PLUS';
"-"                          return 'MINUS';
"**"                         return 'POW';
"*"                          return 'TIMES';
"/"                          return 'DIV';
"%"                          return 'MOD';
">="                         return 'GREATEQUAL';
">"                          return 'GREATER';
"<="                         return 'LESSEQUAL';
"<"                          return 'LESS';
"||"                         return 'OR';
"|"                          return 'BITOR';
"&&"                         return 'AND';
"&"                          return 'BITAND';
"^"                          return 'XOR';
"<<"                         return 'LSHIFT';
">>"                         return 'RSHIFT';
"!"                          return 'NOT';
"..."                        return 'ELLIPSIS';
"."                          return 'DOT';
","                          return 'COMMA';
"{"                          return 'LBRACE';
"}"                          return 'RBRACE';
"("                          { this.begin('multiline'); return 'LPAREN'; }
")"                          { this.popState(); return 'RPAREN';}
"["                          return 'LSQB';
"]"                          return 'RSQB';
";"                          return 'SEMICOLON';
":"                          return 'COLON';
"`"                          return 'BACKTICK';
<multiline>[\n\r\f]+         /* skip newlines */
[\n\r\f]+                    return 'NEWLINE';
[ \t]+                      /* skip whitespace */
[jJ]                         return 'CMPLX';
[-+]?[0-9]*\.[0-9]*([eE][-+]?[0-9]+)?  return 'FLOAT';
{digit}+[lL]                 return 'LONG';
[0][xX][0-9a-fA-F]+          return 'HEX';
[0][0-9]+                    return 'OCTAL';
{digit}+                     return 'INT';

('r'|'u'|'ur')?"'''"         { this.begin('tsquote'); return 'TS_quote'; }
<tsquote>([^']|[']/![']['])* { return 'TS_quote_string'; }
<tsquote>"'''"               { this.popState();       return 'TS_quote'; }
('r'|'u'|'ur')?'"""'         { this.begin('tdquote'); return 'TD_quote'; }
<tdquote>([^"]|["]/!["]["])+ { return 'TD_quote_string'; }
<tdquote>'"""'               { this.popState();       return 'TD_quote'; }
('r'|'u'|'ur')?["]           { this.begin('dquote');  return 'D_quote'; }
<dquote>["]                  { this.popState();       return 'D_quote'; }
<dquote>(\\\"|[^"])*/["]     { return 'D_quote_string'; }
('r'|'u'|'ur')?[']           { this.begin('squote');  return 'S_quote'; }
<squote>[']                  { this.popState();       return 'S_quote'; }
<squote>(\\\'|[^'])*/[']     { return 'S_quote_string'; }

"."                          throw 'Illegal character';
<<EOF>>                      return 'ENDMARKER';

/lex



%right ASSIGN ASSIGN2
%left OR
%nonassoc EQUALITY GREATER
%left LSHIFT RSHIFT
%left PLUS MINUS INCR DECR
%left TIMES
%right NOT
%left DOT
%right LBRACE LPAREN
%left RBRACE RPAREN

%start file_input

%%

/*
single_input: NEWLINE 
            | simple_stmt 
            | compound_stmt 
            ;
 */

file_input  : stmt 
              {$$ = ['STATEMENTS',{}, $1]; }
            | file_input stmt 
              {$$ = $1; $1.push($2); }
            | file_input ENDMARKER
              {$$ = ['PROCEDURE',{},$1]; return $$; }
            ;

/*
eval_input: testlist NEWLINE* ENDMARKER
            ;
 */

/*
decorator: '@' dotted_name [ LPAREN [arglist] RPAREN ] NEWLINE
decorators: decorator+
decorated: decorators (classdef | funcdef)

 */
 
funcdef: FUNCTION NAME parameters  suite
          { $$ = ['FUNCTION_EXPR',{},$2,$3,$4]; } 
       ;

parameters: LPAREN typedargslist RPAREN
          { $$ = $2; }
       ;
/*
typedargslist: (tfpdef [ASSIGN test] (COMMA tfpdef [ASSIGN test])* [COMMA
       ['*' [tfpdef] (COMMA tfpdef [ASSIGN test])* [COMMA '**' tfpdef] | '**' tfpdef]]
     |  '*' [tfpdef] (COMMA tfpdef [ASSIGN test])* [COMMA '**' tfpdef] | '**' tfpdef)
     ;
 */

typedargslist: tfpdef 
              { $$ = ['FUNC_ARGLIST',{},$1]; } 
            | typedargslist COMMA tfpdef
              { $$ = $1; $1.push($3); } 
            | typedargslist COMMA NEWLINE tfpdef
              { $$ = $1; $1.push($4); } 
            ;

tfpdef: NAME 
       { $$ = ['FUNC_ARG',{},$1]; } 
      | NAME COLON test
       { $$ = ['FUNC_ARG',{},$1, $3]; } 
      ;

varargslist: vfpdef 
          | vfpdef ASSIGN test
          | varargslist COMMA vfpdef
          | varargslist COMMA vfpdef ASSIGN test
          ;

vfpdef: NAME
      ;

stmt: simple_stmt 
      | compound_stmt 
      | newlines
       { $$ = ['NOOP'];}
     ;

stmts: stmt
       {$$ = ['STATEMENTS',{}, $1]; }
     | stmts stmt
       {$$ = $1; $1.push($2); }
    ;

newlines: NEWLINE
       | newlines NEWLINE
       ;

line_end : newlines
       | SEMICOLON newlines
       | ENDMARKER 
         {  yy.lexer.unput(yy.lexer.yytext.charAt(0)) ; /* yy.lexer.next(); */  
           $$ = ['NOOP'];}
     ;

simple_stmt: small_stmts line_end
      ;

small_stmts:  small_stmt 
          {$$ = $1; }
       | small_stmts SEMICOLON small_stmt 
          %{if ($1[0] == 'STATEMENTS') { $$ = $1; $1.push($3);}
           else { $$ = ['STATEMENTS',{},$1,$3];} %}
      ;
            
small_stmt: expr_stmt 
           | with_stmt 
           | del_stmt 
           | pass_stmt 
           | flow_stmt 
           | print_stmt 
      ;

/*
          | import_stmt 
          | global_stmt 
           | nonlocal_stmt 
           | assert_stmt
 */


expr_stmt: testlist_star_expr
         | testlist_star_expr augassign testlist
          { $$ = ['ASSIGN_EXPR',{},$1,$2,$3]; } 
         | testlist_star_expr augassign yield_expr
          { $$ = ['ASSIGN_EXPR',{},$1,$2,$3]; } 
         | testlist_star_expr assignment yield_expr
          { $$ = ['ASSIGN_EXPR',{},$1,$2,$3]; } 
         | testlist_star_expr assignment testlist_star_expr
          { $$ = ['ASSIGN_EXPR',{},$1,$2,$3]; } 
         ;

testlist_star_expr: test
         | testlist_star_expr COMMA test
            { $$ = ['LIST_EXPR',{},$1,$3]; } 
          ;
/*
//             |star_expr
//             | testlist_star COMMA star_expr
 */

assignment: ASSIGN
            { $$ = ['ASSIGN',{},$1]; } 
          | ASSIGN2
            { $$ = ['ASSIGN',{},$1]; } 
          ;

augassign:  INCR
            { $$ = ['ASSIGN',{},'+=']; } 
           | DECR
            { $$ = ['ASSIGN',{},'-=']; } 
           | APPEND
            { $$ = ['ASSIGN',{},'APPEND']; } 
           | ENTRYREWRITE
            { $$ = ['ASSIGN',{},'ENTRYREWRITE']; } 
           | SOMETHING
            { $$ = ['ASSIGN',{},$1]; } 
           | '+=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '-=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '*=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '/=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '%=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '&=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '|=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '^=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '<<=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '>>=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '**=' 
            { $$ = ['ASSIGN',{},$1]; } 
           | '//='
            { $$ = ['ASSIGN',{},$1]; } 
           ;

// For normal assignments, additional restrictions enforced by the interpreter
del_stmt: DEL exprlist
          { $$ = ['DEL_EXPR',{},$2]; }
          ;

print_stmt: PRINT exprlist
          { $$ = ['PRINT_EXPR',{},$2]; }
          ;

pass_stmt: PASS
          { $$ = ['PASS_EXPR',{}]; }
          ;

flow_stmt: break_stmt 
          | continue_stmt 
          | return_stmt 
          | yield_stmt
          ;
//          | raise_stmt 

break_stmt: BREAK
          { $$ = ['BREAK_EXPR',{}]; }
          ;

continue_stmt: NEXT
          { $$ = ['NEXT_EXPR',{}]; }
          ;

return_stmt: RETURN 
          { $$ = ['RETURN_EXPR',{}]; }
          | RETURN testlist
          { $$ = ['RETURN_EXPR',{},$2]; }
          ;

yield_stmt: yield_expr
          { $$ = ['YIELD_EXPR',{},$1]; }
          ;

/*
raise_stmt: 'raise' [test [FROM test]]
import_stmt: import_name | import_from
import_name: 'import' dotted_as_names
# note below: the ('.' | ELLIPSIS) is necessary because ELLIPSIS is tokenized as ELLIPSIS
import_from: (FROM (('.' | ELLIPSIS)* dotted_name | ('.' | ELLIPSIS)+)
              'import' ('*' | LPAREN import_as_names RPAREN | import_as_names))
import_as_name: NAME [AS NAME]
dotted_as_name: dotted_name [AS NAME]
import_as_names: import_as_name (COMMA import_as_name)* [COMMA]
dotted_as_names: dotted_as_name (COMMA dotted_as_name)*
 */

dotted_name: NAME 
             {$$ = ['NAME',{},$1]; }
           | dotted_name dot_name
              { $$ = $1; $1.push($2[2]); /* discard extra */ }
           ;

dot_name: DOT NAME
          { $$ = ['DOTNAME',{}, $2]; }
        ;

/*
global_stmt: 'global' NAME (COMMA NAME)*
nonlocal_stmt: 'nonlocal' NAME (COMMA NAME)*
assert_stmt: 'assert' test [COMMA test]
 */

compound_stmt: if_stmt 
            | while_stmt 
            | loop_stmt 
            | do_stmt 
            | repeat_stmt 
            | for_stmt 
            | funcdef 
            ;
//            | try_stmt 
//            | decorated
//            | classdef 

if_stmt: IF LPAREN test RPAREN  suite 
          { $$ = ['IF_EXPR',{},$3,$5]; }
        | if_stmt ELSE IF LPAREN test RPAREN  suite
          { $$ = $1; $1.push(['ELSIF_EXPR',{},$5,$7]); }
        | if_stmt ELSE suite
          { $$ = $1; $1.push(['ELSE_EXPR',{},$3]); }
        ;

while_stmt: WHILE test suite 
           { $$ = ['WHILE_EXPR',{},$2,$3]; }
        | while_stmt ELSE suite
           { $$ = $1; $1.push(['ELSE_EXPR',{},$3]); }
        ;

repeat_stmt: REPEAT  suite 
           { $$ = ['REPEAT_EXPR',{},$2]; }
        ;

for_stmt: FOR exprlist IN testlist suite 
           { $$ = ['FOR_EXPR',{},$2,$4,$5]; }
        | for_stmt ELSE suite
           { $$ = $1; $1.push(['ELSE_EXPR',{},$3]); }
        ;


loop_stmt: LOOP NAME AS testlist suite 
           { $$ = ['LOOP_EXPR',{},['NAME',{},$2], $4,$5]; }
        |  LOOP NAME AS testlist loop_cond suite 
           { $$ = ['LOOP_EXPR',{},['NAME',{},$2], $4,$6,$5]; }
        ;

do_stmt: DO NAME ASSIGN expr COMMA expr suite 
           { $$ = ['DO_EXPR',{},['NAME',{},$2], $4,$6,$7]; }
        |  DO NAME ASSIGN expr COMMA expr COMMA expr suite 
           { $$ = ['DO_EXPR',{},['NAME',{},$2], $4,$6,$8,$9]; }
        ;

loop_cond: COLON NAME
          { $$ = ['LOOP_COND_EXPR',{},['NAME',{},$2]]; }
        | COLON NAME comp_op NAME
          { $$ = ['LOOP_COND_EXPR',{},['NAME',{},$2],$3,['NAME',{},$4]]; }
        ;

/*
try_stmt: ('try' COLON suite
           ((except_clause COLON suite)+
            ['else' COLON suite]
            ['finally' COLON suite] |
           'finally' COLON suite))
 */


with_stmt: WITH NAME AS NAME
           { $$ = ['WITH_EXPR',{},$2,$4]; }
          ;

/*
with_item: test 
          | with_item 'as' expr
          ;
 */

//# NB compil.c makes sure that the default except clause is last
/*
except_clause: 'except' [test ['as' NAME]]
 */
/*
DEDENT: SEMICOLON 
      | NEWLINE
      ;
 */

suite: NEWLINE small_stmt NEWLINE
       {$$ = ['STATEMENTS',{}, $2]; }
       | small_stmt NEWLINE
       {$$ = ['STATEMENTS',{}, $1]; }
       | suite_begin stmts suite_end
         { $$ = $2; }
       ;

suite_begin: LBRACE
         | LBRACE newlines
         | newlines LBRACE
         | newlines LBRACE newlines
         ;

suite_end: RBRACE
         | newlines RBRACE
         | suite_end NEWLINE
         ;


test: or_test 
       | test IF or_test ELSE test 
         { $$ = ['INLINE_IF_EXPR', {},$3,$1,$5]; }
       | lambdef
       ;


test_nocond: or_test 
        | lambdef_nocond
       ;


lambdef: LAMBDA varargslist COLON test
       ;

lambdef_nocond: 
          LAMBDA COLON test_nocond
        | LAMBDA varargslist COLON test_nocond
        ;

or_test: and_test 
        | or_test OR and_test
          {$$ = ['MATHOP_EXPR',{},$1,'OR', $3]; }
        ;

and_test: not_test 
        | and_test AND not_test
          {$$ = ['MATHOP_EXPR',{},$1,'AND', $3]; }
        ;

not_test: NOT not_test 
          {$$ = ['MATHOP_EXPR',{},$1,'NOT', $2]; }
        | comparison
        ;

comparison: expr 
        | comparison comp_op expr
          {$$ = ['COMP_EXPR',{},$1,$2,$3]; }
        ;
          

// <> isn't actually a valid comparison operator in Python. It's here for the
// sake of a __future__ import described in PEP 401
//         { $$ = $1; }

comp_op: LESS|GREATER|EQUALITY|GREATEQUAL|LESSEQUAL|'<>'|NOTEQUAL
       |IS
         { $$ = 'IS'; }
       |IN
         { $$ = 'IN'; }
       |NOT IN
         { $$ = 'NOTIN'; }
       |IS NOT
         { $$ = 'ISNOT'; }
        ;

star_expr: TIMES expr
       {$$ = ['STAR_EXPR',{},$2]; }
    ;

expr: xor_expr 
     | expr BITOR  xor_expr
       {$$ = ['MATHOP_EXPR',{},$1,'BITOR', $3]; }
    ;

xor_expr: and_expr 
     | xor_expr XOR and_expr
       {$$ = ['MATHOP_EXPR',{},$1,'XOR', $3]; }
     ;

and_expr: shift_expr 
     | and_expr BITAND shift_expr
       {$$ = ['MATHOP_EXPR',{},$1,'BITAND', $3]; }
     ;

shift_expr: arith_expr 
     | shift_expr LSHIFT arith_expr
       {$$ = ['MATHOP_EXPR',{},$1,'LSHIFT', $3]; }
     | shift_expr RSHIFT arith_expr
       {$$ = ['MATHOP_EXPR',{},$1,'RSHIFT', $3]; }
     ;

arith_expr: term 
     | arith_expr PLUS term
       {$$ = ['MATHOP_EXPR',{},$1,'PLUS', $3]; }
     | arith_expr MINUS term
       {$$ = ['MATHOP_EXPR',{},$1,'MINUS', $3]; }
     | arith_expr PLUS newlines term
       {$$ = ['MATHOP_EXPR',{},$1,'PLUS', $4]; }
     | arith_expr MINUS newlines term
       {$$ = ['MATHOP_EXPR',{},$1,'MINUS', $4]; }
     ;
/*
     | arith_expr arith_op term
       {$$ = ['MATHOP_EXPR',{}, $1, $2, $3]; }
     ;
 */

arith_op: PLUS
       {$$ = 'PLUS'; }
      | newlines PLUS
       {$$ = 'PLUS'; }
      | PLUS newlines 
       {$$ = 'PLUS'; }
      | MINUS
       {$$ = 'MINUS'; }
      | newlines MINUS
       {$$ = 'MINUS'; }
      | PLUS newlines 
       {$$ = 'MINUS'; }
     ;


term: factor 
     | term TIMES factor
       {$$ = ['MATHOP_EXPR',{},$1,'TIMES', $3]; }
     | term DIV factor 
       {$$ = ['MATHOP_EXPR',{},$1,'DIV', $3]; }
     | term MOD factor 
       {$$ = ['MATHOP_EXPR',{},$1,'MOD', $3]; }
     | term '//' factor
       {$$ = ['MATHOP_EXPR',{},$1,'DIVDIV', $3]; }
     | term TIMES newlines factor
       {$$ = ['MATHOP_EXPR',{},$1,'TIMES', $4]; }
     | term DIV newlines factor 
       {$$ = ['MATHOP_EXPR',{},$1,'DIV', $4]; }
     | term MOD newlines factor 
       {$$ = ['MATHOP_EXPR',{},$1,'MOD', $4]; }
     | term '//' newlines factor
       {$$ = ['MATHOP_EXPR',{},$1,'DIVDIV', $4]; }
     ;

factor: power
      | PLUS factor 
       {$$ = ['MATHOP_EXPR',{},$1,'POS', $2]; }
      | MINUS factor 
       {$$ = ['MATHOP_EXPR',{},$1,'NEG', $2]; }
      | '~' factor 
       {$$ = ['MATHOP_EXPR',{},$1,'INVERT']; }
      ;

power: atom 
      | power trailer
       %{ if ($2[0] == 'METHOD_CALL_ARG') { $$ = ['FUNCTION_CALL',{},$1,$2]; }
          else if ($2[0] == 'SUBSCRIPT_EXPR') { $$ = ['SUBSCRIPT',{},$1,$2];}
          else { $$ = ['OBJ_PROP',{},$1,$2];}
        %}
      | power POW factor
       {$$ = ['MATHOP_EXPR',{},$1,'POW', $3]; }
      ;

atom: LPAREN yield_expr RPAREN 
        {$$ = $2; }
      | LPAREN testlist_comp RPAREN
        {$$ = $2; /* ['TUPLE',{}].concat($2.slice(2)); */ }
      | LSQB testlist_comp RSQB
        {$$ = ['LIST_EXPR',{}].concat($2.slice(2)); }
      | LBRACE dictorsetmaker RBRACE
        {$$ = $2; /* dict */ }
      | BACKTICK testlist BACKTICK
        {$$ = ['BACKTICK_EXPR',{}, $2] ; /*python 2.x - convert args to string*/ }
      | dotted_name 
      | dot_name 
     | INT
       { $$ = ['INT', {},$1]; }
     | INT CMPLX
       { $$ = ['COMPLEX_INT', {},$1]; }
     | OCTAL
       { $$ = ['OCTAL', {}, $1]; }
     | HEX
       { $$ = ['HEX', {}, $1]; }
     | LONG
       { $$ = ['LONG', {}, $1]; }
     | FLOAT
       { $$ = ['FLOAT', {}, $1]; }
     | FLOAT CMPLX
       { $$ = ['COMPLEX_FLOAT', {}, $1]; }
      | string 
       { $$ = ['STRING', {},$1]; }
      | ELLIPSIS 
       { $$ = ['ELLIPSIS', {}]; }
      | NONE
       { $$ = ['NONE', {}]; }
      | TRUE
       { $$ = ['TRUE', {}]; }
      | FALSE
       { $$ = ['FALSE', {}]; }
      ;

testlist_comp: test_star  
             {  $$ = $1; }
          | newlines test_star 
             { $$ = $2; }
          | test_star comp_for 
             { $$ = ['TESTLIST',{},$1,$2]; }
          | testlist_comp COMMA test_star
            %{ if ($1[0] == 'TESTLIST') { $$=$1; $$.push($3); }
               else { $$ = ['TESTLIST',{},$1,$3]; }   %}
          | testlist_comp COMMA NEWLINE test_star
            %{ if ($1[0] == 'TESTLIST') { $$=$1; $$.push($4); }
               else { $$ = ['TESTLIST',{},$1,$4]; }   %}
          | testlist_comp  COMMA 
            %{ if ($1[0] == 'TESTLIST') { $$=$1; }
               else { $$ = ['TESTLIST',{},$1]; }   %}
         ;
/*
 
          | test_star comp_for 
          | testlist_comp COMMA test_star
            %{ if ($1[0] == 'TESTLIST') { $$=$1; $$.push($3); }
               else { $$ = ['TESTLIST',{},$1,$3]; }   %}
          | testlist_comp COMMA NEWLINE test_star
            %{ if ($1[0] == 'TESTLIST') { $$=$1; $$.push($3); }
               else { $$ = ['TESTLIST',{},$1,$3]; }   %}
          | testlist_comp  COMMA 
            %{ if ($1[0] == 'TESTLIST') { $$=$1; }
               else { $$ = ['TESTLIST',{},$1]; }   %}
 */

test_star : test
         | star_expr
        ;

trailer: LPAREN arglist RPAREN
          { $$ = ['METHOD_CALL_ARG',{},$2]; }
        | LSQB subscriptlist RSQB
          { $$ = ['SUBSCRIPT_EXPR',{},$2]; }
        | dot_name
          { $$ = ['DOT_ID_EXPR',{},$1]; }
       ;

subscriptlist: subscript 
        | subscriptlist COMMA subscript
          { if ($1[0]!='SUBSCRIPTLIST') $$ = ['SUBSCRIPTLIST',{}, $1]; 
            else $$ = $1; 
            $$.push($3); }
        | subscriptlist COMMA 
          { if ($1[0]!='SUBSCRIPTLIST') $$ = ['SUBSCRIPTLIST',{}, $1]; 
            else $$ = $1; 
            $$.push(null); }
       ;

subscript: test 
        | COLON
          { $$ = ['RANGE_EXPR',{},0]; }
        | test COLON test
          { $$ = ['RANGE_EXPR',{},$1,$3]; }
        | test COLON test sliceop
          { $$ = ['RANGE_EXPR',{},$1,$3,$4]; }
       ;

sliceop: COLON 
          { $$ = ['SLICEOP',{}]; }
        | COLON test
          { $$ = ['SLICEOP',{},$2]; }
        ;

exprlist: expr 
         | star_expr 
         | exprlist COMMA expr
            %{if ($1[0] == 'EXPRLIST') { $$ = $1; $1.push($3);}
              else { $$ = ['EXPRLIST',{},$1,$3];} %}
         | exprlist COMMA star_expr
            %{if ($1[0] == 'EXPRLIST') { $$ = $1; $1.push($3);}
              else { $$ = ['EXPRLIST',{},$1,$3];} %}
         | exprlist COMMA
            %{if ($1[0] == 'EXPRLIST') { $$ = $1; $1.push($3);}
              else { $$ = ['EXPRLIST',{},$1];} %}
         ;

testlist: test 
         | testlist COMMA test 
            %{ if ($1[0] == 'TESTLIST') { $$=$1; $$.push($3); }
              else { $$ = ['TESTLIST',{},$1,$3]; }   %}
         | testlist COMMA 
            %{ if ($1[0] == 'TESTLIST') { $$=$1;}
              else { $$ = ['TESTLIST',{},$1]; }   %}
        ;

dictorsetmaker:  test COLON test 
                 { $$ = { }; $$[$1] = $3; }
              | dictorsetmaker COMMA test COLON test 
                 { $$ = $1;  $1[$3] = $4; }
             ;

/*
classdef: 'class' NAME [LPAREN [arglist] RPAREN] COLON suite
 */

arglist: 
          {$$ = ['ARGLIST',{} ]; }
        | argument 
          {$$ = ['ARGLIST',{} ,$1]; }
        | arglist COMMA argument
          {$$ = $1; $1.push($3); }
        | arglist COMMA newlines argument
          {$$ = $1; $1.push($4); }
        ;
/*
  The reason that keywords are test nodes instead of NAME is that using NAME
  results in an ambiguity. ast.c makes sure it's a NAME.
 */

//            # Really [keyword ASSIGN] test  
argument: test 
        | test comp_for
          {$$ = ['COMP_FOR_TEST_ARG',{}, $1,$2]; }
        | test assignment test 
          { $$ = ['ASSIGN_EXPR',{},$1,$2,$3]; } 
        ;

comp_iter: comp_for 
        | comp_if
        ;

comp_for: FOR exprlist IN or_test 
        | comp_for comp_iter
        ;

comp_if: IF test_nocond 
        | comp_if comp_iter
       ;

/*
# not used in grammar, but may appear in "node" passed from Parser to Compiler
encoding_decl: NAME
 */

yield_expr: YIELD
          | YIELD yield_arg
          ;

yield_arg: FROM test 
          | FROM testlist
         ;

string      : TS_quote TS_quote_string TS_quote
              { $$ = $2; }
            | TD_quote TD_quote_string TD_quote
              { $$ = $2; }
            | D_quote D_quote_string D_quote
              { $$ = $2; }
            | S_quote S_quote_string S_quote
              { $$ = $2; }
            ;

