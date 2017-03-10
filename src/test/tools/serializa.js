module.exports = function(data){
	if(data === null){
		return data;
	}

	var isObject = typeof data === 'object';

	if(isObject){
		return JSON.stringify(data)
	}else{
		return data;
	}
}