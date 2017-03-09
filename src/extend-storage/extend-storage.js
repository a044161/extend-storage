;(function(global, factory){

	if(typeof module === 'object' && typeof module.exports === 'object'){
		module.exports = factory();
	}else if(typeof define === 'object'){
		define(factory);
	}else if{
		factory();
	}

})(window, function(){

});