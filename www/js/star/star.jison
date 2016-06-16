/* Description: Parses STAR format text files */

/*ASCII 32 09 11*/
/*ASCII 10 13 13&10 12*/


/* lexical grammar */
/* note that the order of these token matching rules is important 
   because more explicit matching tokens should be tested
   before less explicit ones  
<comment>"\r\n"|\n|\r|\f       {
                                 this.popState();  
                                 return 'terminal'; 
                               }
 */

%lex

%x comment dquote squote bracketed semicol label tsquote tdquote composite
%x cdquote csquote

%%

'#'                            {
                                 this.begin('comment');  
                                 // console.log("hash");  
                                 return 'hash';
                               }
<composite>("\r\n"|\n|\r|\f)   /* ignore these terminators */
<comment>[^\n\r\f]+            {
                              //    console.log("comment: "+yytext); 
                                 return 'non_terminal';
                               }
<comment>("\r\n"|\n|\r|\f)/($|[^;]) {
                                 this.popState();  
                               }
<comment>("\r\n"|\n|\r|\f)[;] {  // comment before newline semicolon 
                              // this didn't work with 1 char lookahead
                                 this.popState();  
                              //   console.log("push-back " + yytext.length +
                              //       " chars >"+escape(yytext)+"<"); 
                                 this.unput(yytext);
                               }
[\n\r\f][;]                    {
                                 this.begin('semicol');
                               //   console.log("<<semicol"); 
                                 return 'semi_colon';
                               }
<semicol>[\n\r\f][;]           {
                                 this.popState(); 
                              //    console.log(">>quoteSC"); 
                                 return 'semi_colon';
                               }
<semicol>([^\n\r\f]|[\n\r\f]/![;])*  {
                               //   console.log("== SC quoted string:" + yytext); 
                                 return 'SC_quoted_string';
                               }
("\r\n"|\n|\r|\f)/($|[^;])   {  // lookahead match $=EOF or not colon 
                                //  console.log("term"); 
                               }
<<EOF>>                        { 
                                 // console.log("eof"); 
                                 return 'EOF';
                               }

_[^\s]+/\s               {
                                //  console.log("tag:" + yytext);
                                 return 'tag_name';
                               }
[ \t\v]+                       { /* empty */
                                 // console.log("blank"); 
                                 // return 'blank'; 
                               }
[gG][lL][oO][bB][aA][lL]_      { 
                                 // console.log("glob"); 
                                 return 'GLOBAL_';
                               }
[dD][aA][tT][aA]_/[^\s]        { 
                                 // console.log("data");
                                 this.begin("label");
                                 return 'DATA_';
                               }
<label>\S+                 {
                                this.popState();
                                 //console.log("label_ " + yytext);
                                 return 'LABEL_';
                               }
[sS][aA][vV][eE]_/[\s]       {
                                 return 'EVAS_';
                               }
[sS][aA][vV][eE]_/[^\s]       {
                                 this.begin("label");
                                 return 'SAVE_';
                               }
[lL][oO][oO][pP]_           {
                              //    console.log("loop_"); 
                                 return 'LOOP_';
                               }
[sS][tT][oO][pP]_              {
                                 this.popState(); 
                                 return 'STOP_';
                               }


<INITIAL,composite>"'''"       {
                                 this.begin('tsquote'); 
                               //   console.log("tsquote"); 
                                 return 'TS_quote';
                               }
<tsquote>([^']|([']/!(\'\')))+   {
                                 return 'TS_quote_string';
                               }
<tsquote>"'''"                {
                                 this.popState(); 
                                //  console.log("tsquote"); 
                                 return 'TS_quote';
                               }
<INITIAL,composite>'"""'                          {
                                 this.begin('tdquote'); 
                               //   console.log("tdquote"); 
                                 return 'TD_quote';
                               }
<tdquote>([^"]|(["]/!(["]["])))+   {
                                 return 'TD_quote_string';
                               }
<tdquote>'"""'                 {
                                 this.popState(); 
                                  //console.log("tdquote"); 
                                 return 'TD_quote';
                               }
<INITIAL>'"'        {
                                 this.begin('dquote'); 
                                  //console.log("dquote"); 
                                 return 'D_quote';
                               }
<dquote>["]/[\s]               {
                                 this.popState(); 
                                  //console.log("pop dquote"); 
                                 return 'D_quote'; 
                               }
