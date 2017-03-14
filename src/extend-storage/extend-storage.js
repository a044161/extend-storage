;
(function(global, factory) {

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'object') {
        define(factory);
    } else {
        factory(true);
    }

})(window, function(isGlobal) {
    "use strict";
    
    var version = '1.0.0';

    var base64 = Base64();

    // 设置最大时间戳
    var maxTimeStamp = 'Fri, 31 Dec 9999 23:59:59 UTC';
    var _baseTime; // 设置基准时间
    var _options; // 配置项，不暴露给外部
    var _isSupport; // 浏览器是否支持Storage

    // 深拷贝对象
    var _deepCopy = function(obj){
    	var newObj = {};

    	for(var key in obj){
    		newObj[key] = obj[key];
    	}

    	return newObj;
    };

    // 获取时间，当用户的基准时间为一个函数时，则执行该函数，不是的话则进行时间格式转换
    var _getTimeStamp = function(date) {
    	var _date;
        if (date){
        	var _date = typeof date === 'function' ? date() : new Date(date).valueOf();
        }else{
        	var _date = new Date().valueOf();
        }

        if(isNaN(_date)){
        	var arg = typeof date === 'function' ? _date : date;
        	throw new Error('argument "' + arg + '" must be Number');
        }else{
        	return _date;
        }
    }

    // 增加超时时间戳
    var _addTimeStamp = function(time, base) {
        var nowTime = _getTimeStamp(base);
        if (!isNaN(time)) {
            return nowTime + parseInt(time);
        } else {
        	throw new Error('argument "' + time + '" must be Number');
        }
    }

    // 判断该项是否超时
    var _isExpries = function(exp, base) {
        if (base) {
            return exp < base;
        } else {
            return exp < _getTimeStamp();
        }
    };

    // 用于对象的拼接
    var _extend = function(oldObj, newObj) {
        if (!newObj) {
            return oldObj;
        }

        var _oldObj = _deepCopy(oldObj);

        for (var key in newObj) {
            _oldObj[key] = newObj[key];
        }
        oldObj = null;
        return _oldObj;
    }

    // 将json对象转换为string对象
    var _toString = function(data) {
        if (data === null) {
            return data;
        }

        var isObject = typeof data === 'object';

        if (isObject) {
        	return JSON.stringify(data)
        } else {
            return data;
        }
    };

    // 将string对象转换为json对象
    var _toJSON = function(data) {
        if (typeof data !== 'string') {
            return data;
        } else {
            try {
                return JSON.parse(data);
            } catch (e) {
                return data;
            }

        }
    };

    // 加密/解密
    var _crypt = function(type){
    	switch(type){
    		case 'base64':
    			return {
    				encode: function(e) {
		                return base64.encode(e);
		            },
		            decode: function(c) {
		                return base64.decode(c);
		            }
    			}
    		default:
    			return{
    				encode: function(e) {
		                return e;
		            },
		            decode: function(c) {
		                return c;
		            }
    			}
    	}
    };
   

    // 对将要存入的对象转换格式，添加额外的参数
    var _setExtraData = function(value, options) {
        var finalData = {};
        finalData.c = _getTimeStamp(options.baseTime); // 创建时间
        finalData.e = options.exp; // 超时时间
        finalData.v = _crypt(options.crypt).encode(_toString(value)); // 对值进行加密处理

        return finalData;
    }

    // 判断浏览器是否支持Storage
    var _isSupportStorage = function(type) {
    	try{
    		var isSupportLS = window.localStorage instanceof Storage;
	        var isSupportSS = window.sessionStorage instanceof Storage;

	        switch (type) {
	            case 'localStorage':
	                return isSupportLS;
	            case 'sessionStorage':
	                return isSupportSS;
	            default:
	                return isSupportLS && isSupportSS;
	        }
    	}catch(e){
    		throw new Error("don't support Web Storage");
    	}
        
    };

    _isSupport = _isSupportStorage();


    // http://crocodillon.com/blog/always-catch-localstorage-security-and-quota-exceeded-errors
    // 超过存储大小的错误判断
    var _isQuotaExceeded = function(e) {
        var quotaExceeded = false;
        if (e) {
            if (e.code) {
                switch (e.code) {
                    case 22:
                    quotaExceeded = true;
                    break;
                    case 1014:
                    // Firefox
                    if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        quotaExceeded = true;
                    }
                    break;
                }
            } else if (e.number === -2147024882) {
                // Internet Explorer 8
                quotaExceeded = true;
            }
        }
        return quotaExceeded;
    }

    // API
    var ExtendStorageAPI = {
        // 添加
        setItem: function(key, value, opt) {
            if (typeof key !== 'string') {
                key = String(key);
            }

            if (opt && opt.exp) { // 判断用户是否有设置超时时间
                opt.exp = _addTimeStamp(opt.exp, _options.baseTime);
            }

            // 传递配置项，用于之后的其他字段的添加使用 _setExtraData
            opt = _extend(_options, opt);

            // 生成保存项
            var itemValue = _setExtraData(value, opt);

            this._saveDataWithHandleError(key, _toString(itemValue));
        },
        // 获取某项
        getItem: function(key) {
            var item = this.storage.getItem(key);

            if (item && _toJSON(item).v) { // 判断是否有该项，以及是否为该插件赋值的项
                item = _toJSON(item); 
                var e = item.e;
                var c = item.c;
                //判断是否超时
                if (!_isExpries(e,c)) { // 没有超时则返回对应的值，不返回创建时间和超时时间字段
                	try{
                		var v = _toJSON(_crypt(_options.crypt).decode(item.v));
                    	return v;
                	}catch(e){
                		return item;
                	}
                    
                } else { // 超时删除
                    this.deleteItem(key);
                    return null;
                }
            } else { // 返回相对应的值，如果不是该插件赋值的项，则返回它本身
                return item;
            }
        },

        // 获取所有项
        getAll: function() {
            var allItem = {};
            for (var key in this.storage) {
                allItem[key] = this.getItem(key);
            }

            return allItem;
        },

        // 更新某项
        updateItem: function(key, value, opt) {
            var item = this.storage.getItem(key);

            // 对值进行转换
            if (item) {
                item = _toJSON(item);
                item.v = _toJSON(_crypt(_options.crypt).decode(item.v));
            } else {
                return item;
            }

            // 更新时，同时更新创建时间
            item.c = _getTimeStamp(_options.baseTime);

            // 更新超时时间
            if (opt && opt.exp) { 
                item.e = _addTimeStamp(opt.exp, item.c);
            };

            // 判断值是否为JSON对象
            if (typeof value !== 'object' || value === null) {
                item.v = value;
            } else {
                item.v = _crypt(_options.crypt).encode(_toString(_extend(item.v, value)));
            }

           	// 对心值进行转换
            item = _toString(item);

            this._saveDataWithHandleError(key, item);
        },
        // 更新超时时间
        updateExp: function(key, exp) {
            var item = this.storage.getItem(key);

            if (item && _toJSON(item).v) {
                item = _toJSON(item);
                item.e = _addTimeStamp(exp, item.c);
                item = _toString(item);
                this._saveDataWithHandleError(key, item);
            } else if (item && !_toJSON(item).v) {
                this.setItem(key, item, exp);
            } else {
            	return item;
            }
        },
        // 删除单个项
        deleteItem: function(key) {
            this.storage.removeItem(key);
        },
        // 删除所有超时项
        deleteAllExp: function() {
            for (var key in this.storage) {
                this.getItem(key);
            }
        },
        // 删除所有项
        deleteAll: function() {
            this.storage.clear();
        }
    };

    function ExtendStorage(options) {
    	this.version = version;
        var defaultOpt = {
            storage: 'localStorage',
            exp: _getTimeStamp(maxTimeStamp),
            baseTime: _getTimeStamp(),
            crypt: 'base64'
        };

        // 设置 Storage 类型，默认为 localStorage
        var setStorageType = function(type) {
            if (window[type] instanceof Storage) {
                return window[type];
            } else {
                return null;
            }
        }

        // 保存数据时对是否超过容量进行异常处理
        this._saveDataWithHandleError = function(key, value){
        	try{
        		this.storage.setItem(key, value);
        	}catch(e){
        		if(_isQuotaExceeded(e)){
        			this.deleteAllExp();
        			try{
        				this.storage.setItem(key, value);
        			}catch(e){
        				throw e;
        			}
        		}else{
        			throw e;
        		}
        	}
        }

        // 设置全局配置项
        _options = _extend(defaultOpt, options);
        // 设置基准时间
        _baseTime = _options.baseTime;

        this.storage = setStorageType(_options.storage);
    };

    ExtendStorage.prototype = ExtendStorageAPI;

    /*! http://mths.be/base64 v0.1.0 by @mathias | MIT license */
    function Base64 () {
        var InvalidCharacterError = function(message) {
            this.message = message;
        };
        InvalidCharacterError.prototype = new Error;
        InvalidCharacterError.prototype.name = 'InvalidCharacterError';

        var error = function(message) {
            // Note: the error messages used throughout this file match those used by
            // the native `atob`/`btoa` implementation in Chromium.
            throw new InvalidCharacterError(message);
        };

        var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        // http://whatwg.org/html/common-microsyntaxes.html#space-character
        var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

        // `decode` is designed to be fully compatible with `atob` as described in the
        // HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
        // The optimized base64-decoding algorithm used is based on @atk’s excellent
        // implementation. https://gist.github.com/atk/1020396
        var decode = function(input) {
            input = String(input)
                .replace(REGEX_SPACE_CHARACTERS, '');
            var length = input.length;
            if (length % 4 == 0) {
                input = input.replace(/==?$/, '');
                length = input.length;
            }
            if (
                length % 4 == 1 ||
                // http://whatwg.org/C#alphanumeric-ascii-characters
                /[^+a-zA-Z0-9/]/.test(input)
            ) {
                error(
                    'Invalid character: the string to be decoded is not correctly encoded.'
                );
            }
            var bitCounter = 0;
            var bitStorage;
            var buffer;
            var output = '';
            var position = -1;
            while (++position < length) {
                buffer = TABLE.indexOf(input.charAt(position));
                bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
                // Unless this is the first of a group of 4 characters…
                if (bitCounter++ % 4) {
                    // …convert the first 8 bits to a single ASCII character.
                    output += String.fromCharCode(
                        0xFF & bitStorage >> (-2 * bitCounter & 6)
                    );
                }
            }
            return output;
        };

        // `encode` is designed to be fully compatible with `btoa` as described in the
        // HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
        var encode = function(input) {
            input = String(input);
            if (/[^\0-\xFF]/.test(input)) {
                // Note: no need to special-case astral symbols here, as surrogates are
                // matched, and the input is supposed to only contain ASCII anyway.
                error(
                    'The string to be encoded contains characters outside of the ' +
                    'Latin1 range.'
                );
            }
            var padding = input.length % 3;
            var output = '';
            var position = -1;
            var a;
            var b;
            var c;
            var d;
            var buffer;
            // Make sure any padding is handled outside of the loop.
            var length = input.length - padding;

            while (++position < length) {
                // Read three bytes, i.e. 24 bits.
                a = input.charCodeAt(position) << 16;
                b = input.charCodeAt(++position) << 8;
                c = input.charCodeAt(++position);
                buffer = a + b + c;
                // Turn the 24 bits into four chunks of 6 bits each, and append the
                // matching character for each of them to the output.
                output += (
                    TABLE.charAt(buffer >> 18 & 0x3F) +
                    TABLE.charAt(buffer >> 12 & 0x3F) +
                    TABLE.charAt(buffer >> 6 & 0x3F) +
                    TABLE.charAt(buffer & 0x3F)
                );
            }

            if (padding == 2) {
                a = input.charCodeAt(position) << 8;
                b = input.charCodeAt(++position);
                buffer = a + b;
                output += (
                    TABLE.charAt(buffer >> 10) +
                    TABLE.charAt((buffer >> 4) & 0x3F) +
                    TABLE.charAt((buffer << 2) & 0x3F) +
                    '='
                );
            } else if (padding == 1) {
                buffer = input.charCodeAt(position);
                output += (
                    TABLE.charAt(buffer >> 2) +
                    TABLE.charAt((buffer << 4) & 0x3F) +
                    '=='
                );
            }

            return output;
        };

        return {
            'encode': encode,
            'decode': decode,
            'version': '0.1.0'
        };
    };


    if (isGlobal) {
        window.ExtendStorage = ExtendStorage;
    }

    return ExtendStorage;
});
