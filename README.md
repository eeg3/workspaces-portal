# Serverless Template

## Deployment

Deploying the application starts by running the `deploy.json` file inside CloudFormation. The `deploy.json` template will ask for the following parameters:

1. **AppName**: Name of the S3 Bucket to create that should house the website. This must be unique.
3. **CodeBuildImage**: Name of the CodeBuild container image to use. Default should be fine, but customizable if desired.
4. **CognitoPool**: Name of the Cognito Pool to create to use for authentication purposes.
5. **GitHubRepoBranch**: Branch of the GitHub repo that houses the application code.
6. **GitHubRepName**: Name of the GitHub repo that houses the application code.
7. **GitHubToken**: GitHub token to use for authentication to the GitHub account. Configurable inside Github: https://github.com/settings/tokens. Token needs `repo_hook` permissions.
8. **GitHubUser**: GitHub Username.
9. **SAMInputFile**: Serverless transform file. By default, this is the included `sam.json` file.
10. **SAMOutputFile**: The filename for the output file from the buildspec file. This doesn't need to be changed unless the artifact file inside the `buildspec.yml` file is changed to a different name.

The files referenced (e.g. SAMInputFile) are expected to exist within the GitHub repository. The CloudFormation deployment will warn that it is created IAM permissions. This is because it creates roles and policies for the pipeline to use.

The initial CloudFormation Stack should be created after `deploy.json` is launched. Once that stack is created, the CodePipeline will then create the pipeline stack after a period of time. The pipeline stack will be called ``{parent-stack}-serverless-stack``.

After initial deployment, the site will not be fully functional as the `config.js` file still needs to be updated so the site knows how to utilize the services. Within the parent Stack, the Outputs tab should display the following items:

Also needed after deployment is to configure Cognito -> User Pools -> <Created Pool> -> General Settings -> Triggers -> Custom Message Trigger to point to the cogDomainVerify Lambda function. This will enable limiting signups to the email domain configured in the function.

1. **UserPoolClientId**
2. **BucketName**
3. **UserPoolId**
4. **OriginURL**

Within the child pipeline Stack, the Outputs tab should display the following items:

1. **ApiUrl** 

The `UserPoolClientId`, `UserPoolId`, `OriginURL`, and `ApiUrl` should all now be placed into the `website/js/config.js` file so that the website knows how to use the services provisioned; this is a one-time process. Once the `config.js` file is updated, push the change to the GitHub repo; this will automatically update the application with the new config through the pipeline.

The site should now work as expected. Browse to the URL defined within `OriginURL`, and select "Register" from the top right drop-down. Enter an email address and password, and select Register. You will receive a verification code from Cognito. Once received, select "Verify" from the top right drop-down; on the verify page, enter your email and verification code provided.

Try browsing to the "Squirrel Farm". If you have not logged in, you should be redirected to the Sign-In page. Enter your credentials, and you should now be taken to the "Squirrel Farm". Within the graphic in the middle of the page, one SAM Squirrel should initially be displayed, and then it should increase to 15 shortly thereafter, once it has reached out and asked API Gateway/Lambda how many it should display.

You can also browse directly to the API Gateway/Lambda function and see how many Squirrels should be displayed. You can do this by browsing to the "ApiUrl" listed in the pipeline Stack and appending '/sam' to the end (e.g. https://od3tfr5l1a.execute-api.us-east-1.amazonaws.com/Prod/sam). By default, it should return '15'.

As the website or serverless function is updated, simply perform the modifications and then push them to the GitHub repo. Once checked in to Github, CodePipeline will handle the rest automatically. To test this functionality, browse to the CodePipeline page and view the pipeline while pushing a change. The pipeline will show the process from Source -> Build -> Deploy. If there are any failures, they will be visible within the pipeline.

## Services

This project leverages the following AWS services:
1. [CloudFormation](https://aws.amazon.com/cloudformation/): Used to deploy the entire stack.
2. [AWS Serverless Application Model](https://aws.amazon.com/about-aws/whats-new/2016/11/introducing-the-aws-serverless-application-model/): Used to provision Lambda/API Gateway.
3. [S3](https://aws.amazon.com/s3/): Used to provide static website hosting and to store our build artifacts.
4. [Lambda](https://aws.amazon.com/lambda/): Used to perform Functions-as-a-Service.
5. [API Gateway](https://aws.amazon.com/api-gateway/): Used to provide an integration point to our Lambda functions.
6. [Cognito](https://aws.amazon.com/cognito/): Used to provide authentication for our website.
7. [IAM](https://aws.amazon.com/iam/): Provides security controls for our process.
8. [CodePipeline](https://aws.amazon.com/codepipeline/): Used to provide the pipeline functionality for our CI/CD process.
9. [Code Build](https://aws.amazon.com/codebuild/): Used to build the project as part of CodePipeline process.
10. [GitHub](http://www.github.com): Used as the source code repository. Could theoretically be replaced with CodeCommit.

## Components

### Website

The code for the website are placed within the website/ folder. [Jekyll](https://jekyllrb.com/) is used for static site generation. The site will be built through Code Build as part of the process. It can also be viewed locally through `jekyll serve` within the website directory.

### Lambda

Lambda functions are located within the lambda/ folder. These can be tested with the events within the corresponding sample_events/ folder.

### Pipeline

The code for the pipeline resides within the root.

1. **deploy.json**: Launcher for the core services within CloudFormation (S3, CodePipeline, CodeBuild, Cognito). These are not modified by the pipeline on changes, but it does include setting up the pipeline itself. This is the CloudFormation template to launch to get setup started.
2. **buildspec.yml**: This file is used by CodeBuild to tell it what to do on every build.
3. **sam.json**: CloudFormation Serverless Transformation template for SAM.

### Notes

1. If you want to delete the stack, make sure to delete the pipeline-created stack first and then delete the parent stack. If you delete the parent first, the IAM role is deleted and you'll have to tinker around with permissions to get the stack to actually gracefully delete.
