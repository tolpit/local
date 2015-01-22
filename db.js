"use strict";

/* IndexDB Service: DB */
function noop(){}

var DB = {
	indexedDB     : window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
	request       : null,
	db            : null,
	name          : null,
	stores        : []
};

DB.connect = function(name, stores, callback) {
	if (!DB.indexedDB)
		console.log("Your browser doesn't support IndexedDB.");
	
	//Define part
	DB.name = name;
	DB.stores = stores;
	DB.ready = false;

	//If database is already initalized, don't need to wait
	if(DB.db)
		(callback || noop)();		

	//Launch
	DB.request = DB.indexedDB.open(name, 1);

	DB.request.onupgradeneeded = function(e) {
		var db = e.target.result;
		var tmp_stores = [];
		
		for(var i = 0; i < stores.length; i++) {
			//Pour vérifier l'existance d'un Store et définir la "clé primaire"
			if(!db.objectStoreNames.contains(stores[i])) {
				tmp_stores[i] = db.createObjectStore(stores[i], { keyPath: "_id" });
			}
		}
	};
 
	DB.request.onsuccess = function(e) {
		console.log("open with success");
 
		DB.db = e.target.result;
		DB.ready = true;

		(callback || noop)();
	};
 
	DB.request.onerror = function(e) {
		console.error(e);
	};

};

DB.delete = function(callback) {
	DB.db.close();

	var req = DB.indexedDB.deleteDatabase(DB.db.name);

	req.onerror = function(e) {
		console.log(e);
	};

	req.onsuccess = function(e) {
		return (callback || noop)();
	};
};

DB.define = function(key, value) {
	if(DB[key] !== undefined)
		DB[key] = value;
};

DB.contains = function(name) {
	return DB.db.objectStoreNames.contains(name);
};
