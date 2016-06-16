/* Jison generated parser */
var star = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"STAR_file":3,"data_blocks":4,"EOF":5,"comments":6,"data_block":7,"data":8,"GLOBAL_":9,"DATA_":10,"LABEL_":11,"data_chunk":12,"data_value_pair":13,"data_loop":14,"SAVE_":15,"EVAS_":16,"tag_name":17,"string_value_1":18,"string_value_2":19,"composite":20,"unquoted_string":21,"TS_quote":22,"TS_quote_string":23,"TD_quote":24,"TD_quote_string":25,"D_quote":26,"D_quote_string":27,"S_quote":28,"S_quote_string":29,"semi_colon":30,"SC_quoted_string":31,"composite_string_value":32,"CD_quote":33,"CD_quote_string":34,"CS_quote":35,"CS_quote_string":36,"dict":37,"array":38,"expression":39,"LOOP_":40,"data_loop_fields":41,"comment":42,"hash":43,"non_terminal":44,"LBRACE":45,"RBRACE":46,"property_list":47,"COMMA":48,"property":49,"COLON":50,"LSQB":51,"RSQB":52,"array_list":53,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",9:"GLOBAL_",10:"DATA_",11:"LABEL_",15:"SAVE_",16:"EVAS_",17:"tag_name",21:"unquoted_string",22:"TS_quote",23:"TS_quote_string",24:"TD_quote",25:"TD_quote_string",26:"D_quote",27:"D_quote_string",28:"S_quote",29:"S_quote_string",30:"semi_colon",31:"SC_quoted_string",33:"CD_quote",34:"CD_quote_string",35:"CS_quote",36:"CS_quote_string",40:"LOOP_",43:"hash",44:"non_terminal",45:"LBRACE",46:"RBRACE",48:"COMMA",50:"COLON",51:"LSQB",52:"RSQB"},
productions_: [0,[3,0],[3,3],[4,1],[4,1],[4,2],[4,2],[7,1],[7,2],[8,1],[8,2],[12,1],[12,1],[12,2],[12,1],[12,1],[13,2],[13,3],[13,2],[13,3],[13,2],[13,3],[18,1],[18,3],[18,3],[18,3],[18,3],[19,3],[19,2],[32,1],[32,3],[32,3],[32,3],[32,3],[20,1],[20,1],[39,1],[39,1],[14,2],[14,3],[14,2],[14,2],[14,2],[14,2],[41,1],[41,2],[41,2],[6,1],[6,2],[42,2],[42,1],[37,2],[37,3],[37,4],[47,1],[47,3],[49,3],[38,2],[38,3],[38,4],[53,1],[53,2],[53,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: yy.observer.startDocument(); 
break;
case 2: yy.observer.endDocument(); 
break;
case 3: yy.observer.comment($$[$0]); 
break;
case 4: yy.observer.startElement($$[$0][0],$$[$0][1]); 
break;
case 6: 
                          yy.observer.endBlock();
                          yy.observer.startElement($$[$0][0],$$[$0][1]); 
                        
break;
case 7: this.$ = ['global_',null]; 
break;
case 8: this.$ = ['data_',$$[$0]]; 
break;
case 13: yy.observer.startElement('save_',$$[$0]); 
break;
case 14: yy.observer.endElement('save_'); 
break;
case 15: yy.observer.comment($$[$0]); 
break;
case 16: yy.observer.startElement($$[$0-1],[]);
                          yy.observer.characters($$[$0]);
                          yy.observer.endElement($$[$0-1]);
                        
break;
case 17: yy.observer.startElement($$[$0-2],[]);
                          yy.observer.comment($$[$0-1]);
                          yy.observer.characters($$[$0]);
                          yy.observer.endElement($$[$0-2]);
                        
break;
case 18: yy.observer.startElement($$[$0-1],[]);
                          yy.observer.characters($$[$0]);
                          yy.observer.endElement($$[$0-1]);
                        
break;
case 19: yy.observer.startElement($$[$0-2],[]);
                          yy.observer.comment($$[$0-1]);
                          yy.observer.characters($$[$0]);
                          yy.observer.endElement($$[$0-2]);
                        
break;
case 20: yy.observer.startElement($$[$0-1],[]);
                          yy.observer.composite($$[$0]);
                          yy.observer.endElement($$[$0-1]);
                        
break;
case 21: yy.observer.startElement($$[$0-2],[]);
                          yy.observer.comment($$[$0-1]);
                          yy.observer.composite($$[$0]);
                          yy.observer.endElement($$[$0-2]);
                        
break;
case 22: this.$ = $$[$0]; 
break;
case 23: this.$ = $$[$0-1]; 
break;
case 24: this.$ = $$[$0-1]; 
break;
case 25: this.$ = $$[$0-1]; 
break;
case 26: this.$ = $$[$0-1]; 
break;
case 27: this.$ = $$[$0-1]; 
break;
case 28: this.$ = '';  /* Empty string */ 
break;
case 29: this.$ = $$[$0]; 
break;
case 30: this.$ = $$[$0-1]; 
break;
case 31: this.$ = $$[$0-1]; 
break;
case 32: this.$ = $$[$0-1]; 
break;
case 33: this.$ = $$[$0-1]; 
break;
case 34: this.$ = $$[$0]; 
break;
case 35: this.$ = $$[$0]; 
break;
case 38: yy.observer.startElement('loop_',$$[$0]);
                         // yy.observer.startElement('tags_',$$[$0]);
                         // yy.observer.endElement('tags_');
                        
break;
case 39: 
                          $$[$0].unshift($$[$0-1]);
                          yy.observer.startElement('loop_',$$[$0]);
                         // yy.observer.comment($$[$0-1]);
                         // yy.observer.startElement('tags_',$$[$0]);
                         // yy.observer.endElement('tags_');
                        
break;
case 40: yy.observer.comment($$[$0]); 
break;
case 41: yy.observer.characters($$[$0]); 
                          //console.log("string1 " + $$[$0]);
                           
break;
case 42: yy.observer.characters($$[$0]);
                          //console.log("string2 " + $$[$0]);
                           
break;
case 43: yy.observer.composite($$[$0]);
                          //console.log("composite " + $$[$0]);
                            
break;
case 44: this.$=[$$[$0]]; 
break;
case 45: this.$=$$[$0-1]; if (typeof $$[$0] !='string') {$$[$0-1].push($$[$0]);}  
break;
case 46: this.$=$$[$0-1];  $$[$0-1].push($$[$0]); 
break;
case 47:this.$ = [$$[$0]];
break;
case 48:this.$ = $$[$0-1].concat($$[$0]); 
break;
case 49: this.$ = $$[$0]; 
break;
case 50: this.$ = ''; 
break;
case 51: this.$ = { }; 
break;
case 52: this.$ = $$[$0-1]; 
break;
case 53: this.$ = $$[$0-2]; 
break;
case 54: this.$ = {};  this.$[ $$[$0][0]] = $$[$0][1] ; 
break;
case 55: this.$ = $$[$0-2]; $$[$0-2][ $$[$0][0] ] = $$[$0][1]; 
break;
case 56: this.$ = [$$[$0-2], $$[$0]]; 
break;
case 57: this.$ = [];  
break;
case 58: this.$ = $$[$0-1]; 
break;
case 59: this.$ = $$[$0-2]; this.$.push(); 
break;
case 60: this.$ = [ $$[$0] ]; 
break;
case 61: this.$ = $$[$0-1]; $$[$0-1].push($$[$0]); 
break;
case 62: this.$ = $$[$0-2]; $$[$0-2].push($$[$0]); 
break;
}
},
table: [{1:[2,1],3:1,9:[2,1],10:[2,1],43:[2,1]},{1:[3],4:2,6:3,7:4,9:[1,6],10:[1,7],42:5,43:[1,8]},{5:[1,9],6:17,7:11,8:10,9:[1,6],10:[1,7],12:12,13:13,14:14,15:[1,15],16:[1,16],17:[1,18],40:[1,19],42:5,43:[1,8]},{5:[2,3],9:[2,3],10:[2,3],15:[2,3],16:[2,3],17:[2,3],40:[2,3],42:20,43:[1,8]},{5:[2,4],9:[2,4],10:[2,4],15:[2,4],16:[2,4],17:[2,4],40:[2,4],43:[2,4]},{5:[2,47],9:[2,47],10:[2,47],15:[2,47],16:[2,47],17:[2,47],21:[2,47],22:[2,47],24:[2,47],26:[2,47],28:[2,47],30:[2,47],40:[2,47],43:[2,47],45:[2,47],51:[2,47]},{5:[2,7],9:[2,7],10:[2,7],15:[2,7],16:[2,7],17:[2,7],40:[2,7],43:[2,7]},{11:[1,21]},{5:[2,50],9:[2,50],10:[2,50],15:[2,50],16:[2,50],17:[2,50],21:[2,50],22:[2,50],24:[2,50],26:[2,50],28:[2,50],30:[2,50],40:[2,50],43:[2,50],44:[1,22],45:[2,50],51:[2,50]},{1:[2,2],9:[2,2],10:[2,2],43:[2,2]},{5:[2,5],6:17,9:[2,5],10:[2,5],12:23,13:13,14:14,15:[1,15],16:[1,16],17:[1,18],40:[1,19],42:5,43:[1,8]},{5:[2,6],9:[2,6],10:[2,6],15:[2,6],16:[2,6],17:[2,6],40:[2,6],43:[2,6]},{5:[2,9],9:[2,9],10:[2,9],15:[2,9],16:[2,9],17:[2,9],40:[2,9],43:[2,9]},{5:[2,11],9:[2,11],10:[2,11],15:[2,11],16:[2,11],17:[2,11],40:[2,11],43:[2,11]},{5:[2,12],6:24,9:[2,12],10:[2,12],15:[2,12],16:[2,12],17:[2,12],18:25,19:26,20:27,21:[1,28],22:[1,29],24:[1,30],26:[1,31],28:[1,32],30:[1,33],37:34,38:35,40:[2,12],42:5,43:[1,8],45:[1,36],51:[1,37]},{11:[1,38]},{5:[2,14],9:[2,14],10:[2,14],15:[2,14],16:[2,14],17:[2,14],40:[2,14],43:[2,14]},{5:[2,15],9:[2,15],10:[2,15],15:[2,15],16:[2,15],17:[2,15],40:[2,15],42:20,43:[1,8]},{6:40,18:39,19:41,20:42,21:[1,28],22:[1,29],24:[1,30],26:[1,31],28:[1,32],30:[1,33],37:34,38:35,42:5,43:[1,8],45:[1,36],51:[1,37]},{6:44,17:[1,45],41:43,42:5,43:[1,8]},{5:[2,48],9:[2,48],10:[2,48],15:[2,48],16:[2,48],17:[2,48],21:[2,48],22:[2,48],24:[2,48],26:[2,48],28:[2,48],30:[2,48],40:[2,48],43:[2,48],45:[2,48],51:[2,48]},{5:[2,8],9:[2,8],10:[2,8],15:[2,8],16:[2,8],17:[2,8],40:[2,8],43:[2,8]},{5:[2,49],9:[2,49],10:[2,49],15:[2,49],16:[2,49],17:[2,49],21:[2,49],22:[2,49],24:[2,49],26:[2,49],28:[2,49],30:[2,49],40:[2,49],43:[2,49],45:[2,49],51:[2,49]},{5:[2,10],9:[2,10],10:[2,10],15:[2,10],16:[2,10],17:[2,10],40:[2,10],43:[2,10]},{5:[2,40],9:[2,40],10:[2,40],15:[2,40],16:[2,40],17:[2,40],21:[2,40],22:[2,40],24:[2,40],26:[2,40],28:[2,40],30:[2,40],40:[2,40],42:20,43:[1,8],45:[2,40],51:[2,40]},{5:[2,41],9:[2,41],10:[2,41],15:[2,41],16:[2,41],17:[2,41],21:[2,41],22:[2,41],24:[2,41],26:[2,41],28:[2,41],30:[2,41],40:[2,41],43:[2,41],45:[2,41],51:[2,41]},{5:[2,42],9:[2,42],10:[2,42],15:[2,42],16:[2,42],17:[2,42],21:[2,42],22:[2,42],24:[2,42],26:[2,42],28:[2,42],30:[2,42],40:[2,42],43:[2,42],45:[2,42],51:[2,42]},{5:[2,43],9:[2,43],10:[2,43],15:[2,43],16:[2,43],17:[2,43],21:[2,43],22:[2,43],24:[2,43],26:[2,43],28:[2,43],30:[2,43],40:[2,43],43:[2,43],45:[2,43],51:[2,43]},{5:[2,22],9:[2,22],10:[2,22],15:[2,22],16:[2,22],17:[2,22],21:[2,22],22:[2,22],24:[2,22],26:[2,22],28:[2,22],30:[2,22],40:[2,22],43:[2,22],45:[2,22],51:[2,22]},{23:[1,46]},{25:[1,47]},{27:[1,48]},{29:[1,49]},{30:[1,51],31:[1,50]},{5:[2,34],9:[2,34],10:[2,34],15:[2,34],16:[2,34],17:[2,34],21:[2,34],22:[2,34],24:[2,34],26:[2,34],28:[2,34],30:[2,34],33:[2,34],35:[2,34],40:[2,34],43:[2,34],45:[2,34],46:[2,34],48:[2,34],51:[2,34],52:[2,34]},{5:[2,35],9:[2,35],10:[2,35],15:[2,35],16:[2,35],17:[2,35],21:[2,35],22:[2,35],24:[2,35],26:[2,35],28:[2,35],30:[2,35],33:[2,35],35:[2,35],40:[2,35],43:[2,35],45:[2,35],46:[2,35],48:[2,35],51:[2,35],52:[2,35]},{21:[1,56],22:[1,57],24:[1,58],32:55,33:[1,59],35:[1,60],46:[1,52],47:53,49:54},{20:64,21:[1,56],22:[1,57],24:[1,58],32:65,33:[1,59],35:[1,60],37:34,38:35,39:63,45:[1,36],51:[1,37],52:[1,61],53:62},{5:[2,13],9:[2,13],10:[2,13],15:[2,13],16:[2,13],17:[2,13],40:[2,13],43:[2,13]},{5:[2,16],9:[2,16],10:[2,16],15:[2,16],16:[2,16],17:[2,16],40:[2,16],43:[2,16]},{18:66,19:67,20:68,21:[1,28],22:[1,29],24:[1,30],26:[1,31],28:[1,32],30:[1,33],37:34,38:35,42:20,43:[1,8],45:[1,36],51:[1,37]},{5:[2,18],9:[2,18],10:[2,18],15:[2,18],16:[2,18],17:[2,18],40:[2,18],43:[2,18]},{5:[2,20],9:[2,20],10:[2,20],15:[2,20],16:[2,20],17:[2,20],40:[2,20],43:[2,20]},{5:[2,38],6:69,9:[2,38],10:[2,38],15:[2,38],16:[2,38],17:[1,70],21:[2,38],22:[2,38],24:[2,38],26:[2,38],28:[2,38],30:[2,38],40:[2,38],42:5,43:[1,8],45:[2,38],51:[2,38]},{17:[1,45],41:71,42:20,43:[1,8]},{5:[2,44],9:[2,44],10:[2,44],15:[2,44],16:[2,44],17:[2,44],21:[2,44],22:[2,44],24:[2,44],26:[2,44],28:[2,44],30:[2,44],40:[2,44],43:[2,44],45:[2,44],51:[2,44]},{22:[1,72]},{24:[1,73]},{26:[1,74]},{28:[1,75]},{30:[1,76]},{5:[2,28],9:[2,28],10:[2,28],15:[2,28],16:[2,28],17:[2,28],21:[2,28],22:[2,28],24:[2,28],26:[2,28],28:[2,28],30:[2,28],40:[2,28],43:[2,28],45:[2,28],51:[2,28]},{5:[2,51],9:[2,51],10:[2,51],15:[2,51],16:[2,51],17:[2,51],21:[2,51],22:[2,51],24:[2,51],26:[2,51],28:[2,51],30:[2,51],33:[2,51],35:[2,51],40:[2,51],43:[2,51],45:[2,51],46:[2,51],48:[2,51],51:[2,51],52:[2,51]},{46:[1,77],48:[1,78]},{46:[2,54],48:[2,54]},{50:[1,79]},{21:[2,29],22:[2,29],24:[2,29],33:[2,29],35:[2,29],45:[2,29],46:[2,29],48:[2,29],50:[2,29],51:[2,29],52:[2,29]},{23:[1,80]},{25:[1,81]},{34:[1,82]},{36:[1,83]},{5:[2,57],9:[2,57],10:[2,57],15:[2,57],16:[2,57],17:[2,57],21:[2,57],22:[2,57],24:[2,57],26:[2,57],28:[2,57],30:[2,57],33:[2,57],35:[2,57],40:[2,57],43:[2,57],45:[2,57],46:[2,57],48:[2,57],51:[2,57],52:[2,57]},{20:64,21:[1,56],22:[1,57],24:[1,58],32:65,33:[1,59],35:[1,60],37:34,38:35,39:86,45:[1,36],48:[1,85],51:[1,37],52:[1,84]},{21:[2,60],22:[2,60],24:[2,60],33:[2,60],35:[2,60],45:[2,60],48:[2,60],51:[2,60],52:[2,60]},{21:[2,36],22:[2,36],24:[2,36],33:[2,36],35:[2,36],45:[2,36],46:[2,36],48:[2,36],51:[2,36],52:[2,36]},{21:[2,37],22:[2,37],24:[2,37],33:[2,37],35:[2,37],45:[2,37],46:[2,37],48:[2,37],51:[2,37],52:[2,37]},{5:[2,17],9:[2,17],10:[2,17],15:[2,17],16:[2,17],17:[2,17],40:[2,17],43:[2,17]},{5:[2,19],9:[2,19],10:[2,19],15:[2,19],16:[2,19],17:[2,19],40:[2,19],43:[2,19]},{5:[2,21],9:[2,21],10:[2,21],15:[2,21],16:[2,21],17:[2,21],40:[2,21],43:[2,21]},{5:[2,45],9:[2,45],10:[2,45],15:[2,45],16:[2,45],17:[2,45],21:[2,45],22:[2,45],24:[2,45],26:[2,45],28:[2,45],30:[2,45],40:[2,45],42:20,43:[1,8],45:[2,45],51:[2,45]},{5:[2,46],9:[2,46],10:[2,46],15:[2,46],16:[2,46],17:[2,46],21:[2,46],22:[2,46],24:[2,46],26:[2,46],28:[2,46],30:[2,46],40:[2,46],43:[2,46],45:[2,46],51:[2,46]},{5:[2,39],6:69,9:[2,39],10:[2,39],15:[2,39],16:[2,39],17:[1,70],21:[2,39],22:[2,39],24:[2,39],26:[2,39],28:[2,39],30:[2,39],40:[2,39],42:5,43:[1,8],45:[2,39],51:[2,39]},{5:[2,23],9:[2,23],10:[2,23],15:[2,23],16:[2,23],17:[2,23],21:[2,23],22:[2,23],24:[2,23],26:[2,23],28:[2,23],30:[2,23],40:[2,23],43:[2,23],45:[2,23],51:[2,23]},{5:[2,24],9:[2,24],10:[2,24],15:[2,24],16:[2,24],17:[2,24],21:[2,24],22:[2,24],24:[2,24],26:[2,24],28:[2,24],30:[2,24],40:[2,24],43:[2,24],45:[2,24],51:[2,24]},{5:[2,25],9:[2,25],10:[2,25],15:[2,25],16:[2,25],17:[2,25],21:[2,25],22:[2,25],24:[2,25],26:[2,25],28:[2,25],30:[2,25],40:[2,25],43:[2,25],45:[2,25],51:[2,25]},{5:[2,26],9:[2,26],10:[2,26],15:[2,26],16:[2,26],17:[2,26],21:[2,26],22:[2,26],24:[2,26],26:[2,26],28:[2,26],30:[2,26],40:[2,26],43:[2,26],45:[2,26],51:[2,26]},{5:[2,27],9:[2,27],10:[2,27],15:[2,27],16:[2,27],17:[2,27],21:[2,27],22:[2,27],24:[2,27],26:[2,27],28:[2,27],30:[2,27],40:[2,27],43:[2,27],45:[2,27],51:[2,27]},{5:[2,52],9:[2,52],10:[2,52],15:[2,52],16:[2,52],17:[2,52],21:[2,52],22:[2,52],24:[2,52],26:[2,52],28:[2,52],30:[2,52],33:[2,52],35:[2,52],40:[2,52],43:[2,52],45:[2,52],46:[2,52],48:[2,52],51:[2,52],52:[2,52]},{21:[1,56],22:[1,57],24:[1,58],32:55,33:[1,59],35:[1,60],46:[1,87],49:88},{20:64,21:[1,56],22:[1,57],24:[1,58],32:65,33:[1,59],35:[1,60],37:34,38:35,39:89,45:[1,36],51:[1,37]},{22:[1,90]},{24:[1,91]},{33:[1,92]},{35:[1,93]},{5:[2,58],9:[2,58],10:[2,58],15:[2,58],16:[2,58],17:[2,58],21:[2,58],22:[2,58],24:[2,58],26:[2,58],28:[2,58],30:[2,58],33:[2,58],35:[2,58],40:[2,58],43:[2,58],45:[2,58],46:[2,58],48:[2,58],51:[2,58],52:[2,58]},{20:64,21:[1,56],22:[1,57],24:[1,58],32:65,33:[1,59],35:[1,60],37:34,38:35,39:95,45:[1,36],51:[1,37],52:[1,94]},{21:[2,61],22:[2,61],24:[2,61],33:[2,61],35:[2,61],45:[2,61],48:[2,61],51:[2,61],52:[2,61]},{5:[2,53],9:[2,53],10:[2,53],15:[2,53],16:[2,53],17:[2,53],21:[2,53],22:[2,53],24:[2,53],26:[2,53],28:[2,53],30:[2,53],33:[2,53],35:[2,53],40:[2,53],43:[2,53],45:[2,53],46:[2,53],48:[2,53],51:[2,53],52:[2,53]},{46:[2,55],48:[2,55]},{46:[2,56],48:[2,56]},{21:[2,30],22:[2,30],24:[2,30],33:[2,30],35:[2,30],45:[2,30],46:[2,30],48:[2,30],50:[2,30],51:[2,30],52:[2,30]},{21:[2,31],22:[2,31],24:[2,31],33:[2,31],35:[2,31],45:[2,31],46:[2,31],48:[2,31],50:[2,31],51:[2,31],52:[2,31]},{21:[2,32],22:[2,32],24:[2,32],33:[2,32],35:[2,32],45:[2,32],46:[2,32],48:[2,32],50:[2,32],51:[2,32],52:[2,32]},{21:[2,33],22:[2,33],24:[2,33],33:[2,33],35:[2,33],45:[2,33],46:[2,33],48:[2,33],50:[2,33],51:[2,33],52:[2,33]},{5:[2,59],9:[2,59],10:[2,59],15:[2,59],16:[2,59],17:[2,59],21:[2,59],22:[2,59],24:[2,59],26:[2,59],28:[2,59],30:[2,59],33:[2,59],35:[2,59],40:[2,59],43:[2,59],45:[2,59],46:[2,59],48:[2,59],51:[2,59],52:[2,59]},{21:[2,62],22:[2,62],24:[2,62],33:[2,62],35:[2,62],45:[2,62],48:[2,62],51:[2,62],52:[2,62]}],
defaultActions: {},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        _handle_error:
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + this.terminals_[symbol]+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/\n.*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
            this.yytext += match[0];
            this.match += match[0];
            this.yyleng = this.yytext.length;
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:
                                 this.begin('comment');  
                                 // console.log("hash");  
                                 return 43;
                               
