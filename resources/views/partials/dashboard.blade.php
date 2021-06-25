<div class="row">
    <div class="col-sm-3">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Snabblänkar')}}
            </div>
            <ul class="list-group">
                <a class="list-group-item" ui-sref="signups">{{'Dina anmälningar'}}</a>
                <a class="list-group-item" ui-sref="competitions.create">{{''}}</a>
                <a class="list-group-item" ui-sref="competitions">{{'Tävlingar'}}</a>
                <a class="list-group-item" ui-sref="club.information">{{'Din förening'}}</a>
                <!-- <a class="list-group-item" ui-sref="premium">{{'Premium'}}</a> -->
                <a class="list-group-item" ui-sref="settings.user">{{'Personlig information'}}</a>
                <a class="list-group-item" ui-sref="settings.invite">{{'Bjud in någon till Webshooter'}}</a>
                <a class="list-group-item" href="http://support.webshooter.se" target="_self">{{'Support'}}</a>
                <a class="list-group-item" ui-sref="auth.logout">{{'Logga ut'}}</a>
            </ul>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Välkommen till Webshooter.se')}}
            </div>
            <div class="panel-body">
                <p>Webshooter.se är ett verktyg som underlättar hanteringen av tävlingar för din förening och dig som medlem.</p>
                <p>Vår erfarenhet säger att det finns ett fåtal verktyg som lämpar sig för fullständig hantering av tävlingar, anmälda deltagare och resultatlistor. Även om lokala installationer, kalkylark av olika format och utländska webblösningar tillfredställer grundläggande behov är vi övertygade om att en gemensam portal är den rätta lösningen.</p>
                <p>Utveckling av Webshooter.se sker löpande i den ordningen som användare efterfrågar funktioner. Oavsett vad du har på hjärtat som du vill dela med oss eller som du undrar över vill vi gärna att du hör av dig. Vi svara på alla frågor och funderingar som kommer till oss!</p>
                <h4>Vi hälsar dig hjärtligt välkommen!</h4>
            </div>
        </div>
        <div class="panel panel-primary">
            <div class="panel-heading">
                Kontakt
            </div>
            <div class="panel-body">
                <p>Det säkraste sättet att komma i kontakt med oss är att skicka ett <a href="mailto:support@webshooter.se" target="_blank" class="nowrap">e-postmeddelande</a>. Det är inga problem om du hellre vill ha ett samtal med oss. Meddela i sådant fall vad du skulle vilja prata om så ringer vi upp dig så fort vi får möjlighet. Vi försöker svara inkommande samtal i största möjliga mån men främst under kontorstider.</p>
            </div>
            <div class="panel-body text-center">
                <div class="row">
                    <div class="col-sm-6">
                        <b>E-POST</b><br>
                        <address>
                            <a href="mailto:support@webshooter.se">support@webshooter.se</a>
                        </address>
                    </div>
                    <div class="col-sm-6">
                        <b>WEBBPLATS</b><br>
                        <address>
                            <a href="https://webshooter.se">webshooter.se</a><br>
                            <a href="http://support.webshooter.se" target="_self">support.webshooter.se</a>
                        </address>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <b>TELEFON</b><br>
                        <address>
                            Ingen telefon<br>
                            <small class="text-muted">Vi försöker svara i största möjliga mån men främst under kontorstider.</small>
                        </address>
                    </div>
                    <div class="col-sm-6">
                        <b>POSTADRESS</b><br>
                        <address>
                            Webshooter LM AB<br>
                            Hallandsvägen 9<br>
                            245 38 Staffanstorp
                        </address>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-3">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Senaste nyheter')}}
            </div>
            <div id="fb-root"></div>
            <div class="fb-page" data-href="https://www.facebook.com/webshooter.se" data-tabs="timeline" data-small-header="true" data-adapt-container-width="true" data-hide-cover="true" data-show-facepile="true"><div class="fb-xfbml-parse-ignore"><blockquote cite="https://www.facebook.com/webshooter.se"><a href="https://www.facebook.com/webshooter.se">Webshooter</a></blockquote></div></div>
        </div>
    </div>
</div>
