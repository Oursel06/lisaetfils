$(document).ready(function () {

    $("#modal").hide();

    // ************** Barre de navigation ******************

    $('#icon').on('click', () => {
        $('#nav-bars-icon').toggleClass('fa-bars fa-close');
    })

    $('nav ul li a').on('click', function () {
        $('nav ul li a').removeClass('active');
        $(this).addClass('active');
    });

    $('nav .dropdown').on('hover', () => {
        $('.dropdown-content').toggle();
    });


    // ************** Produits ******************

    $('.list-produits-type').css("min-height", screen.height - ($("footer").height() * 4 - 38));

    $('.image-zoom').click(function () {
        $('#modal').show().toggleClass('animate');
        $('.overflow').removeClass("hidden");
        $("#modal img").attr('src', $(this).find('img').attr('src'));
        $("#modal p").html($(this).find('p').text());
    });

    $(".overflow, #modal i").click(function () {
        $(".overflow").addClass("hidden");
        $('#modal').toggleClass('animate').hide(50);
    });

    $(".btn-filtre").click(function () {
        $(".btn-filtre").removeClass("active");
        $(this).addClass("active");
        var categorie = $(this).data("filter");
        $('.carte-produit').each(function () {
            if ($(this).data("categorie") != categorie) {
                $(this).addClass('hidden');
            }
            else {
                $(this).removeClass('hidden');
            }
        });
    });

    // ************** Realisation ******************

    $('.gallery-img').on('click', function () {
        $('#modal').show().toggleClass('animate');
        $('.overflow').removeClass("hidden");
        $("#modal img").attr('src', $(this).attr('src'));
        $("#modal p").html("Réalisation");
    });

})
