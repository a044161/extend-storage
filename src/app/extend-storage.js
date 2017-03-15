;
(function(global, factory) {

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'object') {
        define(factory);
    } else {
        window.extendStorage = factory();
    }

})(window, function(isGlobal) {
    "use strict";

    var version = '1.0.0';

    // 调用自带的base64
    var base64 = Base64();

    // 设置最大时间戳
    var maxTimeStamp = 'Fri, 31 Dec 9999 23:59:59 UTC';
    var _baseTime; // 设置基准时间
    var _options; // 配置项，不暴露给外部
    var _isSupport; // 浏览器是否支持Storage

    // 深拷贝对象
    var _deepCopy = function(obj) {
        var newObj = {};

        for (var key in obj) {
            newObj[key] = obj[key];
        }

        return newObj;
    };

    // 获取时间，当用户的基准时间为一个函数时，则执行该函数，不是的话则进行时间格式转换
    var _getTimeStamp = function(date) {
        var _date;
        if (date) {
            var _date = typeof date === 'function' ? date() : new Date(date).valueOf();
        } else {
            var _date = new Date().valueOf();
        }

        if (isNaN(_date)) {
            var arg = typeof date === 'function' ? _date : date;
            throw new Error('argument "' + arg + '" must be Number');
        } else {
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
    var _crypt = function(type) {
        switch (type) {
            case 'base64':
                return {
                    encode: function(e) {
                        try {
                            return base64.encode(e)
                        } catch (error) {
                            return e;
                        }

                    },
                    decode: function(c) {
                        try {
                            return base64.decode(c);
                        } catch (error) {
                            return c;
                        }

                    }
                }
            default:
                return {
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
        try {
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
        } catch (e) {
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
                if (!_isExpries(e, c)) { // 没有超时则返回对应的值，不返回创建时间和超时时间字段
                    var v = _toJSON(_crypt(_options.crypt).decode(item.v));
                    return v;
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
        mergeItem: function(key, value, opt) {
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
        removeItem: function(key) {
            this.storage.removeItem(key);
        },
        // 删除所有超时项
        clearAllExp: function() {
            for (var key in this.storage) {
                this.getItem(key);
            }
        },
        // 删除所有项
        clear: function() {
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
        this._saveDataWithHandleError = function(key, value) {
            try {
                this.storage.setItem(key, value);
            } catch (e) {
                if (_isQuotaExceeded(e)) {
                    this.deleteAllExp();
                    try {
                        this.storage.setItem(key, value);
                    } catch (e) {
                        throw e;
                    }
                } else {
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

    /*
     * $Id: base64.js,v 2.15 2014/04/05 12:58:57 dankogai Exp dankogai $
     *
     *  Licensed under the BSD 3-Clause License.
     *    http://opensource.org/licenses/BSD-3-Clause
     *
     *  References:
     *    http://en.wikipedia.org/wiki/Base64
     */
    function Base64() {
        var version = "2.1.9";
        // if node.js, we use Buffer
        var buffer;
        if (typeof module !== 'undefined' && module.exports) {
            try {
                buffer = require('buffer').Buffer;
            } catch (err) {}
        }
        // constants
        var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var b64tab = function(bin) {
            var t = {};
            for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
            return t;
        }(b64chars);
        var fromCharCode = String.fromCharCode;
        // encoder stuff
        var cb_utob = function(c) {
            if (c.length < 2) {
                var cc = c.charCodeAt(0);
                return cc < 0x80 ? c : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6)) + fromCharCode(0x80 | (cc & 0x3f))) : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) + fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) + fromCharCode(0x80 | (cc & 0x3f)));
            } else {
                var cc = 0x10000 + (c.charCodeAt(0) - 0xD800) * 0x400 + (c.charCodeAt(1) - 0xDC00);
                return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07)) + fromCharCode(0x80 | ((cc >>> 12) & 0x3f)) + fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) + fromCharCode(0x80 | (cc & 0x3f)));
            }
        };
        var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
        var utob = function(u) {
            return u.replace(re_utob, cb_utob);
        };
        var cb_encode = function(ccc) {
            var padlen = [0, 2, 1][ccc.length % 3],
                ord = ccc.charCodeAt(0) << 16 | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8) | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
                chars = [
                    b64chars.charAt(ord >>> 18),
                    b64chars.charAt((ord >>> 12) & 63),
                    padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
                    padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
                ];
            return chars.join('');
        };
        var btoa = window.btoa ? function(b) {
            return window.btoa(b);
        } : function(b) {
            return b.replace(/[\s\S]{1,3}/g, cb_encode);
        };
        var _encode = buffer ? function(u) {
            return (u.constructor === buffer.constructor ? u : new buffer(u))
                .toString('base64')
        } : function(u) {
            return btoa(utob(u))
        };
        var encode = function(u, urisafe) {
            return !urisafe ? _encode(String(u)) : _encode(String(u)).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
        };
        var encodeURI = function(u) {
            return encode(u, true)
        };
        // decoder stuff
        var re_btou = new RegExp([
            '[\xC0-\xDF][\x80-\xBF]',
            '[\xE0-\xEF][\x80-\xBF]{2}',
            '[\xF0-\xF7][\x80-\xBF]{3}'
        ].join('|'), 'g');
        var cb_btou = function(cccc) {
            switch (cccc.length) {
                case 4:
                    var cp = ((0x07 & cccc.charCodeAt(0)) << 18) | ((0x3f & cccc.charCodeAt(1)) << 12) | ((0x3f & cccc.charCodeAt(2)) << 6) | (0x3f & cccc.charCodeAt(3)),
                        offset = cp - 0x10000;
                    return (fromCharCode((offset >>> 10) + 0xD800) + fromCharCode((offset & 0x3FF) + 0xDC00));
                case 3:
                    return fromCharCode(
                        ((0x0f & cccc.charCodeAt(0)) << 12) | ((0x3f & cccc.charCodeAt(1)) << 6) | (0x3f & cccc.charCodeAt(2))
                    );
                default:
                    return fromCharCode(
                        ((0x1f & cccc.charCodeAt(0)) << 6) | (0x3f & cccc.charCodeAt(1))
                    );
            }
        };
        var btou = function(b) {
            return b.replace(re_btou, cb_btou);
        };
        var cb_decode = function(cccc) {
            var len = cccc.length,
                padlen = len % 4,
                n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0) | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0) | (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0) | (len > 3 ? b64tab[cccc.charAt(3)] : 0),
                chars = [
                    fromCharCode(n >>> 16),
                    fromCharCode((n >>> 8) & 0xff),
                    fromCharCode(n & 0xff)
                ];
            chars.length -= [0, 0, 2, 1][padlen];
            return chars.join('');
        };
        var atob = window.atob ? function(a) {
            return window.atob(a);
        } : function(a) {
            return a.replace(/[\s\S]{1,4}/g, cb_decode);
        };
        var _decode = buffer ? function(a) {
            return (a.constructor === buffer.constructor ? a : new buffer(a, 'base64')).toString();
        } : function(a) {
            return btou(atob(a))
        };
        var decode = function(a) {
            return _decode(
                String(a).replace(/[-_]/g, function(m0) {
                    return m0 == '-' ? '+' : '/'
                })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
            );
        };

        return {
            VERSION: version,
            atob: atob,
            btoa: btoa,
            fromBase64: decode,
            toBase64: encode,
            utob: utob,
            encode: encode,
            encodeURI: encodeURI,
            btou: btou,
            decode: decode,
        };
    }

    ExtendStorage.prototype = ExtendStorageAPI;
    return ExtendStorage;
});
