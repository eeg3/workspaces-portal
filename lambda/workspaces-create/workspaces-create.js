'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create the WorkSpaces service object
var workspaces = new AWS.WorkSpaces({
    apiVersion: '2015-04-08'
});

// WorkSpaces must be tied to a Directory Service ID. Creation of the Directory Service is outside the scope of the portal.
// By default, all WorkSpaces are configured with 'Auto Stop' mode with a usage timeout of 1 hour.
var config = {
    Directory: process.env.DIRECTORY_ID || 'd-90672a878e',
    Mode: 'AUTO_STOP',
    UsageTimeout: 60
}

exports.handler = (event, context, callback) => {

    // This function is ultimately called if workspaces-control initiates the Step Functions State Machine and the Approver approves creation.
    // Only the State Machine can initiate this function and it cannot be called directly through the API like the other control functions (e.g. reboot).

    // The WorkSpace will be created according to the passed parameters (Email, Username, Bundle ID). The email address will be set as a tag value for the
    // 'SelfServiceManaged' tag. This tag ultimately controls the mapping of users to WorkSpaces from the Portal's perpsective.
    
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
            console.log("Result: " + JSON.stringify(data));
            callback(null, {
                "statusCode": 200,
                "body": JSON.stringify({
                    "action": "put",
                    "requesterEmailAddress": requesterEmail,
                    "requesterUsername": requesterUsername,
                    "ws_status": "Approved"
                })
            });
        }
    });
};