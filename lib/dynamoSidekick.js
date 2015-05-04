var AWS = require('aws-sdk');


module.exports = new DynaSidekick();

function DynaSidekick(config){
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
};
