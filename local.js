"use strict";

/* Localstorage Service */

var Local = {
    set: function(key, value) {
		 if(Array.isArray(value)) {
            value.toString();
        }
		else if(typeof value == 'object' && value !== null) {
			value = JSON.stringify(value);
		}

		localStorage.setItem(key, value);
	}, 

	get: function(key) {
        var values = localStorage.getItem(key);

        //Object
        if(values && values.indexOf('{') == 0 && values.indexOf('}') == values.length-1) {
            values = JSON.parse(values);
        }
        //Array
        else if(values && ~values.indexOf(',')) {
			values = values.split(',');
		}

		return values;
	},

	delete: function(key) { //Completely erase a row
		Local.set(key, '');
	},

	clear: function() {
		localStorage.clear();
	},

	push: function(key, value) {
		var localValue = Local.get(key);

		if(localValue && Array.isArray(localValue)) {
			localValue.push(value);
		}
        else if(localValue && typeof localValue == 'object') {
            localValue[localValue.length] = value;
        }
        else if(!localValue) {
            localValue = [value];
        }

        Local.set(localValue);
	},

	remove: function(key, value) { //Delete just a part of the string
		var localValue = Local.get(key);

        if(localValue && Array.isArray(localValue) && ~localValue.indexOf(value)) {
            localValue.splice(localValue.indexOf(value), 1);
        }
        else if(localValue && typeof localValue == 'object') {
            delete localValue[value];
        }

		Local.set(key, localValue);
	},

	in: function(key, value) {
		var localValue = Local.get(key);

        if(localValue && Array.isArray(localValue) && ~localValue.indexOf(value)) {
            return true;
        }
        else if(localValue && typeof localValue == 'object' && localValue[value]) {
            return true;
        }
        else if(localValue && localValue == value) {
        	return true;
        }

        return false;
	}
};
