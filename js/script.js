$(document).ready(() => {

    // ************** Barre de navigation ******************

    $('#icon').on('click', () => {
        $('#nav-bars-icon').toggleClass('fa-bars fa-close');
        console.log("ok");
    })

    $('nav ul li a').on('click', () => {
        $('nav ul li a').removeClass('active');
        $(this).addClass('active');
    });

    $('nav .dropdown').on('hover', () => {
        $('.dropdown-content').toggle();
    });

})
