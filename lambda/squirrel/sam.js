'use strict';

exports.handler = (event, context, callback) => {

  var originURL = process.env.ORIGIN_URL || '*';

  console.log('Received event:', JSON.stringify(event, null, 2));
  
  //if (!event.requestContext.authorizer) {
  //  errorResponse('Authorization not configured', context.awsRequestId, callback);
  //  return;
  //}

  // This variable can be updated and checked in to your repository
  // to update the number of SAM squirrels on the screen.
  var samCount = 10;

  // Or you can update your Lambda function's environment variable.
  var samMultiplier = process.env.SAM_MULTIPLIER || 1;

  var totalSAMs = samCount * samMultiplier;

  console.log('The number of SAMs to show: ' + samCount);
  console.log('Multiplier to apply to SAMs: ' + samMultiplier);
  console.log('Total number of SAMs to show: ' + totalSAMs);

  callback(null, {
    "statusCode": 200,
    "body": totalSAMs,
    "headers": {
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": originURL
    }
  });
}

function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}