/**
 *
 *   DDL -> Schema  and Dict -> Model
 *   Dict -> Schema  and CIF -> Model
 *
 */

/**
 * Convert JS model hierarchy to HTML for display
 *
 */
function HierarchyView(doc, filename, prefix) {
	this._logger = null;
	this._xml = null;
	this._model = null;   // CIF data as JS object hierarchy
	this._blockid = null;
	this._schema = null;   // definition dictionary
	// dummy/replacable  dREL execution context
	this._ctxt = {'call': function (x,y,z) { alert("replaceMe()" + x + " " + y);} }; 
	this._modelType = null;
	if (arguments.length) { this._init(doc, filename, prefix); }

} 

HierarchyView.prototype._init = function(doc, filename, prefix) {
	this._doc = doc;
	this._filename = filename;
	this._prefix = prefix + filename + ":";
//	this._logger = CifJs; // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
	if (this._filename.slice(-4) == ".dic") {   
		this._modelType = 'dic' ; 
	}
	else if (this._filename.slice(-3) == ".js") {   
		this._modelType = 'dic' ; 
	}
	else if (this._filename.slice(-4) == ".cif") {   
		this._modelType = 'cif' ; 
	}
};



HierarchyView.prototype._log = function(data) {
	if (this._logger) this._logger.log(data);
};
HierarchyView.prototype._debug = function(data) {
	if (this._logger) this._logger.debug(data);
};

HierarchyView.prototype._esc = function(strn) {
	return escape(strn);
};

// RESOLVETHIS
HierarchyView.prototype._getContext = function(type, tag, model, blockid) {
	var obj;
	if ('getContext' in this._model) {
		obj = this._model.getContext(blockid);
	}
	if (! obj) obj = this._ctxt;

	function f(e) { 
		e.returnValue = false;  // event.returnValue
		//return obj.call(type, tag, model);
		obj.call(type, tag, model);
		return false;
	}; 
	model._updateDepends = f; 
	return  f;
};


HierarchyView.prototype.renderModel = function(schema, model) {
	if (! model) {
		this._log("No viable " + this._modelType + " conversion.");
		return null;
	}
	if ('_ddl_version' in model) {
		// override ddlm aux .cif file type
		this._modelType = 'dic';
	}
	this._schema = schema;  // hierarchical javascript
	this._model = model;  // hierarchical javascript

	var wrapper = this._renderModelWrapper();
//	try {
	if ( this._modelType == 'cif') {
		this._topLevelCif(wrapper.child); 
	} else {
		this._topLevelDic(wrapper.child); 
	}
//	} catch (e) {
//	this._log(e);
//	alert(e);
//	}
	return wrapper.root;
};


HierarchyView.prototype._renderModelWrapper = function() {
	var frag = this._doc.createDocumentFragment();
	var div = this._doc.createElement('div');
	div.setAttribute("class", this._modelType);
	frag.appendChild(div);
	var h2 = this._doc.createElement('h2');
	var title = this._doc.createTextNode(this._filename);
	div.appendChild(h2);
	h2.appendChild(title);
	h2.setAttribute("class", this._modelType + "_filename");
	return {'root':frag, 'child':div};
};


HierarchyView.prototype._topLevelCif = function(parentXmlNode) {
	var blocks = this._model.getBlocks();

	for (var i = 0; i < blocks.length; i++) {
		var block = blocks[i];
		if (i == 0 && block[0] && block[0][0] == '@comment') {
			this._renderHeader(block, parentXmlNode);
			continue;
		}

		// otherwise it is a newBlock
		var type = block.getType();
		this._blockid = block.getName();
		if (type == 'global_' || type == 'data_') {
			var childXmlNode = this._renderBlock(block, parentXmlNode);
			block._renderer = this;
			block._view = childXmlNode;

			var progeny = block.getSubCats();
                        var hierarchy = []; 
			this._walk(block, progeny, childXmlNode, hierarchy);

			// display items of no known dict definition
			var sundries = block.getUnresolved();
			if (sundries) {
				// this doesn't include those mixed up in looped categories
				this._log("unresolved " + sundries.length);
				this._walkGroupData(block, sundries, childXmlNode); 
			}
		} 

	}
};



