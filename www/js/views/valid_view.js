

function  ValidationHandler(doc, dict, logger, filename, prefix) {
	this._doc = null;
	this._filename = null; 
	this._modelType = 'cif';

	this._view = doc.getElementById('valid');
	this._cifRoot = null;
	this._stacks =  null;

	if (arguments.length) { this._init(doc, dict, logger, filename, prefix); }

}

//we add our own extensions to this BaseDictWrapper instance
ValidationHandler.prototype = new ValidationBase();

ValidationHandler.prototype._init = function(doc, dict, logger, filename, prefix) {
	this.__tmpinit = ValidationBase.prototype._init;
	// now Dict constructor thinks it belongs to DDL1
	this.__tmpinit(dict, logger, filename);
	this._doc = doc;
	this._filename = filename;
	this._stacks;
	this._prefix = prefix;
};


ValidationHandler.prototype.reset = function() {
	if (this._stacks) {
		for (var blk in this._stacks) {
			this.resetBlock(blk);
		} 
	}

	if (this._cifRoot) {
		this._view.removeChild(this._cifRoot);
	}
	this._stacks =  null;
};


ValidationHandler.prototype.resetBlock = function(blockid) {
	if (this._stacks && (blockid in this._stacks)) {
		var stack = this._stacks[blockid];
		var view = stack['view'];
		delete this._stacks[blockid]; 
		view[0].removeChild(view[1]);
	} 
};


ValidationHandler.prototype._addCif = function() {
	var div = this._doc.createElement('div');
	div.setAttribute("class", this._modelType);
	this._view.appendChild(div);
	var h2 = this._doc.createElement('h2');
	var title = this._doc.createTextNode(this._filename);
	div.appendChild(h2);
	h2.appendChild(title);
	h2.setAttribute("class", this._modelType + "_filename");
	//this._stack.push(div);
	return div;
};

ValidationHandler.prototype._getStack = function( blockname ) {
	var stack;
	if (! this._stacks) {
		this._stacks = {};
		this._cifRoot = this._addCif();
	}
	if (blockname in this._stacks) {
		stack = this._stacks[blockname];
	} else {
		stack = { 'view' : [ this._cifRoot], 'items':{ } } ;
		this._stacks[blockname] = stack;
	} 
	return stack;
};

ValidationHandler.prototype.addBlock = function(cif, blockname ) {
	var stack = this._getStack(blockname);
	var viewAncestors = stack['view'];
	if (viewAncestors.length > 1) {
		// already added this block
		return;
	}
	var parnt = viewAncestors[viewAncestors.length -1];

	var div = this._doc.createElement('div');
	div.setAttribute("class", "val:block");
	parnt.appendChild(div);

	// update our records
	viewAncestors.push(div);

	var strn = blockname;
	var text = this._doc.createTextNode(strn);
	div.appendChild(text);

	var table = this._doc.createElement('table');
	div.appendChild(table);

	// update our records
	viewAncestors.push(table);

	var block = cif.getBlock(blockname);
	for (var i = 0; i < block._unresolved.length; i++)  {
		var tr = this._doc.createElement('tr');
		table.appendChild(tr);
		var td = this._doc.createElement('td');
		tr.appendChild(td);
		var div = this._doc.createElement('div');
		div.setAttribute("class", "val:item_name");
		var text = this._doc.createTextNode(block._unresolved[i]._name );
		div.appendChild(text);
		td.appendChild(div);
		// fail / success
		td = this._doc.createElement('td');
		tr.appendChild(td);
		var img = this._doc.createElement('img');
		img.setAttribute("src", "img/cross.jpg");
		td.appendChild(img);
		// rows
		td = this._doc.createElement('td');
		tr.appendChild(td);
		// message
		td = this._doc.createElement('td');
		tr.appendChild(td);
		text = this._doc.createTextNode("Undefined item name.");
		td.appendChild(text);
	}

	for (var i = 0; i < block._unresolvedLoopItems.length; i++)  {
		var tr = this._doc.createElement('tr');
		table.appendChild(tr);
		var td = this._doc.createElement('td');
		tr.appendChild(td);
		var div = this._doc.createElement('div');
		div.setAttribute("class", "val:item_name");
		var text = this._doc.createTextNode(block._unresolvedLoopItems[i] );
		div.appendChild(text);
		td.appendChild(div);
		// fail / success
		td = this._doc.createElement('td');
		tr.appendChild(td);
		var img = this._doc.createElement('img');
		img.setAttribute("src", "img/cross.jpg");
		td.appendChild(img);
		// rows
		td = this._doc.createElement('td');
		tr.appendChild(td);
		// message
		td = this._doc.createElement('td');
		tr.appendChild(td);
		text = this._doc.createTextNode("Undefined looped item name.");
		td.appendChild(text);
	}
};


