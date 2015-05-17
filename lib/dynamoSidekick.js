var AWS = require('aws-sdk');


module.exports = new DynaSidekick();

function DynaSidekick(){
	var self = this;


	self.GetDynamoConnection = function(config){
		var awsOptions = {region: config.region, profile: config.awsProfile};
		if (config.dynamoDb.localEndpoint) {
			awsOptions.endpoint = new AWS.Endpoint(config.dynamoDb.localEndpoint);
		}

		return new AWS.DynamoDB(awsOptions);
	};

	self.ParseIsoDate = function(dateStr){
		// Date.parseExact(data.ModifiedOn.S, 'yyyy-MM-ddTHH:mm:ss.sssZ');
		var year = parseInt(dateStr.substr(0, 4));
		var mon = parseInt(dateStr.substr(5, 2))-1;
		var day = parseInt(dateStr.substr(8, 2));
		var hr = parseInt(dateStr.substr(11, 2));
		var min = parseInt(dateStr.substr(14, 2));
		var sec = parseInt(dateStr.substr(17, 2));
		var ms = parseInt(dateStr.substr(20, 3));

		var d = new Date(year, mon, day, hr, min, sec, ms);
		d.setTime(d.getTime() + (d.getTimezoneOffset() * -1) * 60000);

		return d;
	};

	self.DynamoUpdateFormatter = function(modelPropertyValue, dataType) {
		var property = {};

		var propValue = modelPropertyValue.toString();

		if (propValue && propValue.length > 0) {
			property.Value = {};
			property.Value[dataType] = propValue;
			property.Action = "PUT";
		}
		else { property.Action = "DELETE"; }

		return property;
	};

	self.GetDynamoValue = function(dynamoVal, itemProperties){
		var dType = itemProperties.dynamo.type;

		if (dynamoVal) {
			var raw = dynamoVal[dType];
			if (itemProperties.type === 'date-iso') { return self.ParseIsoDate(raw); } 
			else if (dType === 'N') { return parseInt(raw); }
			else if (dType === 'N') {
				var result = [];
				raw.forEach(function(val){ result.push(parseInt(val)); });
				return result;
			}
			else { return raw; }
		} else { 
			if (dType === "SS" || dType === "NS" || dType === "BN" || dType === "L") { return []; }
			else if (dType === "M") { return {}; }
			else { return null; }
		}
	};


	self.SimpleQuery = function(config, conditions){
		var callback_ = arguments[arguments.length - 1];
		var callback = (typeof(callback_) == 'function' ? callback_ : function(){});

		var params = {'TableName': config.tableName};
		if (conditions) {
			params.KeyConditions = conditions;
		}

		var dynamoDb = self.GetDynamoConnection(config);
		dynamoDb.query(params,function(err, data) {
			callback(err, data);
		});
	};



/*	self.LoadData = function(data) {
		var callback_ = arguments[arguments.length - 1];
		var callback = (typeof(callback_) == 'function' ? callback_ : function(){});

		var key = {
			ConspiracyId:{S: data.ConspiracyId}
		};
		var params = {
			Key: key,
			TableName: config.conspiracies.tableName // required 
			//ProjectionExpression: 'STRING_VALUE'
		};
		dynamodb.getItem(params, function(err, data) {
			if (err) { callback(err); } 
			else { 
				for(var field in dataModel){
					var dName = dataModel[field].dynamo.name;

					self[field] = dynaHlpr.GetDynamoValue(data[dName], dataModel[field])
				}
				

				callback(null, data); 
			}
		});		
	};
*/


	self.SaveItem = function(dataModel, values, config){
		var callback_ = arguments[arguments.length - 1];
		var callback = (typeof(callback_) == 'function' ? callback_ : function(){});


		var itemParams = {};

		for(var field in dataModel.data){
			var dynaSpec = dataModel.data[field].dynamo;

			if (field in values) {
				itemParams[dynaSpec.name] = self.DynamoUpdateFormatter(values[field], dynaSpec.type);
			}
		}
		// If modified data not set, set it now
		if (!values.ModifiedOn) {
			var modDate = new Date();
			itemParams.ModifiedOn = {Value:{S: modDate.toISOString()},Action:"PUT"}
		}


		var key = {};
		for(var keyItem in dataModel.key) {
			var dynaSpec = dataModel.key[keyItem].dynamo;
			key[dynaSpec.name] = {};
			key[dynaSpec.name][dynaSpec.type] = values[keyItem];
		}



		var params = {'TableName': config.tableName, 
			'Key': key, 
			'AttributeUpdates': itemParams,
			'ReturnValues': 'UPDATED_NEW'
		};

		var dynamoDb = self.GetDynamoConnection(config);
		dynamoDb.updateItem(params, function(err, data) {
			if (err) { callback(err); } 
			else { callback(null, data); }
		});
	};

};