break;
case 1:/* ignore these terminators */
break;
case 2:
                              //    console.log("comment: "+yy_.yytext); 
                                 return 44;
                               
break;
case 3:
                                 this.popState();  
                               
break;
case 4:  // comment before newline semicolon 
                              // this didn't work with 1 char lookahead
                                 this.popState();  
                              //   console.log("push-back " + yy_.yytext.length +
                              //       " chars >"+escape(yy_.yytext)+"<"); 
                                 this.unput(yy_.yytext);
                               
break;
case 5:
                                 this.begin('semicol');
                               //   console.log("<<semicol"); 
                                 return 30;
                               
break;
case 6:
                                 this.popState(); 
                              //    console.log(">>quoteSC"); 
                                 return 30;
                               
break;
case 7:
                               //   console.log("== SC quoted string:" + yy_.yytext); 
                                 return 31;
                               
break;
case 8:  // lookahead match $=EOF or not colon 
                                //  console.log("term"); 
                               
break;
case 9: 
                                 // console.log("eof"); 
                                 return 5;
                               
break;
case 10:
                                //  console.log("tag:" + yy_.yytext);
                                 return 17;
                               
break;
case 11: /* empty */
                                 // console.log("blank"); 
                                 // return 'blank'; 
                               
break;
case 12: 
                                 // console.log("glob"); 
                                 return 9;
                               