HierarchyView.prototype._topLevelDic = function(parentXmlNode) {
	var blocks = this._model.getBlocks();

	for (var i = 0; i < blocks.length; i++) {
		var block = blocks[i];
		//if (i == 0 && block[0] && block[0][0] == '@comment') {
		if (i == 0 && block[0]  == '@comment') {
			this._renderHeader(blocks, parentXmlNode);
			continue;
		}

		// otherwise it is a newBlock
		var type = block[0];
		if (type == '@comment') continue;
		if (type == 'global_' || type == 'data_') {
			this._blockid =  block[1];
			block = this._model;
			var childXmlNode = this._renderBlock(this._model, parentXmlNode);
			block._renderer = this;
			block._view = childXmlNode;

			// var progeny = block.getSubCats();
//			ddb      this._walk(block, progeny, childXmlNode);
			this._paceLevel(block, block, childXmlNode);


			// render dictionary level attribute children

			var block_leaves = this._model.getBlockAttributes(this._blockid);
			// var block_leaves = block.getAttributes();
			if (block_leaves) { 
				this._walkGroupData(block, block_leaves, childXmlNode);
			}

			// display items of no known dict definition
			var sundries = block.getUnresolved();
			if (sundries) {
				// this doesn't include those mixed up in looped categories
				this._log("unresolved " + sundries.length);
				this._walkGroupData(block, sundries, childXmlNode); 
			}
		} 
		// For DDL2 there is only 1 data_ block but many save_ frames
		// For DDL1 there are hundreds of data_ blocks but we reorganised.
		// So we only need to act on the first one.
		//if (this._schema._ddl_version == 'DDL1') break;
		if (('_ddl_version' in this._model) && this._model._ddl_version == 'DDL1') break;
	}

};

HierarchyView.prototype.renderId = function(id) {
	this._log("render Id " + id);
};


HierarchyView.prototype._paceLevel = function(block, level, parentXmlNode, prefix) {
	if (prefix) {
		this._prefix = prefix;
	}
	var siblings = level.getSubCats();
	var cats = [];
	for (var cat in siblings) {
		cats.push(cat);
	}
	cats.sort();
//	alert(level.getName() + " : " + cats);
//	alert("walk sub cats " + cats.length);

	for (var ncat = 0; ncat < cats.length; ncat++) {
		var cat_name = cats[ncat];
		var childXmlNode = this._renderCategory(block, cat_name, parentXmlNode);

		// walk down category children
		var cat = siblings[cat_name];
		cat._view = childXmlNode;
		if (block === level) {  // special case for artificially created top level cat
			// this._paceLevel(block, cat, childXmlNode);
		}
	}
	var items = [];
	siblings = level.getItems();
	for (var item in siblings) {
		items.push(item);
	}
	items.sort();
	for (var ncat = 0; ncat < items.length; ncat++) {
		var item_name = items[ncat];
		var childXmlNode = this._renderCategory(block, item_name, parentXmlNode);
		// walk down category children
		var item = siblings[item_name];
		item._view = childXmlNode;
	}

	// now do all the item/attribute children of this category
	var cat_leaves = level.getAttributes();
	if (cat_leaves) { 
		this._walkGroupData(block, cat_leaves, parentXmlNode);
	}
};

HierarchyView.prototype._walk = function(block, siblings, parentXmlNode, hierarchy){
  var cats = [];
  for (var cat in siblings) {
  	cats.push(cat);
  }
  cats.sort();
//	alert("walk sub cats " + cats.length);

  for (var ncat = 0; ncat < cats.length; ncat++) {
    var cat_name = cats[ncat];
  
    var childXmlNode = this._renderCategory(block, cat_name, parentXmlNode, hierarchy);
  
    // walk down category children
    var cat = siblings[cat_name];
    cat._view = childXmlNode;
//  	this._log("add cat " + cat_name + " : " + cat._name + " : " + cat._sub_cats);
//  	alert("add cat " + cat_name + " : " + cat._name + " : " + cat._sub_cats);

    var progeny = cat.getSubCats();
    if (progeny) {
        hierarchy.push(cat_name);
    	this._walk(block, progeny, childXmlNode, hierarchy);
        hierarchy.pop();
    }
  
    // only for dictionaries
    var progeny = cat.getItems();
    if (progeny) {
        hierarchy.push(cat_name);
    	this._walk(block, progeny, childXmlNode, hierarchy);
        hierarchy.pop();
    }
  
    // now do all the item/attribute children of this category
    var cat_leaves = cat.getAttributes();
    if (cat_leaves) { 
    	this._walkGroupData(block, cat_leaves, childXmlNode);
    }
  } // loop over sibling cats
}; 


HierarchyView.prototype._walkGroupData = function(block, leaves, parentXmlNode) {

	for (var j = 0; j< leaves.length; j++) {
		var frag = leaves[j];
		//var chunk = frag._data;
		var chunk = frag.getJSON();
		var type;
		if (frag._type) type= frag._type; // for save_
		else type = chunk[0];

		if    (type == 'item_') {
			this._renderAttribute(frag, parentXmlNode, this._blockid); // global_s have no blockid???
		} else if (type == '@comment') {
			this._renderComment(frag, parentXmlNode);
		} else if (type == 'loop_') {
			this._renderLoop(frag, parentXmlNode, this._blockid);
		} else if (type == 'save_') {
			var dd = this._renderSave(frag, parentXmlNode);
			this._walkGroupData(block, chunk, dd);
		} else {
//			throw new Error("Unknown type '" + type +"' while converting JSON to HTML\n" + chunk ); 
			this._log("Unknown type '" + type +"' while converting JSON to HTML\n" + chunk ); 
		}
	} // loop over cat data item chunks . should be sorted
}; 


