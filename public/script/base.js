$(document).ready(function() {
    var className = '';
    $('nav a').mouseenter(function() {
        className = $(this).attr('class');
        $('nav').addClass(className);
    })
    $('nav a').mouseleave(function() {
        className = $(this).attr('class');
        $('nav').removeClass(className);
    })
})