break;
case 13: 
                                 // console.log("data");
                                 this.begin("label");
                                 return 10;
                               
break;
case 14:
                                this.popState();
                                 //console.log("label_ " + yy_.yytext);
                                 return 11;
                               
break;
case 15:
                                 return 16;
                               
break;
case 16:
                                 this.begin("label");
                                 return 15;
                               
break;
case 17:
                              //    console.log("loop_"); 
                                 return 40;
                               
break;
case 18:
                                 this.popState(); 
                                 return 'STOP_';
                               
break;
case 19:
                                 this.begin('tsquote'); 
                               //   console.log("tsquote"); 
                                 return 22;
                               
break;
case 20:
                                 return 23;
                               
break;
case 21:
                                 this.popState(); 
                                //  console.log("tsquote"); 
                                 return 22;
                               
break;
case 22:
                                 this.begin('tdquote'); 
                               //   console.log("tdquote"); 
                                 return 24;
                               
break;
case 23:
                                 return 25;
                               
break;
case 24:
                                 this.popState(); 
                                  //console.log("tdquote"); 
                                 return 24;
                               
break;
case 25:
                                 this.begin('dquote'); 
                                  //console.log("dquote"); 
                                 return 26;
                               
break;
case 26:
                                 this.popState(); 
                                  //console.log("pop dquote"); 
                                 return 26; 
                               
