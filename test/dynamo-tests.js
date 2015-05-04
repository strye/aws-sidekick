var should = require('should');
var dynoSK = require("../index").DynamoDb;

var config = {
	region: 'us-west-2',
	awsProfile: 'default',
	dynamoDb: {
		localEndpoint: 'http://localhost:8000'
	}
};


describe("AWS DynamoDb Sidekick",function(){

	it('Should create a dynamoDb object',function(done){
		var dynamoConn = dynoSK.GetDynamoConnection(config);

		dynamoConn.should.be.instanceof(Object);
		done(); 
	});

	it('Should create date object from iso string',function(done){
		var testDate = dynoSK.ParseIsoDate('2015-05-04T01:02:30.500Z');
		var controlDate = new Date(Date.UTC(2015, 4, 4, 1, 2, 30, 500));

		testDate.should.be.instanceof(Date);
		testDate.should.eql(controlDate);

		done(); 
	});

	it('Should create dynamo update object for string',function(done){
		var modelPropertyValue = "test value";
		var dataType = "S";

		var updateObject = dynoSK.DynamoUpdateFormatter(modelPropertyValue, dataType);

		updateObject.should.be.instanceof(Object);
		updateObject.Value.S.should.eql(modelPropertyValue);
		updateObject.Action.should.eql("PUT");

		done(); 
	});

	it('Should create dynamo update object for number',function(done){
		var modelPropertyValue = 5;
		var dataType = "N";

		var updateObject = dynoSK.DynamoUpdateFormatter(modelPropertyValue, dataType);

		updateObject.should.be.instanceof(Object);
		updateObject.Value.N.should.eql("5");
		updateObject.Action.should.eql("PUT");

		done(); 
	});


	it('Should return the string value from dynamo object',function(done){
		//var itemProperties = {dynamo: {name:'test', type:'N'}};
		var itemProperties = {dynamo: {name:'test', type:'S'}};
		//var itemProperties = {dynamo: {name:'test', type:'SS'}};
		//var itemProperties = {type: 'date-iso', dynamo: {name:'test', type:'S'}};
		
		var dynamoVal = {S: "test value"}

		var updateValue = dynoSK.GetDynamoValue(dynamoVal, itemProperties);

		updateValue.should.be.instanceof(String);
		updateValue.should.eql("test value");

		done(); 
	});


	// Add unit tests for:
	//   Convert string array to dynamo string set
	//   Convert number array to dynamo number set

	//   Convert dynamo number to number value
	//   Convert dynamo string set to string array
	//   Convert dynamo number set to number array


});