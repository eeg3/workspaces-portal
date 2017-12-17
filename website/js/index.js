/*global Dashboard _config*/

var Dashboard = window.Dashboard || {};
var authToken;

(function ($) {

    var WORKSPACES_CONTROL_URL = _config.api.invokeUrl + '/workspaces-control';
    
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

    $(function onDocReady() {

        $('#RequestWorkSpace').submit(handleRequest);

    });

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
            beforeSend: function () {
                //$('#loading-image').show();
                console.log("URL: " + WORKSPACES_CONTROL_URL);
                console.log("Token: " + authToken);
                console.log("json: " + JSON.stringify({
                    action: 'create',
                    username: username,
                    bundle: bundle
                }));
            },
            complete: function () {
                //$('#loading-image').hide();
            },
            data: JSON.stringify({
                action: 'create',
                username: username,
                bundle: bundle
            }),
            contentType: 'text/plain',
            success: function (data) {
                console.log("WorkSpace creating...");
            }
        });

    }

    $(function init() {
        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });
    
}(jQuery));