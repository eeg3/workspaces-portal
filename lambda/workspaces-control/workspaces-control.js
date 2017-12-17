'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({
    region: 'us-east-1'
});

// Create the WorkSpaces service object
var workspaces = new AWS.WorkSpaces({
    apiVersion: '2015-04-08'
});

var config = {
    Directory: 'd-90672a878e',
    Mode: 'AUTO_STOP',
    UsageTimeout: 60

}

exports.handler = (event, context, callback) => {

    var originURL = process.env.ORIGIN_URL || '*';

    console.log('Received event:', JSON.stringify(event, null, 2));

    //if (!event.requestContext.authorizer) {
    //  errorResponse('Authorization not configured', context.awsRequestId, callback);
    //  return;
    //}

    var action = JSON.parse(event.body)["action"];
    console.log("action: " + action);

    if (action == "list") {
        // aws workspaces describe-workspaces -> returns obj of all
        // for each workspace in describe obj -> aws workspaces describe-tags --resource-id obj[i] -> returns obj TagList with key/val pairs
        // for each key/value pair in TagList -> if Key = SelfServiceManaged check if Value = requestContext.authorizer.email
        // if true -> print it out
        //var requestContext = JSON.parse(event.requestContext);
        console.log(event.requestContext.authorizer.claims.email);

        var params = [];

        workspaces.describeWorkspaces(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log(data);
                console.log(data.Workspaces[0].WorkspaceId);

                var params = {
                    ResourceId: data.Workspaces[0].WorkspaceId /* required */
                };
                workspaces.describeTags(params, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        console.log(data);
                        console.log("Key: " + data.TagList[0].Key);
                        console.log("Value: " + data.TagList[0].Value);
                        callback(null, {
                            "statusCode": 200,
                            "body": JSON.stringify({
                                Result: data.TagList[0].Value
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
        });


    } else if (action == "create") {
        //var opp = JSON.parse(event.body)["opp"];
        var username = JSON.parse(event.body)["username"];
        var bundle = JSON.parse(event.body)["bundle"];

        var params = {
            Workspaces: [{
                BundleId: bundle,
                DirectoryId: config.Directory,
                UserName: username,
                Tags: [{
                    Key: 'SelfServiceManaged',
                    Value: event.requestContext.authorizer.claims.email
                }, ],
                WorkspaceProperties: {
                    RunningMode: config.Mode,
                    RunningModeAutoStopTimeoutInMinutes: config.UsageTimeout
                }
            }]
        };

        workspaces.createWorkspaces(params, function (err, data) {
            if (err) {
                console.log("Error: " + err);
                callback(null, {
                    statusCode: 500,
                    body: JSON.stringify({
                        Error: err,
                    }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } else {
                // TODO: Check if "FailedRequests" is empty and PendingRequest has a member.
                console.log("Result: " + JSON.stringify(data));
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Result: data
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            }
        });

    } else if (action == "delete") {
        var workspace = JSON.parse(event.body)["workspaceid"];

        var params = {
            TerminateWorkspaceRequests: [{
                WorkspaceId: workspace
            }]
        };

        console.log(JSON.stringify(params));

        workspaces.terminateWorkspaces(params, function (err, data) {
            if (err) {
                console.log("Error: " + err);
                callback(null, {
                    statusCode: 500,
                    body: JSON.stringify({
                        Error: err,
                    }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } else {
                // TODO: Check if "FailedRequests" is empty.
                console.log("Result: " + JSON.stringify(data));
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify({
                        Result: data
                    }),
                    "headers": {
                        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Origin": originURL
                    }
                });
            }
        });

    } else {
        console.log("No action specified.");
        callback(null, {
            "statusCode": 500,
            "body": JSON.stringify({
                Error: "No action specified."
            }),
            "headers": {
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
                "Access-Control-Allow-Origin": originURL
            }
        });
    }

}