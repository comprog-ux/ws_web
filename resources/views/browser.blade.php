<!DOCTYPE html>
<html lang="sv" ng-app="app">
<!DOCTYPE html>
<html lang="sv" ng-app="app">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Webshooter.se är ett webbaserat system som tillgodoser behoven av medlem- och resultathantering för föreningar, medlemmar och eventuella överliggande förbund.">
    <title>Webshooter.se</title>


    {{-- FONTS --}}
    <link href='https://fonts.googleapis.com/css?family=Lato:300,400,700' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Montserrat:300,400,700' rel='stylesheet' type='text/css'>

    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body>
<nav class="navbar navbar-default margin-bottom-20">
    <div class="container">
        <div class="row">
            <div class="col-sm-12">

                <div class="navbar-header">
                    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                        <span class="sr-only">{{_('Toggle navigation')}}</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" href="/"><img src="{{url('img/webshooter-logo.png')}}" class="logo"></a>
                </div>

            </div>
        </div>
    </div>

    <hr class="margin-0">
</nav>

<div class="container-fluid">

    <div class="row padding-top-50 padding-bottom-50 margin-bottom-50 text-primary">
        <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2 text-center">
            <h1>VÄLKOMMEN TILL WEBSHOOTER.SE</h1>
        </div>
    </div>

    <div class="row margin-bottom-50">
        <div class="col-sm-8 col-sm-offset-2">
            <div class="panel panel-primary">
                <div class="panel-heading">{{_('Du använder en föråldrad webbläsare')}}</div>
                <div class="panel-body text-center">
                    {{_('För att Webshooter ska fungera korrekt ber vi dig använda en modern webbläsare. Dessvärre verkar du använda en webbläsare som ej längre stöds och vi kan därför ej garantera fullständig funktionalitet. Vi ber dig därför att växla till eller installera en modernare webbläsare.')}}
                    <h3>{{_('Vi föreslår någon av följande webbläsare')}}</h3>
                    <?php
                        $browsers = [
                            [
                                'browser'=>'Google Chrome',
                                'icon'=>'fa-chrome',
                                'link'=>'https://www.google.com/chrome'
                            ],
                            [
                                'browser'=>'Mozilla Firefox',
                                'icon'=>'fa-firefox',
                                'link'=>'https://www.firefox.com/'
                            ],
                            [
                                'browser'=>'Safari',
                                'icon'=>'fa-safari',
                                'link'=>'https://www.apple.com/safari/'
                            ],
                            [
                                'browser'=>'Opera',
                                'icon'=>'fa-opera',
                                'link'=>'http://www.opera.com/'
                            ],
                            [
                                'browser'=>'MS Edge',
                                'icon'=>'fa-edge',
                                'link'=>'https://www.microsoft.com/en-us/windows/microsoft-edge'
                            ],
                            [
                                'browser'=>'Internet Explorer',
                                'icon'=>'fa-internet-explorer',
                                'link'=>'http://windows.microsoft.com/ie'
                            ],
                        ];
                    ?>

                    <div class="row margin-top-30">
                        <?php
                            foreach($browsers as $browser):
                                echo '<div class="col-sm-4 col-lg-2 text-center padding-bottom-30">';
                                echo '<a href="'.$browser['link'].'"><i class="text-muted fa fa-4x '.$browser['icon'].'"></i></a>';
                                echo '<a href="'.$browser['link'].'" style="min-height: 70px; display:block" target="_blank"><h4>'.$browser['browser'].'</h3></a>';
                                echo '</div>';
                            endforeach;
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row padding-top-50 padding-bottom-50 background-color-primary text-white">
    <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
        <h1>INTRODUKTION</h1>
        <p>Vilket resultat fick jag vid min senaste tävling och hur ligger jag till totalt? Till dagens datum finns det en stor utmaning i att hantera föreningar och dess tillhörande medlemmar. Utmaningen blir dessutom större och mer komplex när det kommer till resultathantering vid tävling och träningar. Webshooter är ett webbaserat system som tillgodoser behoven av medlem- och resultathantering för föreningar, medlemmar och eventuella överliggande förbund.</p>
    </div>