HierarchyView.prototype._renderHeader = function(block, parentXmlNode) {

	var dl = this._doc.createElement('dl');
	parentXmlNode.appendChild(dl);
	dl.setAttribute("class", "comment_header");
	var dt = this._doc.createElement('dt');
	dl.appendChild(dt);
	var a = this._doc.createElement('a');
	dt.appendChild(a);
	var header = "header";
	var strn = this._prefix + header;
	dt.setAttribute('id',this._esc(strn));
//	this._log("setId " + strn);
	a.setAttribute('href','#' + this._esc(strn));
	text = this._doc.createTextNode("[+]\240");
	a.appendChild(text);
	text = this._doc.createTextNode(header);
	a.appendChild(text);
	//a.setAttribute('onclick',"CifJs.displayStateFlip('" + strn + "')");
	a.setAttribute('onclick',"CifJs.displayStateFlip('" + this._esc(strn) + "');event.returnValue=false;return false;");
	//a.onclick = new Function("CifJs.displayStateFlip('" + strn + "')");
	var dd = this._doc.createElement('dd');
	dd.style.display = "none";
	dl.appendChild(dd);
	comment = this._doc.createElement('pre');
	dd.appendChild(comment);

	for (var j = 0; j < block.length; j++) {
		if (block[j][0] == '@comment') {
			var text = this._doc.createTextNode(block[j][1]+ '\n');
			comment.appendChild(text);
		}
	}
};

HierarchyView.prototype._renderBlock = function(block, parentXmlNode) {
	// otherwise it is a newBlock
	var type = block.getType();
	var name = block.getName();

	var dl = this._doc.createElement('dl');
	parentXmlNode.appendChild(dl);
	dl.setAttribute("class", "data_block");
	var dt = this._doc.createElement('dt');
	dl.appendChild(dt);
	//var id = this._doc.createAttribute('id');
	//dt.setAttributeNode(id);
	var a = this._doc.createElement('a');
	dt.appendChild(a);
	//var href = this._doc.createAttribute('href');
	//a.setAttributeNode(href);
	var strn; 
	if (type == 'global_') {
		strn = type;
	} 
	else {
		strn = name;
	}
	var text = this._doc.createTextNode("[+]");
	a.appendChild(text);
	text = this._doc.createTextNode("\240");
	dt.appendChild(text);
	text = this._doc.createTextNode(strn);
	dt.appendChild(text);
	var id = this._prefix + strn; 
	dt.setAttribute('id', this._esc(id));
	dt.setAttribute('data-definitionId', this._esc(strn));
//	this._log("setId " + strn);
	a.setAttribute('href','#' + this._esc(id)); // +strn;
	// id.nodeValue = strn;
	a.setAttribute('onclick',"CifJs.displayStateFlip('" + this._esc(id) + "');event.returnValue=false;return false;");
	//a.onclick = new Function("CifJs.displayStateFlip('" + strn + "')");

	// add link to generate category
	var text = this._doc.createTextNode("\240\240");
	dt.appendChild(text);

	if (this._modelType == 'cif') {
		a = this._doc.createElement('a');
		var text = this._doc.createTextNode("[++]");
		a.appendChild(text);
		a.setAttribute('href','#'); // +strn;
		a.setAttribute('onclick',"CifJs.displayAllLike('" + this._esc(this._prefix) + "','" +
				this._esc(strn) + "');event.returnValue=false;return false;");
		dt.appendChild(a);
		var text = this._doc.createTextNode("\240\240");
		dt.appendChild(text);
	}


	var gen = this._doc.createElement("span");
	gen.setAttribute('class','cif_control');

	a = this._doc.createElement('a');
	a.setAttribute('href','#'); // +strn;
	if (this._modelType == 'cif') {
		text = this._doc.createTextNode("Gen");
	} else {
		text = this._doc.createTextNode("Add");
	}
	a.appendChild(text);
	gen.appendChild(a);
	dt.appendChild(gen);
	// the "child" element slot
	var dd = this._doc.createElement('dd');
	dd.style.display = "none";
	dl.appendChild(dd);

	var dict = this._schema;
	if (! dict) {
		gen.removeChild(a);
		return dd;
	}

	// for dictionaries editing should be able to add stuff. not yet sadly. 

	var blk = block;
	var cif = this;
	var func = function() {
		// a closure exploiting local vars dict, blk and cif
		var tip = document.getElementById('tooltip');
		while ( tip.childNodes.length >= 1 ) {
			tip.removeChild( tip.firstChild );       
		} 

		var link = document.createElement('a');
		tip.appendChild(link);
		tip.appendChild(document.createElement('br'));
		var txt = document.createTextNode('X');
		link.appendChild(txt);
		link.setAttribute('href', '#');
//		link.setAttribute('onclick',"CifJs.displayStateFlip('" + this._esc(strn) + "');event.returnValue=false;return false;");
		link.onclick =  function(event) { tooltip.off(); };

		for (var cat in dict.getCategories()) {
			var computable = dict.getCategory(cat).getAttribute(dict._method_expression); 
			if (! computable) 
				computable = dict.getCategory(cat).getAttributeLoop(dict._method_expression); 
			if (computable && 
					! (cat in blk._categories) && 
					! (cat.toLowerCase() in blk._categories) ) {

				txt = document.createTextNode("\240" );
				dt.appendChild(txt);

				link = document.createElement('a');
				txt = document.createTextNode( cat );
				link.appendChild(txt);
				link.setAttribute('href', '#');
				//link.onclick = cif._getContext('GenCat',cat, dl, name);
				// a closure exploiting local vars cif, cat, dl and name;
				link.onclick = (function(cif,cat_name,dl,name) {
					var f = cif._getContext('GenCat',cat_name, dl, name); 
					return f;
				})(cif,cat,dl,name);
				tip.appendChild(link);
				var br = document.createElement('br');
				tip.appendChild(br);
			}
		}
		var hr = document.createElement('hr');
		tip.appendChild(hr);
		var ignore = {'Registration':1, 'Transient':1};
		// dict._sub_cats and the "ignore" list are hacks
		for (var subcat in dict._sub_cats) {
			if (subcat in blk._categories) continue;
			if (subcat.toLowerCase() in blk._categories) continue;
			var def_class = dict._sub_cats[subcat].getAttribute('_definition.class');
			if (!def_class || (def_class in ignore) ) continue;

			var txt = document.createTextNode("\240" );
			dt.appendChild(txt);

			var link = document.createElement('a');
			txt = document.createTextNode( subcat );
			link.appendChild(txt);
			link.setAttribute('href', '#');
			//link.onclick = cif._getContext('GenCat',cat, dl, name);
			// a closure exploiting local vars cif, cat, dl and name;
			link.onclick = (function(cif,cat_name,dl,blkname) {
				tooltip.off();
				var f = cif._getContext('AddCat',cat_name, dl, blkname); 
				return f;

			})(cif,subcat,dl,blk._name);
			tip.appendChild(link);
			var br = document.createElement('br');
			tip.appendChild(br);
		}
		tip.onmouseout =  function(event) {
			return tooltip.mouseOutCheck(event); 
		};
	};

	// we need a delay because its too distracting otherwise
	a.onmouseover =  function(event) { 
		tooltip.clearTimeout();
		tooltip.timeout = setTimeout( function() {
			func(); tooltip.on(null,event); }, 500);
	};
	a.onmouseout =  function(event) { tooltip.clearTimeout(); };

	if (this._modelType != 'cif') return dd;


	// add link to generate category
	text = this._doc.createTextNode("\240\240");
	dt.appendChild(text);
	var val = this._doc.createElement("span");
	val.setAttribute('class','cif_control');

	a = this._doc.createElement('a');
	a.setAttribute('href','#'); // +strn;
	text = this._doc.createTextNode("Valid");
	a.appendChild(text);
	val.appendChild(a);
	dt.appendChild(val);
	a.onclick = (function(cif,blk, blkname) {
		var f = cif._getContext('validate', null, blk, blkname); 
		return f;
	})(cif, block, blk._name);
	return dd;
};

