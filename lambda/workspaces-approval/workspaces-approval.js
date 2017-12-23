
'use strict';
console.log('Loading function');
const aws = require('aws-sdk');
const stepfunctions = new aws.StepFunctions();
const ses = new aws.SES();
exports.handler = (event, context, callback) => {
    var taskParams = {
        activityArn: process.env.TASK_ARN 
    };
    
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
                                    input.requesterEmailAddress + ' has been requested a WorkSpace!<br />' +
                                    'Can you please approve:<br />' +
                                    'https://' + process.env.API_DEPLOYMENT_ID + '.execute-api.us-east-1.amazonaws.com/respond/succeed?taskToken=' + encodeURIComponent(data.taskToken) + '&requesterEmailAddress=' + input.requesterEmailAddress + '&requesterUsername=' + input.requesterUsername + '&requesterBundle=' + input.requesterBundle + '<br />' +
                                    'Or reject:<br />' +
                                    'https://' + process.env.API_DEPLOYMENT_ID + '.execute-api.us-east-1.amazonaws.com/respond/fail?taskToken=' + encodeURIComponent(data.taskToken),
                                Charset: 'UTF-8'
                            }
                        }
                    },
                    Source: process.env.FROM_ADDRESS,
                    ReplyToAddresses: [
                        process.env.FROM_ADDRESS
                        ]
                };
                    
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