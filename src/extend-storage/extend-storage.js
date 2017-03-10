;(function(global, factory){

	if(typeof module === 'object' && typeof module.exports === 'object'){
		module.exports = factory();
	}else if(typeof define === 'object'){
		define(factory);
	}else{
		factory(true);
	}

})(window, function(isGlobal){
	"use strict";

	// 设置最大时间戳
	var maxTimeStamp = 'Fri, 31 Dec 9999 23:59:59 UTC';

	// 获取当前时间，可以根据用户自己传入的时间格式进行转换
	var _getTimeStamp = function(date){
		if(date) return new Date(date).valueOf();
		return new Date().valueOf();
	}

	// 增加超时时间戳
	var _addTimeStamp = function(time,base){
		var nowTime = base ? _getTimeStamp(base) : _getTimeStamp();
		if(!isNaN(time)){
			return nowTime + parseInt(time);
		}else{
			return _getTimeStamp(maxTimeStamp);
		}
	}

	// 判断该项是否超时
	var _isExpries = function(exp, base){
		if(base){
			return exp < base;
		}else{
			return exp < _getTimeStamp();
		}
	};

	// 用于对象的拼接
	var _extend = function(oldObj, newObj){
		if(!newObj){
			return oldObj;
		}
		
		for(var key in newObj){
			oldObj[key] = newObj[key];
		}

		return oldObj;
	}

	// 将json对象转换为string对象
	var _toString = function(data){
		if(data === null){
			return data;
		}

		var isObject = typeof data === 'object';

		if(isObject){
			return JSON.stringify(data)
		}else{
			return data;
		}
	};

	// 将string对象转换为json对象
	var _toJSON = function(data){
		if(typeof data !== 'string'){
			return data;
		}else{
			try {
				return JSON.parse(data);
			}catch(e){
				return data;
			}
			
		}
	};

	var _crypt = {
		base64: {
			encrypt: function(e){
				return e;
			},
			decrypt: function(c){
				return c;
			}
		}
	}

	// 对将要存入的对象转换格式，添加额外的参数
	var _setExtraData = function(value, options){
		var finalData = {};
		finalData.c = options.baseTime;
		finalData.e = options.exp;
		finalData.v = value;

		return finalData;
	}

	// 判断浏览器是否支持Storage
	var _isSupportStorage = function(type){
		var isSupportLS = window.localStorage instanceof Storage;
		var isSupportSS = window.sessionStorage instanceof Storage;

		switch(type){
			case 'localStorage': 
				return isSupportLS;
			case 'sessionStorage':
				return isSupportSS;
			default:
				return isSupportLS && isSupportSS;
		}
	};

	// API
	var ExtendStorageAPI = {
		// 添加
		addItem: function(key, value, opt){
			if(typeof key !== 'string'){
				key = String(key);
			}

			if(opt && opt.exp){
				opt.exp = _addTimeStamp(opt.exp,this.options.baseTime);
			}
			opt = _extend(this.options,opt);

			var itemValue = _setExtraData(value, this.options);
			this.storage.setItem(key, _toString(itemValue));
		},
		// 获取某项
		getItem: function(key){
			var item = this.storage.getItem(key);

			if(item && _toJSON(item).v){ // 判断是否有该项，以及是否为该插件赋值的项
				item = _toJSON(item);
				var e = item.e;
				if(!_isExpries(e)){ //判断是否超时
					var v = _toJSON(item.v);
					return v;
				}else{ // 超时删除
					this.deleteItem(key);
					return null;
				}
			}else{ // 返回相对应的值，如果不是该插件赋值的项，则返回它本身
				return item;
			}
		},

		// 获取所有项
		getAll: function(){
			var allItem = {};
			for(var key in this.storage){
				allItem[key] = this.getItem(key);
			}

			return allItem;
		},

		// 更新某项
		updateItem: function(key, value, opt){
			var item = this.storage.getItem(key);

			if(item){
				item = _toJSON(item);
			}else{
				return;
			}

			item.c = this.options.baseTime;

			if(opt && opt.exp){
				item.e = _addTimeStamp(opt.exp, item.c);
			};

			if(typeof value !== 'object' || value === null){
				item.v = value;
			}else{
				item.v = _extend(item.v, value);
			}

			item = _toString(item);

			this.storage.setItem(key,item);
		},
		// 更新超时时间
		updateExp: function(key, exp){
			var item = this.storage.getItem(key);

			if(item && _toJSON(item).v){
				item = _toJSON(item);
				item.e = _addTimeStamp(exp, item.c);
				item = _toString(item);
				this.storage.setItem(key,item);
			}else if(item && !_toJSON(item).v){
				this.addItem(key,item,exp);
			}
		},
		deleteItem: function(key){
			this.storage.removeItem(key);
		},
		// 删除所有超时项
		deleteAllExp: function(){
			for(var key in this.storage){
				this.getItem(key);
			}
		},
		// 删除所有项
		deleteAll: function(){
			this.storage.clear();
		},
	};

	function ExtendStorage(options){
		var defaultOpt = {
			storage: 'localStorage',
			exp: _getTimeStamp(maxTimeStamp),
			baseTime: _getTimeStamp()
		};

		var setStorageType = function(type){
			if(window[type] instanceof Storage){
				return window[type];
			}else{
				return null;
			}
		}

		this.options = _extend(defaultOpt, options);

		if(_isSupportStorage(this.options.storage)){
			this.storage = setStorageType(this.options.storage);
		}else{
			ExtendStorageAPI = null;
		}
	};

	ExtendStorage.prototype = ExtendStorageAPI;

	if(isGlobal){
		window.ExtendStorage = ExtendStorage;
	}

	return ExtendStorage;
});