HierarchyView.prototype._renderCategory = function(block, cat_name, parentXmlNode, hierarchy) {

	var dl = this._doc.createElement('dl');
	dl.setAttribute('class','category');
	parentXmlNode.appendChild(dl);
	var dt = this._doc.createElement('dt');
	dl.appendChild(dt);
//	var id = this._doc.createAttribute('id');
//	dt.setAttributeNode(id);
	var a = this._doc.createElement('a');
	a.setAttribute('href','#');// +strn;
	text = this._doc.createTextNode("[+]");
	a.appendChild(text);
	dt.appendChild(a);

	text = this._doc.createTextNode('\240');
	dt.appendChild(text);
	var strn = cat_name; 
	text = this._doc.createTextNode(strn);
	dt.appendChild(text);

	if (this._modelType == 'cif') {
          if (this._schema) {
            if (hierarchy.length > 0) 
              strn = ":" + hierarchy.join(':') + ":" + strn;
            else 
              strn = ":" +  strn;
          }
	  strn = this._prefix + block.getName() + strn; 
	} else {
		strn = this._prefix + strn; 
	}
	dt.setAttribute('id',this._esc(strn));
	a.setAttribute('href','#' + this._esc(strn));// +strn;

	a.setAttribute('onclick',"CifJs.displayStateFlip('" + this._esc(strn) + "');event.returnValue=false;return false;");
//	a.onclick = new Function("CifJs.displayStateFlip('" + strn + "')");

	// add link to generate category
	var text = this._doc.createTextNode("\240\240");
	dt.appendChild(text);
	var gen = this._doc.createElement("span");
	gen.setAttribute('class','cif_control');
	a = this._doc.createElement('a');
	a.setAttribute('href','#'); // +strn;
	text = this._doc.createTextNode("Add");
	a.appendChild(text);
	gen.appendChild(a);
	dt.appendChild(gen);
	text = this._doc.createTextNode("\240");
	dt.appendChild(text);

	var dd = this._doc.createElement('dd');
	dd.style.display = "none";
	dl.appendChild(dd);

	var dict = this._schema;
	if (! dict) {
		gen.removeChild(a); // didn't want it anyway
		return dd;
	}
	var blk = block;
	var cif = this;

	var cat = this._schema.getCategory(cat_name.toLowerCase());
	if (!cat ) {
		if (this._modelType != 'dic') {  // acts differently
			this._log("Schema has no info for " +cat_name + " in file " +this._filename);
		}
		gen.removeChild(a); // didn't want it anyway
		return dd;
	}

	var adds = false;
	//var catdata =  blk._categories[cat_name.toLowerCase()];
	for (var subcat in cat.getSubCats()) {
		if (subcat in blk._categories) continue;
		if (subcat.toLowerCase() in blk._categories) continue;
		adds = true;
		break;
	}
	for (var item in cat._items) {
		if (item in blk._items) continue;
		if (item.toLowerCase() in blk._items) continue;
		adds = true;
		break;
	}
	if (! adds) {
		gen.removeChild(a); // didn't want it anyway
		return dd;
	}


	var func = function() {
		// a closure exploiting local vars dict, blk and cif
		var tip = document.getElementById('tooltip');
		while ( tip.childNodes.length >= 1 ) {
			tip.removeChild( tip.firstChild );       
		} 

		var link = document.createElement('a');
		tip.appendChild(link);
		tip.appendChild(document.createElement('br'));
		var txt = document.createTextNode('X');
		link.appendChild(txt);
		link.setAttribute('href', '#');
//		link.setAttribute('onclick',"CifJs.displayStateFlip('" + this._esc(strn) + "');event.returnValue=false;return false;");
		link.onclick =  function(event) { tooltip.off(); };


		for (var subcat in cat.getSubCats()) {
			if (subcat in blk._categories) continue;
			if (subcat.toLowerCase() in blk._categories) continue;
			subcat = cat._sub_cats[subcat]._name; // dict defined name

			txt = document.createTextNode("\240" );
			dt.appendChild(txt);

			link = document.createElement('a');
			txt = document.createTextNode( subcat );
			link.appendChild(txt);
			link.setAttribute('href', '#');
			//link.onclick = cif._getContext('GenCat',cat, dl, name);
			// a closure exploiting local vars cif, cat, dl and name;
			link.onclick = (function(cif,cat_name,dl,blkname) {
				tooltip.off();
				var f = cif._getContext('AddCat',cat_name, dl, blkname); 
				return f;

			})(cif,subcat,dl,blk._name);
			tip.appendChild(link);
			var br = document.createElement('br');
			tip.appendChild(br);
		}
		//var catdata =  blk._categories[cat_name.toLowerCase()];
		for (var item in cat._items) {

			if (item in blk._items) continue;
			if (item.toLowerCase() in blk._items) continue;
			item = cat._items[item]._name; // dict defined name 
			var txt = document.createTextNode("\240" );
			dt.appendChild(txt);

			var link = document.createElement('a');
			txt = document.createTextNode( item );
			link.appendChild(txt);
			link.setAttribute('href', '#');
			//link.onclick = cif._getContext('GenCat',cat, dl, name);
			// a closure exploiting local vars cif, cat, dl and name;
			link.onclick = (function(cif,cat_name,dl,blkname) {
				var f = cif._getContext('AddItem',item, dl, blkname); 
				return f;

			})(cif,item,dl,blk._name);
			tip.appendChild(link);
			var br = document.createElement('br');
			tip.appendChild(br);
		}
		tip.onmouseout =  function(event) {
			return tooltip.mouseOutCheck(event); 
		};
	};
	// a closure exploiting local variable  func ...
	a.onmouseover =  function(event) { 
		tooltip.clearTimeout();
		tooltip.timeout = setTimeout( function() {
			func(); tooltip.on(null,event); }, 500);
	};
	a.onmouseout =  function(event) { tooltip.clearTimeout(); };

	return dd;
};



