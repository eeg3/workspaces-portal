'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create the Step Functions service object
const stepfunctions = new AWS.StepFunctions();

// Create the Simple Email Services service object
const ses = new AWS.SES();

exports.handler = (event, context, callback) => {
    var taskParams = {
        activityArn: process.env.TASK_ARN 
    };
    
    // The 'workspaces-control' Lambda function will create an Activity Task with the parameters of the / user (Email Address, Username, Bundle ID).
    // This function obtains an Activity Task and sends the details to the APPROVER_EMAIL_ADDRESS (configured via Environment Variable). Within the
    // email will be two links: Approve & Reject; these links will call the API Gateway that will pass SendTaskSuccess or SendTaskFailure to the 
    // State Machine. If Approved, the 'workspaces-create' Lambda function will be called next.
    stepfunctions.getActivityTask(taskParams, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            context.fail('An error occured while calling getActivityTask.');
        } else {
            if (Object.keys(data).length === 0 && data.constructor === Object) {
                // No activities scheduled
                context.succeed('No activities received after 60 seconds.');
            } else {
                console.log("data: " + data);
                console.log("input: " + data.input);
                
                
                var input = JSON.parse(data.input);
                console.log("input: " + input);

                // The variables of the user request are passed back to API Gateway as parameters.
                var emailParams = {
                    Destination: {
                        ToAddresses: [
                            process.env.APPROVER_EMAIL_ADDRESS
                            ]
                    },
                    Message: {
                        Subject: {
                            Data: 'WorkSpace Creation Request [' + input.requesterUsername + ']',
                            Charset: 'UTF-8'
                        },
                        Body: {
                            Html: {
                                Data: 'Hi!<br />' +
                                    input.requesterEmailAddress + ' has requested a WorkSpace!<br />' +
                                    'Can you please approve:<br />' +
                                    'https://' + process.env.API_DEPLOYMENT_ID + '.execute-api.' + process.env.AWS_REGION + '.amazonaws.com/respond/succeed?taskToken=' + encodeURIComponent(data.taskToken) + '&requesterEmailAddress=' + input.requesterEmailAddress + '&requesterUsername=' + input.requesterUsername + '&requesterBundle=' + input.requesterBundle + '<br />' +
                                    'Or reject:<br />' +
                                    'https://' + process.env.API_DEPLOYMENT_ID + '.execute-api.' + process.env.AWS_REGION + '.amazonaws.com/respond/fail?taskToken=' + encodeURIComponent(data.taskToken)  + '&requesterEmailAddress=' + input.requesterEmailAddress + '&requesterUsername=' + input.requesterUsername + '<br />',
                                Charset: 'UTF-8'
                            }
                        }
                    },
                    Source: process.env.FROM_ADDRESS,
                    ReplyToAddresses: [
                        process.env.FROM_ADDRESS
                        ]
                }; // process.env.FROM_ADDRESS is the address from which the approval email will be sent.
                    
                // Amazon SES is used to send the email. It is required that the AWS account where this function lives is properly setup to 
                // send email from SES. AWS Accounts cannot send email by default for security reasons. 
                // More details: https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html
                ses.sendEmail(emailParams, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        context.fail('Internal Error: The email could not be sent.');
                    } else {
                        console.log(data);
                        context.succeed('The email was successfully sent.');
                    }
                });
                
            }
        }
    });
};