break;
case 27: 
                                 return 27; 
                               
break;
case 28:
                                 this.begin('cdquote'); 
                                  //console.log("cdquote"); 
                                 return 33;
                              
break;
case 29: 
                                 return 34; 
                               
break;
case 30:
                                 this.popState(); 
                                  //console.log("pop cdquote"); 
                                 return 33;
                               
break;
case 31:
                                 this.begin('squote');
                                  //console.log("squote"); 
                                 return 28;
                               
break;
case 32:
                                 this.popState(); 
                                  //console.log("pop squote"); 
                                 return 28; 
                               
break;
case 33: 
                                 // <squote>(\\\'|[^'])*/[']      
                                 return 29; 
                               
break;
case 34:
                                 this.begin('csquote'); 
                                  //console.log("csquote"); 
                                 return 35;
                              
break;
case 35: 
                                 return 36; 
                               
break;
case 36:
                                 this.popState(); 
                                  //console.log("pop csquote"); 
                                 return 35;
                               
break;
case 37:
                                 this.begin('composite'); 
                                 // console.log("COMPOSITE"); 
                                 return 51;
                               
break;
case 38: /* ignore */ 
break;
case 39:
                                 this.popState(); 
                                 // console.log(" end COMPOSITE"); 
                                 return 52;
                               
