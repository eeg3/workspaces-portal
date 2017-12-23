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

    console.log("Received event: " + event);

    var requesterEmail = event.split(",")[0];
    var requesterUsername = event.split(",")[1];
    var requesterBundle = event.split(",")[2];

    console.log("Requester email: " + requesterEmail);
    console.log("Requester username: " + requesterUsername);
    console.log("Requester bundle: " + requesterBundle);

    var params = {
        Workspaces: [{
            BundleId: requesterBundle,
            DirectoryId: config.Directory,
            UserName: requesterUsername,
            Tags: [{
                Key: 'SelfServiceManaged',
                Value: requesterEmail
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
};