HierarchyView.prototype._renderAttribute = function(frag, parentXmlNode, blockid){
	var chunk = frag.getJSON();
	var dl = this._doc.createElement('dl');
	var dt = this._doc.createElement('dt');
	dl.appendChild(dt);
	var span = this._doc.createElement('span');
	dt.setAttribute('class','datum_name');
	var field = this._doc.createElement('a');
	var tag = chunk[1];
	if (this._modelType == 'cif') {
		span.setAttribute('id', this._esc(this._prefix + blockid + tag.toLowerCase()));
	}

	var path = null;
	if (this._schema) {
		path = this._schema.getItemPath(tag.toLowerCase()); 
	}
	if (path) {
		// href.nodeValue = "#dic:" + path[0];
		var prefix = this._schema.getItemDictPrefix(tag.toLowerCase()); 
		field.setAttribute('href','#');
		field.setAttribute('onclick',"CifJs.openPath(function() {return CifJs._meta_dict.getItemPath('" + tag.toLowerCase() + "');},'" + prefix + "')");
//		field.onclick = new Function("CifJs.openPath('dic:','" + path + "')");
	} else {
		span.setAttribute('class','unknown_datum_name');
	}
	var text = this._doc.createTextNode(chunk[1]);
	field.appendChild(text);

	span.appendChild(field);
	dt.appendChild(span);
	if (path ) {
		this._buildEvalControls(tag, dt, frag, blockid, 'singleItem');
	}
	var dd = this._doc.createElement('dd');
	var txt = "?";
	if (chunk[2]) {
		if (typeof chunk[2] == 'string') {
			txt = chunk[2];
		} else {
			lines = [];
			// this._schema._renderItemValue(lines, chunk[2]);
			BaseDictWrapper.prototype._renderItemValue(lines, chunk[2]);
			txt = lines.join('');
		}
	}


	var bounds = this._textExtents(txt);
	var text = this._doc.createElement('textarea');
	text.setAttribute('cols',bounds.cols);
	text.setAttribute('rows',1);
	text.setAttribute('onfocus','this.rows ='+bounds.rows
			+ ' ; this.cols ='+ bounds.cols +';');
	text.setAttribute('onblur','this.rows=1;this.cols='+ bounds.cols +';');
	text.setAttribute('style','resize: none');
	text.appendChild(this._doc.createTextNode(txt));

	text.onchange = function(event) { frag._onViewChange(event);} ;
	frag._view = text;

	dd.appendChild(text);
	dl.appendChild(dd);
	parentXmlNode.appendChild(dl);
	return dd;
};