<dquote>(\\\"|[^"]|["]/[^\s])*/["]       { 
                                 return 'D_quote_string'; 
                               }
<composite>["]               {
                                 this.begin('cdquote'); 
                                  //console.log("cdquote"); 
                                 return 'CD_quote';
                              }
<cdquote>(\\\"|[^"])+/["]      { 
                                 return 'CD_quote_string'; 
                               }
<cdquote>["]                 {
                                 this.popState(); 
                                  //console.log("pop cdquote"); 
                                 return 'CD_quote';
                               }


<INITIAL>[']                            {
                                 this.begin('squote');
                                  //console.log("squote"); 
                                 return 'S_quote';
                               }
<squote>[']/[\s]               {
                                 this.popState(); 
                                  //console.log("pop squote"); 
                                 return 'S_quote'; 
                               }
<squote>(\\\'|[^']|[']/[^\s])*/[']       { 
                                 // <squote>(\\\'|[^'])*/[']      
                                 return 'S_quote_string'; 
                               }

<composite>[']               {
                                 this.begin('csquote'); 
                                  //console.log("csquote"); 
                                 return 'CS_quote';
                              }
<csquote>(\\\'|[^'])+/[']      { 
                                 return 'CS_quote_string'; 
                               }
<csquote>[']                 {
                                 this.popState(); 
                                  //console.log("pop csquote"); 
                                 return 'CS_quote';
                               }
<INITIAL,composite>'['        {
                                 this.begin('composite'); 
                                 // console.log("COMPOSITE"); 
                                 return 'LSQB';
                               }
<composite>[\s]+      { /* ignore */ }
<composite>']'                 {
                                 this.popState(); 
                                 // console.log(" end COMPOSITE"); 
                                 return 'RSQB';
                               }
<INITIAL,composite>'{'        {
                                 this.begin('composite'); 
                                 return 'LBRACE';
                               }
<composite>','                 { return 'COMMA'; }
<composite>':'                 { return 'COLON'; }

<composite>'}'                 {
                                 this.popState(); 
                                 return 'RBRACE';
                               }


'$'                            {
                                 return 'DOLLAR';
                               }

<composite>[^\]}\s,:]+/[\s:,\]}]    {
                               //   console.log("unquote"); 
                                 return 'unquoted_string'; 
                               }

[^\s]+/[\s]                   {
                                //  console.log("unquote"); 
                                 return 'unquoted_string'; 
                               }

/lex


/* operator associations and precedence */

%start STAR_file

/* ignore conflict report for generated state 12 */

%% /* language grammar */

STAR_file             :  /* empty */ 
                        { yy.observer.startDocument(); }
                      | STAR_file data_blocks EOF
                        { yy.observer.endDocument(); }
                      ;

data_blocks           : comments
                         { yy.observer.comment($1); }
                      | data_block  
                        { yy.observer.startElement($1[0],$1[1]); }
                      | data_blocks data
                      | data_blocks data_block 
                        { 
                          yy.observer.endBlock();
                          yy.observer.startElement($2[0],$2[1]); 
                        }
                      ;

data_block           : GLOBAL_
                        { $$ = ['global_',null]; }
                      | DATA_ LABEL_
                        { $$ = ['data_',$2]; }
                      ;

data                  : data_chunk
                      | data data_chunk
                      ;

data_chunk            : data_value_pair
                      | data_loop
                      | SAVE_ LABEL_
                        { yy.observer.startElement('save_',$2); }
                      | EVAS_ 
                        { yy.observer.endElement('save_'); } 
                      | comments
                         { yy.observer.comment($1); }
                      ;


data_value_pair      : 
                       tag_name string_value_1 
                        { yy.observer.startElement($1,[]);
                          yy.observer.characters($2);
                          yy.observer.endElement($1);
                        }
                      | tag_name  comments  string_value_1 
                        { yy.observer.startElement($1,[]);
                          yy.observer.comment($2);
                          yy.observer.characters($3);
                          yy.observer.endElement($1);
                        }
                      | tag_name string_value_2 
                        { yy.observer.startElement($1,[]);
                          yy.observer.characters($2);
                          yy.observer.endElement($1);
                        }
                      | tag_name comments string_value_2 
                        { yy.observer.startElement($1,[]);
                          yy.observer.comment($2);
                          yy.observer.characters($3);
                          yy.observer.endElement($1);
                        }
                      | tag_name composite 
                        { yy.observer.startElement($1,[]);
                          yy.observer.composite($2);
                          yy.observer.endElement($1);
                        }
                      | tag_name comments composite 
                        { yy.observer.startElement($1,[]);
                          yy.observer.comment($2);
                          yy.observer.composite($3);
                          yy.observer.endElement($1);
                        }
                      ;

