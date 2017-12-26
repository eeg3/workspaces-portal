# WorkSpaces Portal

The WorkSpaces Portal provides Self-Service capability to end-users for Amazon WorkSpaces virtual desktops. The portal provides the ability for users to create, rebuild, reboot, and delete their WorkSpace. The application is entirely serverless leveraging AWS Lambda, S3, API Gateway, Step Functions, Cognito, and SES. The application provides continuous deployment through AWS CodePipeline, CodeBuild, CloudFormation with SAM, and GitHub.

## Architecture

![Architectural Diagram](docs/Portal_Architecture_Diagram.png)

### Components Overview

This project leverages the following services:

* [CloudFormation](https://aws.amazon.com/cloudformation/): Used to deploy the entire stack.
* [AWS Serverless Application Model](https://aws.amazon.com/about-aws/whats-new/2016/11/introducing-the-aws-serverless-application-model/): Used to provision Lambda/API Gateway.
* [S3](https://aws.amazon.com/s3/): Used to provide static website hosting and to store our build artifacts.
* [Lambda](https://aws.amazon.com/lambda/): Used to perform Functions-as-a-Service.
* [API Gateway](https://aws.amazon.com/api-gateway/): Used to provide an integration point to our Lambda functions.
* [Step Functions](https://aws.amazon.com/step-functions/): Used to provide a State Machine for Approval workflows.
* [Cognito](https://aws.amazon.com/cognito/): Used to provide authentication for our website.
* [SES](https://aws.amazon.com/ses/): Used to send Approval emails.
* [CloudWatch Events](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/WhatIsCloudWatchEvents.html): Used to set a timer event for Lambda functions.
* [IAM](https://aws.amazon.com/iam/): Provides security controls for our process.
* [CodePipeline](https://aws.amazon.com/codepipeline/): Used to provide the pipeline functionality for our CI/CD process.
* [Code Build](https://aws.amazon.com/codebuild/): Used to build the project as part of CodePipeline process.
* [GitHub](http://www.github.com): Used as the source code repository. Could theoretically be replaced with CodeCommit.
* [Jekyll](http://www.jekyllrb.com): Provides static web site generation.

### Website

The code for the website are placed within the website/ folder. [Jekyll](https://jekyllrb.com/) is used for static site generation. The site will be built through Code Build as part of the process. It can also be viewed locally through `jekyll serve` within the website directory.

### Lambda

Lambda functions are located within the lambda/ folder. These can be tested with the events within the corresponding sample_events/ folder using [lambda-local](https://www.npmjs.com/package/lambda-local).

### Pipeline

The code for the pipeline resides within the root.

1. **deploy.json**: Launcher for the core services within CloudFormation (S3, CodePipeline, CodeBuild, Cognito). These are not modified by the pipeline on changes, but it does include setting up the pipeline itself. This is the CloudFormation template to launch to get setup started.
2. **buildspec.yml**: This file is used by CodeBuild to tell it what to do on every build.
3. **sam.json**: CloudFormation Serverless Transformation template for SAM. This template handles creation of the Lambda functions, Step Functions, and the approval API Gateway.

## Deployment

### Prerequisites

What things you need to install the software and how to install them

1. The AWS account must be setup for SES for production usage. By default, SES is locked down, and needs to be [moved out of the Amazon SES Sandbox](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html).
2. Amazon WorkSpaces at the most basic level should be setup. This includes setting up a Directory Services directory (any type is fine). 

### CloudFormation

Deploying the application starts by running the `deploy.json` file inside CloudFormation. The `deploy.json` template will ask for the following parameters:

1. **AppName**: Name of the application that will be used in some components naming scheme.
2. **BucketName**: Name of the S3 Bucket to create that should house the website. This must be unique within the S3 namespace.
3. **CognitoPool**: Name of the Cognito Pool to create to use for authentication purposes.
4. **SAMInputFile**: Serverless transform file. By default, this is the included `sam.json` file. (Don't change unless renaming sam.json)
5. **SAMOutputFile**: The filename for the output file from the buildspec file. (This doesn't need to be changed unless the artifact file inside the `buildspec.yml` file is changed to a different name.)
6. **CodeBuildImage**: Name of the CodeBuild container image to use. (Don't change unless willing to edit buildspec.yml accordingly.)
7. **GitHubRepName**: Name of the GitHub repo that houses the application code.
8. **GitHubRepoBranch**: Branch of the GitHub repo that houses the application code.
9. **GitHubUser**: GitHub Username.
10. **GitHubToken**: GitHub token to use for authentication to the GitHub account. Configurable inside Github: https://github.com/settings/tokens. Token needs `repo_hook` permissions.


The files referenced (e.g. SAMInputFile) are expected to exist within the GitHub repository. The CloudFormation deployment will warn that it is creating IAM permissions; this is because it creates roles and policies for the pipeline to use when it creates/modifies the child stack.

The initial CloudFormation Stack should be created after `deploy.json` is launched. Once that stack is created, the CodePipeline will then create the child stack after a short period of time. The child stack will be called ``{parent-stack}-serverless-stack``.

Once deployed, the application still requires some additional configuration to work.

### Configuration

After initial deployment, the site will not be fully functional as a few configuration steps must occur.

#### Manually Create API Gateway

The Serverless Application Model (SAM) within AWS / CloudFormation does not support enabling CORS directly. As such, if using the API Gateway created through that method, it will not work and will consistently through CORS errors in the brower. There is an [open issue](https://github.com/awslabs/serverless-application-model/issues/23) on the SAM GitHub repo, and this will hopefully be added soon in the future. 

In the meantime, the API Gateway is built manually. To create the API Gateway manually, follow these steps:

1. Go to API Gateway 
2. Placeholder
3. Placeholder

#### Update Web Config with Infrastructure Details

The `config.js` file within `website/js/` needs to be updated so the site knows how to utilize the services (this is a one-time process). 

Within the parent Stack, the Outputs tab should display the following items:

1. **UserPoolClientId**
2. **BucketName**
3. **UserPoolId**
4. **OriginURL**

The `UserPoolClientId` and `UserPoolId` should be placed into the `website/js/config.js` file within the `cognito.userPoolId` and `cognito.userPoolClientId` so that the website knows how to use the services provisioned. If not using `us-east-1`, also change the region within `cognito.region` accordingly.

The API Gateway created manually should also be placed into `website/js/config.js` within the `api.invokeUrl` entry.

For WorkSpace creation approvals, configure the email address within the `approval.email` entry.

Once the `config.js` file is updated, push the change to the GitHub repo; this will automatically update the application with the new config through the pipeline.

#### Configure Cognito to use Custom Trigger

*Warning: If this is not configured, anyone can sign up and use the portal.*

Also needed after deployment is to configure Cognito -> User Pools -> <Created Pool> -> General Settings -> Triggers -> Custom Message Trigger to point to the `cogDomainVerify` Lambda function. This will enable limiting signups to the email domain configured in the function.

#### Testing

The site should now work as expected. Browse to the URL defined within `OriginURL`, and select "Register" from the top right drop-down. Enter an email address (within the configured domain inside cogDomainVerify) and password, and select Register. You will receive a verification code from Cognito. Once received, select "Verify" from the top right drop-down; on the verify page, enter your email and verification code provided.

On the main page, the ability to request a WorkSpace should now be displayed. Request a WorkSpace with a user (that must exist within the Directory) and select a Bundle ID to use. It should begin the approval process, and the email address configured for approvals should receive an Approval Request email within 10 minutes, which is within time for the CloudWatch Event that triggers the Lambda function polling Step Functions to run (this can be configured lower within `sam.json` for the Lambda function if desired. Approve the request, and the creation process should begin.

The user should receive an email with instructions on how to use their WorkSpace once it finishes provisioning. The user can also log back into the WorkSpaces Portal to try rebooting, rebuilding, or deleting the WorkSpace.

### Updating the Portal

As the website or serverless function is updated, simply perform the modifications within the code and then push them to the GitHub repo. Once checked in to GitHub, CodePipeline will handle the rest automatically. To test this functionality, browse to the CodePipeline page and view the pipeline while pushing a change. The pipeline will show the process from Source -> Build -> Deploy. If there are any failures, they will be visible within the pipeline.

## Built With

This project leverages the following services:

* [CloudFormation](https://aws.amazon.com/cloudformation/): Used to deploy the entire stack.
* [AWS Serverless Application Model](https://aws.amazon.com/about-aws/whats-new/2016/11/introducing-the-aws-serverless-application-model/): Used to provision Lambda/API Gateway.
* [S3](https://aws.amazon.com/s3/): Used to provide static website hosting and to store our build artifacts.
* [Lambda](https://aws.amazon.com/lambda/): Used to perform Functions-as-a-Service.
* [API Gateway](https://aws.amazon.com/api-gateway/): Used to provide an integration point to our Lambda functions.
* [Step Functions](https://aws.amazon.com/step-functions/): Used to provide a State Machine for Approval workflows.
* [Cognito](https://aws.amazon.com/cognito/): Used to provide authentication for our website.
* [SES](https://aws.amazon.com/ses/): Used to send Approval emails.
* [CloudWatch Events](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/WhatIsCloudWatchEvents.html): Used to set a timer event for Lambda functions.
* [IAM](https://aws.amazon.com/iam/): Provides security controls for our process.
* [CodePipeline](https://aws.amazon.com/codepipeline/): Used to provide the pipeline functionality for our CI/CD process.
* [Code Build](https://aws.amazon.com/codebuild/): Used to build the project as part of CodePipeline process.
* [GitHub](http://www.github.com): Used as the source code repository. Could theoretically be replaced with CodeCommit.
* [Jekyll](http://www.jekyllrb.com): Provides static web site generation.

### Notes

1. If you want to delete the stack, make sure to delete the pipeline-created stack first and then delete the parent stack. If you delete the parent first, the IAM role is deleted and you'll have to tinker around with permissions to get the stack to actually gracefully delete.
2. Some of the IAM permissions may be more liberal than preferred. Please review and edit to match to your security policies as appropriate.

## Authors

* **Earl Gay** - *Initial work* - [eeg3](https://github.com/eeg3)

See also the list of [contributors](https://github.com/eeg3/workspaces-portal/contributors) who participated in this project.

## License

This project is licensed under the [2-Clause BSD License](https://opensource.org/licenses/BSD-2-Clause).

## Acknowledgments

* [AWS Labs: Severless Web Application WorkShop](https://github.com/awslabs/aws-serverless-workshops/tree/master/WebApplication/)
* [AWS Labs: Serverless SAM Farm](https://github.com/awslabs/aws-serverless-samfarm)