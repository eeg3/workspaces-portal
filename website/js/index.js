/*global Dashboard _config*/

var Dashboard = window.Dashboard || {};
var authToken;

(function ($) {
    
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
    

    $(function init() {
        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });
    
}(jQuery));