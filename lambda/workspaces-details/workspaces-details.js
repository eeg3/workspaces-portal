'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({
    apiVersion: '2012-10-08'
});

exports.handler = (event, context, callback) => {

    var originURL = process.env.ORIGIN_URL || '*';

    var tableName = process.env.DETAILS_TABLE_NAME || 'wsp-db-int-serverless-stack-WorkspaceDetailsTable-1SC7FPUK3PFJ8';

    console.log('Received event:', JSON.stringify(event, null, 2));

    // DynamoDB Table should consist of a primary key based on the Username and Email have secondary values of Status and WorkspaceId.

    // The Lambda will receive parameters in three manners:
    //  1: JSON when called directly (e.g. "body": "{\"action\":\"put\",\"username\":\"earl\",\"email\":\"earl@eeg3.net\",\"ws_status\":\"Requested\"}" )
    //  2: JSON when called indirectly (i.e. the same as #1 except not inside a body parameter)
    //  3: CSV when declined through API Gateway
    // Therefore, do a try/catch in order to find out which one the function is dealing with. If 'action' variable stays undefined, it is through #3 (CSV).

    try { // Check see if it's #1
        var action = JSON.parse(event.body)["action"];
        var username = JSON.parse(event.body)["requesterUsername"];
        var email = JSON.parse(event.body)["requesterEmailAddress"];
        var ws_status = JSON.parse(event.body)["ws_status"];
    } catch (err) {}

    if (action == undefined) { // Check to see if it's #2
        try {
            var action = event["action"];
            var username = event["requesterUsername"];
            var email = event["requesterEmailAddress"];
            var ws_status = event["ws_status"];
        } catch (err) {}
    }

    if (action == "get") {
        console.log("Table to search: " + tableName);
        console.log("User to search for: " + username);
        console.log("Email to search for: " + email);

        var params = {
            ExpressionAttributeValues: {
             ":email": {
               S: email
              }
            },
            FilterExpression: "contains (Email, :email)",
            ProjectionExpression: "Email, Username, WS_Status",
            TableName: tableName
           };
           
           ddb.scan(params, function(err, data) {
             if (err) {
               console.log("Error", err);
             } else {
               data.Items.forEach(function(element, index, array) {
                 console.log(element.Email.S + " (" + element.Username.S + "): " + element.WS_Status.S);
               });
               callback(null, data.Items);
             }
           });

    } else if (action == "put") {
        console.log("Table to search: " + tableName);
        console.log("User to update: " + username);
        console.log("Email to update: " + email);
        console.log("Status to update: " + ws_status);

        var params = {
            TableName: tableName,
            Key: {
                'Email': {
                    S: email
                },
                'Username': {
                    S: username
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

    } else if (action == undefined) { // If still undefined, it's #3

        var email = event.Cause.split(",")[0];
        var username = event.Cause.split(",")[1];
        var ws_status = event.Error;

        console.log("Table to use: " + tableName);
        console.log("User to update: " + username);
        console.log("Email to update: " + email);
        console.log("Status to update: " + ws_status);

        var params = {
            TableName: tableName,
            Key: {
                'Email': {
                    S: email
                },
                'Username': {
                    S: username
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