HierarchyView.prototype._buildEvalControls = function(tag, dt, frag, blockid, mode) {
	// add link to eval the method

	var item = this._schema.getItemDefn(tag.toLowerCase()); 
	var hasMethod;
	if (item && this._schema._method_purpose ) {
		hasMethod = item.getAttribute(this._schema._method_purpose);
		if (! hasMethod) {
			// in DDL_star, the 'evaluation' purpose may be implied
			var m  = item.getAttribute(this._schema._method_expression);
			if (m) hasMethod = 'evaluation';
		}
		if (hasMethod) {
			hasMethod = [ hasMethod];
		} else {
			hasMethod = item.getAttributeLoop(this._schema._method_purpose);
			if (hasMethod) {  // returned map {'map':keymap, 'rows':rows}
				var idx = hasMethod['map'][this._schema._method_purpose]; 
				var rows = hasMethod['rows'];
				var list = [];
				for (var i = 0; i < rows.length; i++) {
					list.push(rows[i][idx]);
				}
				hasMethod = list;
			}
		}
	}
//	this._log(tag + "  has path and "+hasMethod + " xx " + item + 
//	" zzz " + this._schema._method_purpose );
	if (hasMethod) { 
		for (var i = 0; i < hasMethod.length; i++) {
			var purpose = hasMethod[i].toLowerCase();
			dt.appendChild(this._doc.createTextNode('\240'));
			var gen = this._doc.createElement("span");
			gen.setAttribute('class','cif_control');
			var field1 = this._doc.createElement('a');
			field1.setAttribute('href','#');
			if (purpose == 'evaluation') { 
				field1.onclick = this._getContext(mode, tag, frag, blockid);
				field1.appendChild(this._doc.createTextNode("Eval"));
			} else if (purpose == 'definition') { 
				field1.onclick = this._getContext(mode+'Defn', tag, frag, blockid);
				field1.appendChild(this._doc.createTextNode("Defn"));
			} else if (purpose == 'validation') { 
				field1.onclick = this._getContext(mode+'Valid', tag, frag, blockid);
				field1.appendChild(this._doc.createTextNode("Valid"));
			}
			gen.appendChild(field1);
			dt.appendChild(gen);
		}
	}
	return dt;
};


HierarchyView.prototype._textExtents = function(txt) {
	if (txt && (typeof txt == 'string') ) {
		var lines = txt.split(/\n/);
		lmax = 0;
		for (var l = 0; l<lines.length;l++) {
			var line = lines[l]; 
			lmax = Math.max(lmax, line.length);
		}
		return {'rows':lines.length, 'cols':lmax};
	}
	return {'rows':1, 'cols':4};
};

HierarchyView.prototype._renderComment = function(frag, parentXmlNode) {
	var chunk = frag._data;
	var div = this._doc.createElement('div');
	div.setAttribute('class','comment');
	var text = this._doc.createElement('input');
	div.appendChild(text);
	text.setAttribute('class','comment');
	text.setAttribute('data-role','none');
	text.setAttribute('type','text');
	text.setAttribute('size',chunk[1].length);
	text.setAttribute('value',chunk[1]);
	parentXmlNode.appendChild(div);
};