</div>

<div class="row padding-top-50 padding-bottom-50 background-color-white">
    <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
        <h1>FÖRENINGAR OCH MEDLEMMAR</h1>
        <p>Genom Webshooter har föreningar möjlighet att hantera ett grundläggande register över medlemmar. Som enskild medlem har du möjlighet hantera din egen information och se medlemskap i föreningar.</p>
    </div>
</div>

<div class="row padding-top-50 padding-bottom-50 background-color-primary text-white">
    <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
        <h1>TÄVLINGAR</h1>
        <p>Vår erfarenhet säger att det finns ett fåtal verktyg som lämpar sig för fullständig hantering av tävlingar, anmälda deltagare och resultatlistor. Även om lokala installationer, kalkylark av olika format och utländska webblösningar tillfredställer grundläggande behov är vi övertygade om att en gemensam portal är den rätta lösningen.</p>

        <p>Webshooter hanterar tävlingen, tar emot anmälan, sköter patruller och ser till att resultatet kan matas in oavsett om du använder en stationär dator, mobiltelefon, linuxburk eller läsplatta. Om du använder dig av <u><a href="http://www.winshooter.se" target="_blank" class="text-white">Winshooter</a></u>* eller om du har tidigare erfarenheter av programmet kommer du att känna igen de flesta av funktionerna.</p>

        <small>*) Webshooter har ingen direkt koppling till Winshooter dock finns det en vänskaplig dialog.</small>
    </div>
</div>

<div class="row padding-top-50 padding-bottom-50">
    <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
        <h1>BEHÖVER DU HJÄLP?</h1>
        <h4>Webshooter support finns här för att hjälpa dig!</h4>
        <a href="http://support.webshooter.se" target="_self" class="btn btn-primary margin-bottom-20 margin-top-10">Gå till supportsidorna</a>
        <p>Säkraste sättet att komma i kontakt med oss är att skicka ett e-postmeddelande till <a href="mailto:support@webshooter.se">support@webshooter.se</a>. Det är inga problem om du hellre vill ha ett samtal med oss. Meddela i sådant fall vad du skulle vilja prata om så ringer vi upp dig så fort vi får möjlighet.</p>
        <p>Oavsett vad du på hjärtat som du vill dela med oss eller som du undrar över vill vi gärna att du hör av dig. Vi försöker svara på alla frågor och funderingar som kommer till oss!</p>
    </div>
</div>

<div class="row padding-top-50 padding-bottom-50 background-color-white">
    <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
        <div class="row">
            <div class="col-sm-6">
                <i class="fa fa-3x fa-home"></i>
                <h3>POSTADRESS</h3>
                <address>
                    Webshooter LM AB<br>
                    Hallandsvägen 9<br>
                    24538 Staffanstorp
                </address>
            </div>
            <div class="col-sm-6">
                <i class="fa fa-3x fa-phone"></i>
                <h3>TELEFON</h3>
                <address>
                    Ingen telefon<br>
                    <small class="text-muted">Vi försöker svara i största möjliga mån men främst under kontorstider.</small>
                </address>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6">
                <i class="fa fa-3x fa-envelope"></i>
                <h3>E-POST</h3>
                <address>
                    <a href="mailto:support@webshooter.se">support@webshooter.se</a>
                </address>
            </div>
            <div class="col-sm-6">
                <i class="fa fa-3x fa-globe"></i>
                <h3>WEBBPLATS</h3>
                <address>
                    <a href="https://webshooter.se">webshooter.se</a><br>
                    <a href="http://support.webshooter.se" target="_self">support.webshooter.se</a>
                </address>
            </div>
        </div>
    </div>
</div>

@include('layouts.footer')
