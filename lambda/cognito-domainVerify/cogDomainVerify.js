exports.handler = function (event, context) {

    // Configure the email domain that will be allowed to automatically verify.
    var approvedDomain = process.env.APPROVED_DOMAIN;

    // Log the event information for debugging purposes.
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    if (event.request.userAttributes.email.includes('@' + approvedDomain)) {
        console.log("This is an approved email address. Proceeding to send verification email.");
        event.response.emailSubject = "Signup Verification Code";
        event.response.emailMessage = "Thank you for signing up. " + event.request.codeParameter + " is your verification code.";
        context.done(null, event);
    } else {
        console.log("This is not an approved email address. Throwing error.");
        var error = new Error('EMAIL_DOMAIN_ERR');
        context.done(error, event);
    }
};