HierarchyView.prototype._renderLoop = function(frag, parentXmlNode, blockid) {
	var chunk = frag.getJSON();

	var dl = this._doc.createElement('dl');
	var dt = this._doc.createElement('dt');
	var dd = this._doc.createElement('dd');
	dl.appendChild(dt);
	dl.appendChild(dd);
	var text = this._doc.createTextNode("loop_");
	dt.appendChild(text);
	//dl = this._doc.createElement('dl');
	var span = this._doc.createElement('div');
	dd.appendChild(span);

	var values = this._doc.createElement('div');
	span.appendChild(values);
	var fieldCnt = 0;
	for (var k = 0; k < chunk[1].length; k++) { 
		var span = this._doc.createElement('div');
		var tag = chunk[1][k]; 
		if (typeof tag == 'string') {
			span.setAttribute('class','datum_name');
			if (this._modelType == 'cif') {
				span.setAttribute('id', this._prefix + blockid + tag.toLowerCase());
			}
			var field = this._doc.createElement('a');
			var path;
			if (this._schema) {
				path = this._schema.getItemPath(tag.toLowerCase()); 
			}
			if (path) {
				var prefix = this._schema.getItemDictPrefix(tag.toLowerCase()); 
				// href.nodeValue = "#dic:" + path[0];
				field.setAttribute('href','#');
				field.setAttribute('onclick',"CifJs.openPath(function() {return CifJs._meta_dict.getItemPath('" + tag.toLowerCase() + "');},'"+ prefix +"')");
//				field.onclick = new Function("CifJs.openPath('dic:','" + path + "')");
			} else {
				span.setAttribute('class','unknown_datum_name');
			}
			span.appendChild(field);
			values.appendChild(span);
			var name = this._doc.createElement('span');
			field.appendChild(name);
			var text = this._doc.createTextNode(tag);
			name.appendChild(text);
			fieldCnt++;
			if (path ) {
//				this._buildEvalControls(tag, values, frag, blockid, 'loopItem');
				this._buildEvalControls(tag, span, frag, blockid, 'loopItem');
			}

		}
		else {
			span.setAttribute('class','comment');
			var text = this._doc.createElement('input');
			span.appendChild(text);
			text.setAttribute('class','comment');
			text.setAttribute('data-role','none');
			text.setAttribute('type','text');
			text.setAttribute('size',tag[1].length);
			text.setAttribute('value',tag[1]);
			text.setAttribute('data-loopRef', 'hc'+k);
			text.onchange = function(event) { frag._onViewChange(event);} ;
			values.appendChild(span);
		}
//		values.appendChild(this._doc.createElement('br'));
	}

	var tabdiv = this._doc.createElement('div');
	dd.appendChild(tabdiv);
	tabdiv.setAttribute('class', 'data_loop_container');


	var table = this._doc.createElement('table');
	table.setAttribute('class', 'data_loop');
	tabdiv.appendChild(table);

	var thead = this._doc.createElement('thead');
	table.appendChild(thead);
	var tbody = this._doc.createElement('tbody');
	table.appendChild(tbody);
	var trow = this._doc.createElement('tr');
	tbody.appendChild(trow);

	var values = chunk[2];
	var l = -1;
	var line = [];
	var sep  = '\t';
	var row = 0;
	for (var i = 0; i < values.length; i++) { 
		l++;
		var val = values[i]; 
		if (typeof val == 'object' && val[0] =='@comment') {
			var td = this._doc.createElement('td');
			var sp = this._doc.createElement('span');
			sp.setAttribute('class','comment');
			td.appendChild(sp);
			var text = this._doc.createElement('input');
			sp.appendChild(text);
			text.setAttribute('type','text');
			text.setAttribute('class','comment');
			text.setAttribute('data-role','none');
			//var txt = '#' + val[1];
			var txt = val[1];
			text.setAttribute('size',txt.length);
			text.setAttribute('value',txt);
			if (l > 0 && l < fieldCnt){
				for (var f = l;f<fieldCnt; f++) { 
					var td1 = this._doc.createElement('td');
					trow.appendChild(td1); // empty cell
				}
			}
			trow.appendChild(td); // as single row with a comment
			text.setAttribute('data-loopRef', 'r'+row+ 'c'+fieldCnt);
			text.onchange = function(event) { frag._onViewChange(event);} ;
			trow = this._doc.createElement('tr');
			tbody.appendChild(trow);
			row++;
			if (l >0 && l < fieldCnt) {
				for (var f = 0;f<l; f++) { 
					var td1 = this._doc.createElement('td');
					trow.appendChild(td1); // empty cell
				}
			}
			if (l == fieldCnt) l = -1;
		} else {
			//l++;
			if (l >=fieldCnt) {
				l = 0;
				trow = this._doc.createElement('tr');
				tbody.appendChild(trow);
				row++;
			} 
			var td = this._doc.createElement('td');
			trow.appendChild(td);

			var txt = val;
			if (typeof val == 'string') {
			} else {
				var line  = [];
				BaseDictWrapper.prototype._renderItemValue(line, val);
				txt = line.join('');
			}

			var text = this._doc.createElement('textarea');
			this._renderTextValue(text,txt);
			text.setAttribute('data-loopRef', 'r'+row+ 'c'+l);
			text.onchange = function(event) { frag._onViewChange(event);} ;
			td.appendChild(text);
		}
	}
	// dump up any residuals ????
	parentXmlNode.appendChild(dl);
	frag._view = dl; // or [ ,pre]
	return dl;
};

