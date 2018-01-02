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

    // The Lambda will receive parameters in two manners:
    //  1: JSON when called directly (e.g. "body": "{\"action\":\"put\",\"username\":\"earl\",\"email\":\"earl@eeg3.net\",\"ws_status\":\"Requested\"}" )
    //  2: CSV when called after approved / declined through API Gateway
    // Therefore, do a try/catch in order to find out which one the function is dealing with. If 'action' variable stays undefined, it is through #2 (CSV).
    try {
        var action = JSON.parse(event.body)["action"];
    } catch (err) {}

    if (action == "get") {

        var username = JSON.parse(event.body)["username"];
        var email = JSON.parse(event.body)["email"];
        console.log("Table to search: " + tableName);
        console.log("User to search for: " + username);
        console.log("Email to search for: " + email);
        
        var params = {
            TableName: tableName,
            Key: {
                'Username': {
                    S: username
                },
                'Email': {
                    S: email
                }
            },
            ProjectionExpression: 'Username,Email,WS_Status'
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
                console.log("Status: " + data.Item.WS_Status.S)
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Result: data.Item
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

        var username = JSON.parse(event.body)["requesterUsername"];
        var email = JSON.parse(event.body)["requesterEmailAddress"];
        var ws_status = JSON.parse(event.body)["ws_status"];
        console.log("Table to search: " + tableName);
        console.log("User to update: " + username);
        console.log("Email to update: " + email);
        console.log("Status to update: " + ws_status);

        var params = {
            TableName: tableName,
            Key: {
                'Username': {
                    S: username
                },
                'Email': {
                    S: email
                }
            }
        };

        if (ws_status != undefined) {
            params.ExpressionAttributeNames = {
                "#WSS": "WS_Status"
            };
            params.ExpressionAttributeValues = {
                ":s": {
                    S: ws_status
                }
            };
            params.UpdateExpression = "SET #WSS = :s";
        }

        // Call DynamoDB to add the item to the table
        ddb.updateItem(params, function (err, data) {
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

    } else if (action == undefined) {

        var email = event.body.split(",")[0];
        var username = event.body.split(",")[1];
        var ws_status = "Ready";
    
        console.log("Table to use: " + tableName);
        console.log("User to update: " + username);
        console.log("Email to update: " + email);
        console.log("Status to update: " + ws_status);

        var params = {
            TableName: tableName,
            Key: {
                'Username': {
                    S: username
                },
                'Email': {
                    S: email
                }
            }
        };

        if (ws_status != undefined) {
            params.ExpressionAttributeNames = {
                "#WSS": "WS_Status"
            };
            params.ExpressionAttributeValues = {
                ":s": {
                    S: ws_status
                }
            };
            params.UpdateExpression = "SET #WSS = :s";
        }

        // Call DynamoDB to add the item to the table
        ddb.updateItem(params, function (err, data) {
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