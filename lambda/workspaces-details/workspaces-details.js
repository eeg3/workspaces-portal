'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({
    apiVersion: '2012-10-08'
});

exports.handler = (event, context, callback) => {

    var originURL = process.env.ORIGIN_URL || '*';

    var tableName = process.env.DETAILS_TABLE_NAME || 'wsp-db-int-serverless-stack-WorkspaceDetailsTable-WTRSGHNEH36H';

    console.log('Received event:', JSON.stringify(event, null, 2));

    // DynamoDB Table should consist of a primary key based on the Username and Email have secondary values of Status and WorkspaceId.

    var action = JSON.parse(event.body)["action"];

    if (action == "get") {

        var user = JSON.parse(event.body)["user"];
        var params = {
            TableName: tableName,
            Key: {
                'Username': {
                    S: user
                },
            },
            ProjectionExpression: 'Username,Email,Status'
        };

        // Call DynamoDB to read the item from the table
        ddb.getItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                callback(null, {
                    statusCode: 500,
                    body: JSON.stringify({
                        Error: err,
                    }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } else if (data.Item) {
                console.log("Username: " + data.Item.Username.S);
                console.log("Email: " + data.Item.Email.S)
                console.log("Status: " + data.Item.Status.S)
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Result: JSON.stringify(data.Item)
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            } else {
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Note: "E_NOT_FOUND"
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            }
        });

    } else if (action == "put") {

        var user = JSON.parse(event.body)["user"];
        var email = JSON.parse(event.body)["email"];
        var status = JSON.parse(event.body)["status"];
        var params = {
            TableName: tableName,
            Item: {
                'Username': {
                    S: user
                },
                'Email': {
                    S: email
                },
                'Status': {
                    S: status
                }
            }
        };

        // Call DynamoDB to add the item to the table
        ddb.putItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Result: "Not Found"
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            } else {
                console.log("Data written.", data);
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Result: "Success"
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            }
        });

    }


}