HierarchyView.prototype.addLoopRow = function(frag, view, vals, klass) {
	//var tbody = view.children[1].children[1]; // dl dt dd table 
	var table = view.children[1].children[1].children[0]; // dl dt dd table 
	if (table.nodeName.toUpperCase()!=="TABLE") {
		throw new Error("Aborting table update of non table element" +table.nodeName  ); 
	}
	var tbody = table.lastChild;
	if (tbody.nodeName.toUpperCase()!=="TBODY") {
		throw new Error("Aborting table update of non tbody element" +tbody.nodeName  ); 
	}

	var rows = tbody.children;
	var row = rows.length;
	var trow = this._doc.createElement('tr');
	tbody.appendChild(trow);
	for (var l = 0; l < vals.length; l++ ) {
		var td = this._doc.createElement('td');
		trow.appendChild(td);
		var val = vals[l];
		var txt = val;
		if (typeof val == 'string') {
		} else {
			var line  = [];
			BaseDictWrapper.prototype._renderItemValue(line, val);
			txt = line.join('');
		}

		var text = this._doc.createElement('textarea');
		this._renderTextValue(text,txt, klass);
		text.setAttribute('data-loopRef', 'r'+row+ 'c'+l);
		text.onchange = function(event) { frag._onViewChange(event);} ;
		td.appendChild(text);
	} 
};

HierarchyView.prototype.updateLoopValue = function(view, vptr, val, klass) {
	//var tbody = view.children[1].children[1]; // dl dt dd table 
	/*
  dl
    dt  loop_
    dd
      div
        headers
      div
        table tbody
	 */
	var table = view.children[1].children[1].children[0]; // dl dt dd table 
	if (table.nodeName.toUpperCase()!=="TABLE") {
		throw new Error("Aborting table update of non table element" +table.nodeName  ); 
	}
	var tbody = table.lastChild;
	if (tbody.nodeName.toUpperCase()!=="TBODY") {
		throw new Error("Aborting table update of non tbody element" +tbody.nodeName  ); 
	}

	var rows = tbody.children;
	var tdcnt = 0;
	var cell;
	for (var i=0; i< rows.length; i++) {
		var row = rows[i];
		var kids = row.children.length;
		if (vptr < tdcnt + kids) {
			var j = vptr - tdcnt;
			cell = row.children[j];
			break;
		} 
		tdcnt += kids;
	}

	if (cell && cell.firstChild && 
			cell.firstChild.nodeName.toUpperCase() == "TEXTAREA") {
		var txt ;
		if (typeof val == 'string') {
			txt = val;
		} else {
			var line  = [];
			BaseDictWrapper.prototype._renderItemValue(line, val);
			txt = line.join('');
		}

		var text = this._doc.createElement('textarea');
		this._renderTextValue(cell.firstChild, txt, klass);
	} 
};


HierarchyView.prototype._renderTextValue = function(textarea, txt, klass) {
	var bounds = this._textExtents(txt);
	var rows= bounds.rows;
	if (rows >4) rows = 1;
	textarea.setAttribute('cols',bounds.cols);
	textarea.setAttribute('rows',rows);
	textarea.setAttribute('onfocus','this.rows ='+bounds.rows
			+ ' ; this.cols ='+ bounds.cols +';');
	textarea.setAttribute('onblur','this.rows='+rows+';this.cols='+ bounds.cols +';');
	textarea.setAttribute('style','resize: none');
	textarea.value = txt;
	if (klass) {
		textarea.className = klass; // override existing classes?
	}
	return textarea;
};


HierarchyView.prototype._renderSave = function(frag, parentXmlNode) {
	var chunk = frag._data;
	var dl = this._doc.createElement('dl');
	parentXmlNode.appendChild(dl);
	var dt = this._doc.createElement('dt');
	dl.appendChild(dt);

	var a = this._doc.createElement('a');
	dt.appendChild(a);
	//var strn = chunk[1];
	var strn = frag._name;

	text = this._doc.createTextNode("[+]\240");
	a.appendChild(text);
	text = this._doc.createTextNode(strn);
	strn = this._prefix + strn; 
	dt.setAttribute('id', this._esc(strn));
//	this._log("setId " + strn);
	a.setAttribute('href', '#' + this._esc(strn));

	a.appendChild(text);
	a.setAttribute('onclick',"CifJs.displayStateFlip('" + this._esc(strn) 
			+ "');event.returnValue=false;return false;");

	var dd = this._doc.createElement('dd');
	dd.style.display = "none";
	dl.appendChild(dd);
	return dd;
};
