'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({
    apiVersion: '2012-10-08'
});

exports.handler = (event, context, callback) => {

    var originURL = process.env.ORIGIN_URL || '*';

    var tableName = process.env.DETAILS_TABLE_NAME || 'wsPortal-us-west-2-workspaces';

    console.log('Received event:', JSON.stringify(event, null, 2));

    // DynamoDB Table should consist of a primary key based on the Username and Email have secondary values of Status and WorkspaceId.

    var action = JSON.parse(event.body)["action"];

    if (action == "get") {
        /*
        var opp = JSON.parse(event.body)["opp"];
        var params = {
            TableName: tableName,
            Key: {
                'OPPID': {
                    S: opp
                },
            },
            ProjectionExpression: 'NOTES'
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
                console.log("Value: " + data.Item.NOTES.S);
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Note: data.Item.NOTES.S
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
                        Note: "E_NO_NOTE"
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            }
        });
        */
    } else if (action == "put") {
        /*
        var opp = JSON.parse(event.body)["opp"];
        var note = JSON.parse(event.body)["note"];
        var params = {
            TableName: tableName,
            Item: {
                'OPPID': {
                    S: opp
                },
                'NOTES': {
                    S: note
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
        */
    }


}