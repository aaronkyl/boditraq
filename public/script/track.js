$(document).ready(function() {
    $('select').change(function() {
        window.location.replace('/track?units=' + $('select').val());
    });
    
    let n = new Date();
    
    $('#user-date').val(n);
    
    $('input').focus(function() {
        let name = $(this).attr('name');
        console.log(name);
        $('label[for=' + name + '], .' + name).addClass('focused');
        $('.track-img').addClass('track' + name);
    });
    
    $('input').focusout(function() {
        let name = $(this).attr('name');
        $('label[for=' + name + '], .' + name).removeClass('focused');
        $('.track-img').removeClass('track' + name);
    });
});