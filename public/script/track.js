$(document).ready(function() {
    $('select').change(function() {
        window.location.replace('/track?units=' + $('select').val());
    });
});