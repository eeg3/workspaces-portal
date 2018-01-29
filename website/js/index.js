/*global Dashboard _config*/

var Dashboard = window.Dashboard || {};
var authToken;

(function ($) {

    // The API for the Workspaces Control function that handles create, reboot, rebuild, and delete operations.
    var WORKSPACES_CONTROL_URL = _config.api.invokeUrl + '/workspaces-control';

    // Check for an Authorization Token, and if one doesn't exist then redirect user to sign in.
    Dashboard.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    // Hide all of these panels by default, and show them as appropriate.
    $("#desktopNoExist").hide();
    $("#desktopExist").hide();
    $('#desktopNoExist').removeAttr('hidden');
    $('#desktopExist').removeAttr('hidden');
    $("#methodStatus").hide();
    $("#confirmDecommissionModal").hide();


    // The handleRequest function gets creation form input (username, bundle) and passes it to the Workspaces Control API.
    // Workspaces Control API handles the 'create' action by initiating a Step Function State Machine that requires Email Approval before creation.
    // The WorkSpace will be created with a tag of "SelfServiceManaged" set to the email address within the Cognito auth token. This is how the portal
    // ensures ownership of the WorkSpace without requiring direct Directory Services integration. WorkSpaces created outside of the portal cannot be 
    // managed by the portal unless the "SelfServiceManaged" tag is manually set on the pre-existing WorkSpace.
    function handleRequest(event) {
        event.preventDefault();

        var username = $('#reqUsername').val();
        var bundle = $('#reqBundle').val();

        $.ajax({
            method: 'POST',
            url: WORKSPACES_CONTROL_URL,
            headers: {
                Authorization: authToken
            },
            beforeSend: function () {},
            complete: function () {},
            data: JSON.stringify({
                action: 'create',
                username: username,
                bundle: bundle
            }),
            contentType: 'text/plain',
            error: function () {
                $("#methodStatus").append('<div class="alert alert-danger"><b>Error! Something went wrong... Please contact an administrator if the problem persists.</div>');
                $("#methodStatus").show();
            },
            success: function (data) {
                $("#methodStatus").append('<div class="alert alert-success"><b>Success! WorkSpace request submitted...</b> This request must be approved before the WorkSpace will be created. An email has been sent to <b>' + _config.approval.email + '</b> to authorize this request. Once approved, the WorkSpace will be created automatically and an email will be sent to your email with instructions for access.</div>');
                $("#methodStatus").show();
            }
        });

    }

    // The handleReboot function does not require any inputs, as it determines the workspace to reboot by checking for a WorkSpace with
    // a "SelfServiceManaged" tag set to the email address of the Cognito token; this logic is handled inside the Lambda function.
    function handleReboot(event) {
        event.preventDefault();

        $.ajax({
            method: 'POST',
            url: WORKSPACES_CONTROL_URL,
            headers: {
                Authorization: authToken
            },
            beforeSend: function () {},
            complete: function () {},
            data: JSON.stringify({
                action: 'reboot'
            }),
            contentType: 'text/plain',
            error: function () {
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html('<div class="alert alert-danger"><b>Error! Something went wrong... Please contact an administrator if the problem persists.</div>');
                $("#methodStatus").show();
            },
            success: function (data) {
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html('<div class="alert alert-success"><b>Success! WorkSpace reboot in-progress...</b> Please allow up to 5 minutes for the virtual desktop to be fully rebooted.</div>');
                $("#methodStatus").show();
                setTimeout(function () {
                    location.reload();
                }, 60000);
            }
        });

    }

    // The handleRebuilt function does not require any inputs, as it determines the workspace to rebuild by checking for a WorkSpace with
    // a "SelfServiceManaged" tag set to the email address of the Cognito token; this logic is handled inside the Lambda function.
    function handleRebuild(event) {
        event.preventDefault();

        $.ajax({
            method: 'POST',
            url: WORKSPACES_CONTROL_URL,
            headers: {
                Authorization: authToken
            },
            beforeSend: function () {},
            complete: function () {},
            data: JSON.stringify({
                action: 'rebuild'
            }),
            contentType: 'text/plain',
            error: function () {
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html('<div class="alert alert-danger"><b>Error! Something went wrong... Please contact an administrator if the problem persists.</div>');
                $("#methodStatus").show();
            },
            success: function (data) {
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html('<div class="alert alert-success"><b>Success! WorkSpace rebuild in-progress...</b> Please allow up to 10 minutes for the virtual desktop to be fully rebuilt. Once complete, an email will be sent with details.</div>');
                $("#methodStatus").show();
                setTimeout(function () {
                    location.reload();
                }, 60000);
            }
        });

    }

    // This function is called to handle the initial click of "Delete WorkSpace", and opens a confirmation modal pop-up. Inside that modal is
    // another button that calls the actual deletion function.
    function handleDecommission(event) {
        event.preventDefault();

        $('#confirmDecommissionModal').modal({
            show: true,
            backdrop: 'static',
            keyboard: false
        });

    }

    // The handleConfirmDecommission function does not require any inputs, as it determines the workspace to rebuild by checking for a WorkSpace with
    // a "SelfServiceManaged" tag set to the email address of the Cognito token; this logic is handled inside the Lambda function. This function
    // is called after the user confirms deletion through the modal pop-up. The modal pop-up is initiated by handleDecommsion().
    function handleConfirmDecommission(event) {
        event.preventDefault();
        $.ajax({
            method: 'POST',
            url: WORKSPACES_CONTROL_URL,
            headers: {
                Authorization: authToken
            },
            beforeSend: function () {
                $('#confirmDecommissionModal').modal('hide');
            },
            complete: function () {},
            data: JSON.stringify({
                action: 'delete'
            }),
            contentType: 'text/plain',
            error: function () {
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html('<div class="alert alert-danger"><b>Error! Something went wrong... Please contact an administrator if the problem persists.</div>');
                $("#methodStatus").show();
            },
            success: function (data) {
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html('<div class="alert alert-success"><b>Success! WorkSpace removal in-progress...</b> Please allow up to 10 minutes for the virtual desktop to be fully removed.');
                $("#methodStatus").show();
                setTimeout(function () {
                    location.reload();
                }, 60000);
            }
        });
    }

    // The determineWorkspace function is called to get details of the assigned WorkSpace, and populate the WorkSpace details and action panes. In the event
    // there is no WorkSpace found,  populate the list of bundles available and allow the user to request one. The function takes an optional eventSource
    // parameter to handle recursion if necessary to avoid an initial bundle listing edge case.
    function determineWorkspace(eventSource) {
        $.ajax({
            method: 'POST',
            url: WORKSPACES_CONTROL_URL,
            headers: {
                Authorization: authToken
            },
            beforeSend: function () {
                $("#loadDiv").show(); // Show a spinning loader to let the user know something is happening.
            },
            complete: function () {
                $("#loadDiv").hide(); // Hide the spinning loader once the AJAX call is complete.
            },
            data: JSON.stringify({
                action: 'list'
            }),
            contentType: 'text/plain',
            error: function () {
                $.ajax({
                    method: 'POST',
                    url: WORKSPACES_CONTROL_URL,
                    headers: {
                        Authorization: authToken
                    },
                    beforeSend: function () {
                        $("#loadDiv").show(); // Show a spinning loader to let the user know something is happening.
                    },
                    complete: function () {
                        $("#loadDiv").hide(); // Hide the spinning loader once the AJAX call is complete.
                    },
                    data: JSON.stringify({
                        action: 'bundles'
                    }),
                    contentType: 'text/plain',
                    error: function () {
                        if (eventSource == "init") {
                            determineWorkspace("recursive");
                        } else {
                            $('#reqBundle')
                                .append($("<option></option>")
                                    .attr("value", "error")
                                    .text("ERROR: No bundles found."));
                            $("#desktopNoExist").show(); // If no WorkSpace is returned, show the request panel.
                        }
                    },
                    success: function (data) {
                        for (var i = 0; i < data.Result.length; i++) {
                            $('#reqBundle')
                                .append($("<option></option>")
                                    .attr("value", data.Result[i].split(':')[0])
                                    .text(data.Result[i].split(':')[1]));
                            $("#desktopNoExist").show(); // If no WorkSpace is returned, show the request panel.
                        }
                    }
                });
            },
            success: function (data) {
                // If a WorkSpace is returned, populate the table with its details (ID, Username, State, and Bundle ID).
                $("#workspace-Id").html(data.WorkspaceId);
                $("#workspace-Username").html(data.UserName);
                $("#workspace-State").html(data.State);
                $("#workspace-Bundle").html(data.BundleId);
                $("#desktopExist").show();
            }
        });
    }

    // the determineWorkflowStatus function is called to get the status details on the creation request. If the request is pending approval, the user is 
    // notified of such. If the request is rejected, the user is notified of such until they acknowledge. If this request is approved or doesn't exist, 
    // then nothing is displayed.      
    function determineWorkflowStatus() {
        $.ajax({
            method: 'POST',
            url: WORKSPACES_CONTROL_URL,
            headers: {
                Authorization: authToken
            },
            beforeSend: function () {},
            complete: function () {},
            data: JSON.stringify({
                action: 'details'
            }),
            contentType: 'text/plain',
            error: function () {

            },
            success: function (data) {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].WS_Status.S == "Requested") {
                        $("#methodStatus").append('<div class="alert alert-warning"><div class="row"><div class="col-sm-6 ml-right"><div class="methodMessage">WorkSpace approval pending for user: <b>' + data[i].Username.S + '</b></div></div><div class="col-sm-3 ml-auto"><div class="methodCommand"></div></div></div></div>');

                        $("#methodStatus").show();
                    } else if (data[i].WS_Status.S == "Rejected") {
                        $("#methodStatus").append('<div class="alert alert-danger alert-dismissible fade show"><button id="acknowledgeReject-' + data[i].Username.S + '" class="close" data-dismiss="alert" type="button"><span>&times;</span></button>WorkSpace request rejected for user: <strong>' + data[i].Username.S + '</strong></div>');

                        $("#acknowledgeReject-" + data[i].Username.S).on('click', function () {
                            $.ajax({
                                method: 'POST',
                                url: WORKSPACES_CONTROL_URL,
                                headers: {
                                    Authorization: authToken
                                },
                                beforeSend: function () {},
                                complete: function () {},
                                data: JSON.stringify({
                                    action: 'acknowledge',
                                    username: this.id.split("-")[1]
                                }),
                                contentType: 'text/plain',
                                error: function () {},
                                success: function (data) {
                                    location.reload();
                                }
                            });
                        });

                        $("#methodStatus").show();
                    }
                }
            }
        });
    }

    $(function init() {

        if (!_config.api.invokeUrl) { // Show this message if the Portal's API is not configured.
            $('#noApiMessage').show();
        }

        determineWorkflowStatus(); // Determine if there is an active request, and notify user of status.
        determineWorkspace("init"); // Determine if there is a WorkSpace assigned to the user, and if so then populate actions. If not, show the request div.

    });

    $(function onDocReady() {

        // Hook up functions to forms' submit buttons.
        $('#requestWorkSpace').submit(handleRequest);
        $('#decommissionWorkSpace').submit(handleDecommission);
        $('#confirmDecommissionWorkSpace').submit(handleConfirmDecommission);
        $('#rebootWorkSpace').submit(handleReboot);
        $('#rebuildWorkSpace').submit(handleRebuild);

        // If there is a WorkSpace for the user, give the user a direct button to refresh status.
        $("#reloadButton").on('click', function () {
            location.reload();
        });

    });

}(jQuery));