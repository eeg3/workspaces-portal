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
    $("#methodStatus").hide();
    $("#desktopNoExist").hide();
    $("#desktopExist").hide();
    $("#confirmDecommissionModal").hide();

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
                $("methodStatus").removeClass();
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html("<b>Error! Something went wrong... Please contact an administrator if the problem persists.")
                $("#methodStatus").show();
            },
            success: function (data) {
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html("<b>Success! WorkSpace request submitted...</b> This request must be approved before the WorkSpace will be created. An email has been sent to <b>" + _config.approval.email + "</b> to authorize this request. Once approved, the WorkSpace will be created automatically and an email will be sent to your email with instructions for access.");
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
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html("<b>Error! Something went wrong... Please contact an administrator if the problem persists.")
                $("#methodStatus").show();
            },
            success: function (data) {
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html("<b>Success! WorkSpace reboot in-progress...</b> Please allow up to 5 minutes for the virtual desktop to be fully rebooted.")
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
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html("<b>Error! Something went wrong... Please contact an administrator if the problem persists.")
                $("#methodStatus").show();
            },
            success: function (data) {
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html("<b>Success! WorkSpace rebuild in-progress...</b> Please allow up to 10 minutes for the virtual desktop to be fully rebuilt. Once complete, an email will be sent with details.")
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
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-danger");
                $("#methodStatus").html("<b>Error! Something went wrong... Please contact an administrator if the problem persists.")
                $("#methodStatus").show();
            },
            success: function (data) {
                clearAlerts("#methodStatus");
                $("#methodStatus").addClass("alert-success");
                $("#methodStatus").html("<b>Success! WorkSpace removal in-progress...</b> Please allow up to 10 minutes for the virtual desktop to be fully removed.")
                $("#methodStatus").show();
                setTimeout(function () {
                    location.reload();
                }, 60000);
            }
        });
    }

    function clearAlerts(elementName) {
        var alerts = ["alert-success", "alert-danger", "alert-warning"];

        alerts.forEach(function (item) {
            $(elementName).removeClass(item);
        });
    }

    $(function init() {

        if (!_config.api.invokeUrl) { // Show this message if the Portal's API is not configured.
            $('#noApiMessage').show();
        }

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

                console.log("Details: " + JSON.stringify(data));

                for (var i = 0; i < data.length; i++) {
                    console.log("WS_Status: " + data[i].WS_Status.S);
                    if (data[i].WS_Status.S == "Requested") {
                        clearAlerts("#methodStatus");
                        $("#methodStatus").addClass("alert-warning");
                        $("#methodMessage").html("Desktop pending approval.");
                        $("#methodCommand").html('<button id="cancelRequest" class="btn btn-primary">Cancel Request</button>');
                        $("#methodStatus").show();
                    } else if (data[i].WS_Status.S == "Rejected") {
                        clearAlerts("#methodStatus");
                        $("#methodStatus").addClass("alert-danger");
                        $("#methodMessage").html("Desktop request rejected.");
                        $("#methodCommand").html('<button id="acknowledgeReject" class="btn btn-primary">Acknowledge</button>');

                        $("#acknowledgeReject").on('click', function () {
                            $.ajax({
                                method: 'POST',
                                url: WORKSPACES_CONTROL_URL,
                                headers: {
                                    Authorization: authToken
                                },
                                beforeSend: function () {},
                                complete: function () {},
                                data: JSON.stringify({
                                    action: 'acknowledge'
                                }),
                                contentType: 'text/plain',
                                error: function () {},
                                success: function (data) {
                                    $("#methodStatus").hide();
                                    console.log("Details: " + JSON.stringify(data));
                                }
                            });
                        });

                        $("#methodStatus").show();
                    }
                }
            }
        });


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
                        $('#reqBundle')
                            .append($("<option></option>")
                                .attr("value", "error")
                                .text("ERROR: No bundles found."));
                        $("#desktopNoExist").show(); // If no WorkSpace is returned, show the request panel.
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
    });

}(jQuery));