ValidationHandler.prototype._addItemRec = function(parnt, blkname, name) {

	var tr = this._doc.createElement('tr');
	parnt.appendChild(tr);
	var td = this._doc.createElement('td');
	tr.appendChild(td);
	var div = this._doc.createElement('div');
	div.setAttribute("class", "val:item_name");
	var a = this._doc.createElement('a');
	a.setAttribute('href','#');
	a.setAttribute('onclick',"CifJs.openCifPath('" + this._prefix+"','"+blkname +
			"','" + name.toLowerCase()+"');event.returnValue=false; return false;");
	div.appendChild(a);
	var text = this._doc.createTextNode(name);
	a.appendChild(text);
	td.appendChild(div);

	//  tick or fail slot
	var vtd = this._doc.createElement('td');
	tr.appendChild(vtd);
	var img = this._doc.createElement('img'); // assume
	img.setAttribute("src", "img/tick.jpg");
	vtd.appendChild(img);
	//  rows
	var rtd = this._doc.createElement('td');
	tr.appendChild(rtd);
	// row based result table
	td = this._doc.createElement('td');
	tr.appendChild(td);

	var table = this._doc.createElement('table');
	td.appendChild(table);
	table.style.display = "none";
	return {'valid':[true, vtd] , 'rows' : [0, rtd, { } ], 'messages': table }; 
};

ValidationHandler.prototype._addItemRecRow = function(itemRec, row) {

	var rowdata = itemRec['rows'];
	var rowcnt = rowdata[0] ;
	var rowdef = rowdata[2];
	if (row in rowdef) {
		return rowdef[row];
	}
	rowcnt = rowcnt + 1;
	if (rowcnt >1) {
		var y = rowdata[1].firstChild;
		if (y) rowdata[1].removeChild(y);
		text = this._doc.createTextNode(rowcnt);
		rowdata[1].appendChild(text);
	}
	rowdata[0] = rowcnt;
	var tab = itemRec['messages'];
	var tr = this._doc.createElement('tr');
	tab.appendChild(tr);

	td = this._doc.createElement('td');
	tr.appendChild(td);
	text = this._doc.createTextNode(row);
	td.appendChild(text);
	rowdef[row] = tr;
	return tr;
};

ValidationHandler.prototype.addItem = function(blkname, name, row, cont, type) {
	var stack = this._getStack(blkname);
	var viewAncestors = stack['view'];
	var parnt = viewAncestors[viewAncestors.length -1];
	var items = stack['items'];
	var itemRec = items[name];

	if (! itemRec) {
		itemRec = this._addItemRec(parnt, blkname,  name);
		items[name] = itemRec;
	}

	var tab = itemRec['messages'];
	var tr = this._addItemRecRow(itemRec, row);

	var td = this._doc.createElement('td');
	tr.appendChild(td);
	if (cont) {
		this._invalidateRec(itemRec);
		text = this._doc.createTextNode(cont);
		td.appendChild(text);
	}

	td = this._doc.createElement('td');
	tr.appendChild(td);
	if (type) {
		this._invalidateRec(itemRec);
		text = this._doc.createTextNode(type);
		td.appendChild(text);
	}
};

ValidationHandler.prototype._invalidateRec = function(itemRec ){
	itemRec['valid'][0] = 'false';
	var imgCont = itemRec['valid'][1];
	var y = imgCont.firstChild;
	imgCont.removeChild(y);
	var img = this._doc.createElement('img'); // assume
	img.setAttribute("src", "img/cross.jpg");
	imgCont.appendChild(img);
	var tab = itemRec['messages'];
	tab.style.display = "block";
};

/*
 * This is the validation Throw() 
 *
 */

ValidationHandler.prototype.appendItem = function(cif, blkname, name, row, fault, level){

	var stack = this._getStack(blkname);
	var viewAncestors = stack['view'];
	if (viewAncestors.length == 1) {
		this.addBlock(cif,blkname);
	}
	var parnt = viewAncestors[viewAncestors.length -1];

	var itemRec = stack['items'][name];
	if (! itemRec) {
		itemRec = this._addItemRec(parnt, blkname, name);
		stack['items'][name] = itemRec;
	}

	// if (! level) { 
	this._invalidateRec(itemRec);
	// } 
	var tab = itemRec['messages'];
	var tr = this._addItemRecRow(itemRec, row);
	td = this._doc.createElement('td');
	tr.appendChild(td);
	var span = this._doc.createElement('span');
	td.appendChild(span);
	if (! level) { 
		text = this._doc.createTextNode( fault);
		span.setAttribute("style", "color:red;");
	} else {
		var map = {'A':'red', 'B':'orange', 'C':'yellow'};
		text = this._doc.createTextNode("Alert level " + level + ": " + fault);
		if (level in map) {
			span.setAttribute("style", "color:" + map[level] + ";");
		} else {
			span.setAttribute("style", "color:magenta;");
		} 
	}
	span.appendChild(text);
};


