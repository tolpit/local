Local
===================

Put data offline with IndexDB and LocalStorage


----------

DB.js
-------------

Connect to the indexedDB and init the stores

> **Usage :**

> DB.connect('database-name', ['store-name'], callbackWhenLoaded);

----------

Store.js
-------------------

Manipulate the stores : *save/update/remove*

> **Usage : **

	var nameStore = Store.require('name');
	
	var doc = {
		_id : "123",
		foo : "bar"
	}; 
	
	//To insert a doc in the store
	nameStore.save(doc, function () {
		console.log('insert done');
	});
	
	 //To fetch all the docs
	 nameStore.find(null, function(res) {
		 console.log(res);
	});
	
	//Only a document
	nameStore.findOne({ foo : "bar" }, function(doc) {
		console.log(doc);
	});
	
	//Update a document
	nameStore.update({ _id: "123" }, { thing: "value" }, function() {
		console.log('update done');
	}
	
	//Remove a document
	nameStore.remove("123", function() {
		console.log('remove done');
	});

----------


Local.js
-------------

Simple interface to manipulate LocalStorage, and store Array or object inside.

> **Usage :** 

    Local.set('key', 'value');
    Local.set('key', { foo: "bar" });
    Local.set('key', [1, 2, 3]);

Then

	Local.get('key');
To edit an array :
		Local.push('key', 4);
