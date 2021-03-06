var serializa = require('./tools/serializa');
var deserializa = require('./tools/deserializa');
var expect = require('chai').expect;


describe('JSON转化字符串测试', function(){
	it("{key:value}格式测试", function(){
		expect(serializa({name:'a', array:[1,2,3]})).to.be.equal('{"name":"a","array":[1,2,3]}');
	});

	it("数组格式测试", function(){
		expect(serializa([1,2,3, 'a'])).to.be.equal('[1,2,3,"a"]');
	});

	it("普通字符串格式测试", function(){
		expect(serializa('a')).to.be.equal('a');
	});

	it("null测试", function(){
		expect(serializa(null)).to.be.null;
	});

	it("undefined测试", function(){
		expect(serializa(undefined)).to.be.undefined;
	})

	it("函数测试", function(){
		expect(serializa(function(){})).to.be.an('function');
	})
})

describe('字符串转化JSON测试', function(){
	it("{key:value}格式测试", function(){
		expect(deserializa('{"name":"a"}')).to.have.property('name').and.equal('a');
	});

	it("数组格式测试", function(){
		expect(deserializa('[1,2,3,"a"]')).to.be.eql([1,2,3,"a"]);
	});

	it("普通字符串格式测试", function(){
		expect(deserializa('a')).to.be.equal('a');
	});

	it("null测试", function(){
		expect(deserializa(null)).to.be.null;
	});

	it("undefined测试", function(){
		expect(deserializa(undefined)).to.be.undefined;
	})

	it("函数测试", function(){
		expect(deserializa(function(){})).to.be.an('function');
	})
})