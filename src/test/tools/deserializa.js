module.exports = function(data){
	if(typeof data !== 'string'){
		return data;
	}else{
		try {
			return JSON.parse(data);
		}catch(e){
			return data;
		}
		
	}
}