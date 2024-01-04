$(document).ready(function () {
    $('section:not(#accueil)').addClass('hidden');

    // ************** Navigation ******************

    $('#icon').on('click', () => {
        $('#nav-bars-icon').toggleClass('fa-bars fa-close');
    });

    $(document).on('click', function (e) {
        if ($('#nav-bars-icon').hasClass('fa-close')) {
            isNavBarIcon = $(e.target).attr('id') == 'nav-bars-icon' ? true : false;
            isCheckbox = $(e.target).attr('id') == 'checkbox' ? true : false;
            isIcon = $(e.target).attr('id') == 'icon' ? true : false;
            if (isNavBarIcon == false && isCheckbox == false && isIcon == false) {
                $('#icon').click();
            }
        }
    });

    $('nav ul li a').on('click', function () {
        $('nav ul li a').removeClass('active');
        $(this).addClass('active');
    });

    $('nav .dropdown').on('hover', () => {
        $('.dropdown-content').toggle();
    });

    $('.link-section').on('click', function () {
        var sectionCible = $(this).data("section");
        $('section:not(#' + sectionCible + ')').addClass('hidden');
        $('#' + sectionCible).removeClass('hidden');
        $('nav ul li a').removeClass('active');
        $('nav ul li a[data-section=' + sectionCible + ']').addClass('active');
    });

    // ************** Produits ******************

    $('.list-produits-type-inox').css("min-height", screen.height - ($("footer").height() * 4 - 16));
    $('.list-produits-type-sol').css("min-height", screen.height - ($("footer").height() * 4 - 16));
    $('.list-produits-type-parois').css("min-height", screen.height - ($("footer").height() * 4 - 16));
    $('.list-produits-type-mc').css("min-height", screen.height - ($("footer").height() * 4 - 16));
    $('.contact-content').css("min-height", screen.height - ($("footer").height() * 3 - 8));

    $(".btn-filtre").on('click', function () {
        $(".btn-filtre").removeClass("active");
        $(this).addClass("active");
        var filtre = $(this).data("filter");
        var produit = $(this).data("produit");
        console.log('filtre => ' + filtre);
        console.log('produit => ' + produit);
        if (produit == "sol") {
            console.log('On est dans les sols');
            $('.carte-produit-sol').each(function () {
                if ($(this).data("categorie") != filtre) {
                    $(this).addClass('hidden');
                }
                else {
                    $(this).removeClass('hidden');
                }
            });
        }
        else if (produit == "paroi") {
            $('.carte-produit-paroi').each(function () {
                if ($(this).data("categorie") != filtre) {
                    $(this).addClass('hidden');
                }
                else {
                    $(this).removeClass('hidden');
                }
            });
        }
    });
})
