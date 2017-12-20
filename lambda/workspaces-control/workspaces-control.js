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
        console.log("Trying to find desktop owned by: " + event.requestContext.authorizer.claims.email);

        var params = [];

        workspaces.describeWorkspaces(describeWorkspacesParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                //console.log(data);
                //console.log(data.Workspaces[0]);

                for (var i = 0; i < data.Workspaces.length; i++) {
                    //console.log("Desktop[" + i + "]: " + data.Workspaces[i].WorkspaceId + " is owned by: " + data.Workspaces[i].UserName);
                    var workspaceDetails = data[i];
                    var describeTagsParams = {
                        ResourceId: data.Workspaces[i].WorkspaceId /* required */
                    };

                    workspaces.describeTags(describeTagsParams, function (err, data, workspaceDetails) {
                        if (err) {
                            console.log(err, err.stack);
                        } else {

                            for (var i = 0; i < data.TagList.length; i++) {

                                if (data.TagList[i].Key == "SelfServiceManaged" && data.TagList[i].Value == event.requestContext.authorizer.claims.email) {
                                    console.log("Desktop for '" + event.requestContext.authorizer.claims.email + "' found: " + describeTagsParams.ResourceId);

                                    var describeDetailsParams = {
                                        WorkspaceIds: [
                                            describeTagsParams.ResourceId
                                        ]
                                      };
                                      workspaces.describeWorkspaces(describeDetailsParams, function(err, data) {

                                        if(err) {
                                            console.log(err, err.stack);
                                        } else {
                                            console.log("Finally: " + data);
                                            callback(null, {
                                                "statusCode": 200,
                                                "body": JSON.stringify(data.Workspaces[0]),
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

                        }
                    });
                }

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
        console.log("Trying to find desktop owned by: " + event.requestContext.authorizer.claims.email);

        var describeWorkspacesParams = [];

        workspaces.describeWorkspaces(describeWorkspacesParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                //console.log(data);
                //console.log(data.Workspaces[0].WorkspaceId);

                for (var i = 0; i < data.Workspaces.length; i++) {
                    //console.log("Desktop[" + i + "]: " + data.Workspaces[i].WorkspaceId + " is owned by: " + data.Workspaces[i].UserName);

                    var describeTagsParams = {
                        ResourceId: data.Workspaces[i].WorkspaceId /* required */
                    };
                    workspaces.describeTags(describeTagsParams, function (err, data) {
                        if (err) {
                            console.log(err, err.stack);
                        } else {
                            //console.log(data);

                            for (var i = 0; i < data.TagList.length; i++) {
                                if (data.TagList[i].Key == "SelfServiceManaged" && data.TagList[i].Value == event.requestContext.authorizer.claims.email) {
                                    console.log("Desktop for '" + event.requestContext.authorizer.claims.email + "' found: " + describeTagsParams.ResourceId);
                                    console.log("Deleting desktop '" + describeTagsParams.ResourceId + " per request.");

                                    var deletionParams = {
                                        TerminateWorkspaceRequests: [{
                                            WorkspaceId: describeTagsParams.ResourceId
                                        }]
                                    };

                                    console.log(JSON.stringify(deletionParams));

                                    workspaces.terminateWorkspaces(deletionParams, function (err, data) {
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

                                }
                            }

                        }
                    });
                }

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