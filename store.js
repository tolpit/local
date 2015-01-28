"use strict";

/* IndexDB Service: Store */

function Store(name) {
	var self = this;

	this.name = name;
	this.actions = {
		populate: null,
		sort: null,
		exec: null
	};

	["sort", "populate", "exec"].forEach(function(action) {
		self[action] = function(thing) {
			self.actions[action] = thing;
			return self;
		}
	});

	return this;
}

Store.require = function(name) {
	var idx;

	for(var i = 0; i < DB.stores.length; i++) {
		if(DB.stores[i] == name)
			idx = i;
	}

	DB.stores[idx] = new Store(name);
	return DB.stores[idx];
};

Store.match = function(data, query) {
	var entry = data,
		keys  = (query ? Object.keys(query) : []),
		pass  = true;

	if(!query) {
		return true;
	}

	//When _id query
	if(query._id && keys.length == 1) {
        //If "$in"
        if(query._id['$in']) {
            if(~query._id['$in'].indexOf(data._id))
                return true;
        }
        else if(data._id == query._id) {
            return true;
        }
	}

	//Boucle de vérification
	for(var key in query) {
		if(!pass || !entry[key] || entry[key] != query[key])
			pass = false;
	}

	return pass;
};

Store.prototype.save = function(data, callback) {
	var transaction = DB.db.transaction([this.name], "readwrite"); //Bug firefox à corrigé
	var store 		= transaction.objectStore(this.name, { keyPath: "_id" });

	if(Array.isArray(data)) {
		next();
	}
	else {
		store.put(data).onsuccess = function() {
			console.log('many insert');
			(callback || noop)();
		}
	}

	//Perform the add
	function next() {
		if (data.length > 0) {
			var entry = data.shift();

        	store.put(entry).onsuccess = next;
        } 
        else { // complete
            console.log('insert complete');
            (callback || noop)();
        }
    } 		
};

Store.prototype.find = function(query, fields, callback) {
	var self = this;
	var res = [];

	//Before fetching the data
	if(typeof fields == 'function' && !callback) {
		callback = fields;
	}

	var transaction = DB.db.transaction([this.name], "readonly");
	var store = transaction.objectStore(this.name);

	//When all the data is fetch, return all
	transaction.oncomplete = function(e) {
		(callback || self.doExec.bind(self) || noop)(res);
	};

	//Récursive fetch
	var req = store.openCursor();

	//Put every entry en res
	req.onsuccess = function(e) {
		var cursor = e.target.result;

		if(cursor) {
			if((query === null && query === {}) || Store.match(cursor.value, query)) {
				res.push(cursor.value);
			}

			cursor.continue();
		}
	};

	return this;
};

Store.prototype.findOne = function(query, callback) {
    var self = this;

	this.find(query, function(res) {
        (callback || self.doExec.bind(self) || noop)(res[0]);
	});

    return this;
};

Store.prototype.findById = function(id, callback) {
    var self = this;

	var transaction = DB.db.transaction([this.name], "readonly");
	var store = transaction.objectStore(this.name);

	//Query from id key
	var request = store.get(id);

	request.onerror = function(event) {
		// Handle errors!
		console.error("Such error");
	};
	request.onsuccess = function(event) {
		(callback || self.doExec.bind(self) || noop)(request.result);
	};

    return this;
};


Store.prototype.update = function(query, data, callback) {
	var transaction = DB.db.transaction([this.name], "readwrite");
	var store 		= transaction.objectStore(this.name, { keyPath: "_id" });
	var keys  		= Object.keys(data);
	var res 		= [];

	//When all the data have been updated
	transaction.oncomplete = function(e) {
		(callback || noop)((res.length == 1 ? res[0] : res));
	};

	//Cursor
	store.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;

		if (cursor && Store.match(cursor.value, query)) {
			var entry = cursor.value;

			if(~keys.indexOf("$push")) {
				var action = data["$push"];
				var key = Object.keys(action)[0];

				//pure update
				if(entry[key] && Array.isArray(entry[key])) {
					entry[key].push(action[key]);
				}
				//new key/value
				else {
					entry[key] = [action[key]];
				}
			}
			else if(~keys.indexOf("$pull")) {
				var action = data["$pull"];
				var key = Object.keys(action)[0];

				//pure update
				if(entry[key] && Array.isArray(entry[key])) {
					var index = entry[key].indexOf(action[key]);

					if(~index) {
						entry[key].splice(index, 1);
					}
				}
			}
			else {
				//Merge the old and new data
				Object.assign(entry, data);
			}

			res.push(entry);

			//Perform the edit
			var request = store.put(entry);

			request.onerror = function(e) {
				console.error("Very Error", e.target.error.name);
			};

			request.onsuccess = function(e) {
				cursor.continue();
			};
		}
	};
};


Store.prototype.remove = function(id, callback) {
	var transaction = DB.db.transaction([this.name], "readwrite");
	var store 	    = transaction.objectStore(this.name);
	var req 		= store.delete(id);

	req.onsuccess = function(e) {
		console.log('such delete ! very effective');
		return (callback || noop)();
	}
};


Store.prototype.count = function(query, callback) {
	this.find(query, function(res) {
		return (callback || noop)(res.length);
	});

	return this;
};

Store.prototype.doPopulate = function(storeData, callback) {
	var self = this;

    if(storeData === undefined)
        return callback(null);

    if(Array.isArray(storeData)) {
        storeData.forEach(function(store, index) {
            var field = self.actions.populate; console.log(field);
            var secondStore = Store.require(field);

            secondStore.findById(store[field], function(res) {
                store[field] = res;

                if(index == storeData.length - 1)
                    callback(storeData);
            });
        });
    }
    else {
        var field = self.actions.populate;
        var secondStore = Store.require(field);

        secondStore.find({ "_id" : { "$in" : storeData[field] } }, function(res) {
            storeData[field] = res;

            callback(storeData);
        });


    }



};

Store.prototype.doExec = function(data) {
    if(!this.actions.exec) return;

	var self = this;

	//If we need to sort the result before
	if(this.actions.sort) {
		var key = this.actions.sort;

		data.sort(function(a, b) {
			if (a[key] < b[key])
				return -1;
			if (a[key] > b[key])
				return 1;
			return 0;
		});
	}

	if(this.actions.populate) {
		this.doPopulate(data, function(res) {
			self.actions.exec(res);
			self.actions.exec = null;
		});
	}
	else {
		this.actions.exec(data);
		this.actions.exec = null;
	}
};