string_value_1          : unquoted_string
                          { $$ = $1; }
                        | TS_quote TS_quote_string TS_quote
                          { $$ = $2; }
                        | TD_quote TD_quote_string TD_quote
                          { $$ = $2; }
                        | D_quote D_quote_string D_quote 
                          { $$ = $2; }
                        | S_quote S_quote_string S_quote 
                          { $$ = $2; }
                      ;

string_value_2        : semi_colon SC_quoted_string semi_colon
                          { $$ = $2; }
                      | semi_colon semi_colon
                          { $$ = '';  /* Empty string */ }
                      ;  

composite_string_value  : unquoted_string
                          { $$ = $1; }
                        | TS_quote TS_quote_string TS_quote
                          { $$ = $2; }
                        | TD_quote TD_quote_string TD_quote
                          { $$ = $2; }
                        | CD_quote CD_quote_string CD_quote 
                          { $$ = $2; }
                        | CS_quote CS_quote_string CS_quote 
                          { $$ = $2; }
                      ;

composite             : dict
                          { $$ = $1; }
                      | array
                          { $$ = $1; }
                      ;

expression            : composite
                      | composite_string_value 
                      ;
                  

data_loop             : LOOP_ data_loop_fields  
                        { yy.observer.startElement('loop_',$2);
                         // yy.observer.startElement('tags_',$2);
                         // yy.observer.endElement('tags_');
                        }
                      | LOOP_ comments data_loop_fields  
                        { 
                          $3.unshift($2);
                          yy.observer.startElement('loop_',$3);
                         // yy.observer.comment($2);
                         // yy.observer.startElement('tags_',$3);
                         // yy.observer.endElement('tags_');
                        }
                      | data_loop comments
                         { yy.observer.comment($2); }
                      | data_loop string_value_1
                         { yy.observer.characters($2); 
                          //console.log("string1 " + $2);
                           }
                      | data_loop string_value_2
                         { yy.observer.characters($2);
                          //console.log("string2 " + $2);
                           }
                      | data_loop composite
                         { yy.observer.composite($2);
                          //console.log("composite " + $2);
                            }
                      ;


data_loop_fields      : tag_name 
                          { $$=[$1]; }
                        | data_loop_fields  comments
                          { $$=$1; if (typeof $2 !='string') {$1.push($2);}  }
                        | data_loop_fields tag_name
                          { $$=$1;  $1.push($2); } 
                      ;
/*
data_loop_value      : string_value_1
                          { yy.observer.characters($1); }
                      | string_value_2
                          { yy.observer.characters($1); }
                      | data_loop_values comments 
                          { yy.observer.comment($2); }
                      | data_loop_values string_value_1
                          { yy.observer.characters($2); }
                      | data_loop_values string_value_2 
                          { yy.observer.characters($2); }
                      ;
 */

comments              : comment
                        {$$ = [$1];}
                      | comments comment
                        {$$ = $1.concat($2); }
                      ;

comment               : hash non_terminal 
                        { $$ = $2; }
                      | hash 
                        { $$ = ''; }
                      ;



dict                : LBRACE RBRACE
                       { $$ = { }; }
                    | LBRACE property_list RBRACE
                       { $$ = $2; }
                    | LBRACE property_list COMMA RBRACE
                       { $$ = $2; }
                    ;

property_list       : property
                       { $$ = {};  $$[ $property[0]] = $property[1] ; }
                    | property_list COMMA property
                       { $$ = $1; $1[ $property[0] ] = $property[1]; }
                    ;
                       
property            : composite_string_value COLON expression
                      { $$ = [$1, $3]; }
                    ;


array               : LSQB RSQB
                        { $$ = [];  }
                      | LSQB array_list RSQB
                        { $$ = $2; }
                      | LSQB array_list COMMA RSQB
                        { $$ = $2; $$.push(); }
                    ;

array_list          : expression
                       { $$ = [ $1 ]; }
                    | array_list expression
                       { $$ = $1; $1.push($2); }
                    | array_list COMMA expression
                       { $$ = $1; $1.push($3); }
                    ;