break;
case 40:
                                 this.begin('composite'); 
                                 return 45;
                               
break;
case 41: return 48; 
break;
case 42: return 50; 
break;
case 43:
                                 this.popState(); 
                                 return 46;
                               
break;
case 44:
                                 return 'DOLLAR';
                               
break;
case 45:
                               //   console.log("unquote"); 
                                 return 21; 
                               
break;
case 46:
                                //  console.log("unquote"); 
                                 return 21; 
                               
break;
}
};
lexer.rules = [/^#/,/^(\\r\\n|\n|\r|\f)/,/^[^\n\r\f]+/,/^(\\r\\n|\n|\r|\f)(?=($|[^;]))/,/^(\\r\\n|\n|\r|\f)[;]/,/^[\n\r\f][;]/,/^[\n\r\f][;]/,/^([^\n\r\f]|[\n\r\f](?![;]))*/,/^(\\r\\n|\n|\r|\f)(?=($|[^;]))/,/^$/,/^_[^\s]+(?=\s)/,/^[ \t\v]+/,/^[gG][lL][oO][bB][aA][lL]_\b/,/^[dD][aA][tT][aA]_(?=[^\s])/,/^\S+/,/^[sS][aA][vV][eE]_(?=[\s])/,/^[sS][aA][vV][eE]_(?=[^\s])/,/^[lL][oO][oO][pP]_\b/,/^[sS][tT][oO][pP]_\b/,/^'''/,/^([^']|(['](?!(''))))+/,/^'''/,/^"""/,/^([^"]|(["](?!(["]["]))))+/,/^"""/,/^"/,/^["](?=[\s])/,/^(\\"|[^"]|["](?=[^\s]))*(?=["])/,/^["]/,/^(\\"|[^"])+(?=["])/,/^["]/,/^[']/,/^['](?=[\s])/,/^(\\'|[^']|['](?=[^\s]))*(?=['])/,/^[']/,/^(\\'|[^'])+(?=['])/,/^[']/,/^\[/,/^[\s]+/,/^\]/,/^\{/,/^,/,/^:/,/^\}/,/^\$/,/^[^\]}\s,:]+(?=[\s:,\]}])/,/^[^\s]+(?=[\s])/];
lexer.conditions = {"cdquote":{"rules":[29,30],"inclusive":false},"csquote":{"rules":[35,36],"inclusive":false},"comment":{"rules":[2,3,4],"inclusive":false},"dquote":{"rules":[26,27],"inclusive":false},"squote":{"rules":[32,33],"inclusive":false},"bracketed":{"rules":[],"inclusive":false},"semicol":{"rules":[6,7],"inclusive":false},"label":{"rules":[14],"inclusive":false},"tsquote":{"rules":[20,21],"inclusive":false},"tdquote":{"rules":[23,24],"inclusive":false},"composite":{"rules":[1,19,22,28,34,37,38,39,40,41,42,43,45],"inclusive":false},"INITIAL":{"rules":[0,5,8,9,10,11,12,13,15,16,17,18,19,22,25,31,37,40,44,46],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = star;
exports.parse = function () { return star.parse.apply(star, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}