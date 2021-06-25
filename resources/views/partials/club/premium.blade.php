<div class="panel panel-default hide" ng-class="{'show': !premium.club.club_premium}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12">{{_('Teckna föreningens premiumkonto')}}</div>
        </div>
    </div>

    <div class="panel-body" ng-if="!club.club.admins.length">
        <p>{{_('Du behöver vara administratör för din förening innan du kan förhandsregistrera ert premiumkonto. Din förening har än så länge inte någon administratör kopplad till sig och du kan därmed koppla dig själv som administratör.')}}</p>
        <hr>
        <div class="row">
            <div class="col-sm-3">
                <button class="btn btn-primary" ng-click="club.addUserAsAdmin(currentUser.user_id)">{{_('Lägg till dig som administratör')}}</button>
            </div>
        </div>
    </div>

    <div class="panel-body" ng-if="club.club.user_has_role != 'admin' && club.club.admins.length">
        <p>{{_('Du saknar administratörs behörighet till din förening och kan därmed inte teckna ett premiumkonto. Ta gärna kontakt med någon som har administratörsroll.')}}</p>
    </div>

    <div class="panel-body hide" ng-class="{'show': club.club.user_has_role == 'admin'}">
        <p>Fram till sista SM dagen, söndag 2016-07-10, har du möjlighet att förhandsregistrera ett <b>premiumkonto till er förening<sup>*</sup></b> till ett reducerat pris.</p>
        <h4>Teckna ert årsabonnemang för endast</h4><h1 class="margin-top-0">495:- /år</h1>
        <p>{{_('Vi kommer att meddela dig när det är dags att fullfölja betalningen och aktivera ditt premiumkonto.')}}</p>
        <button class="btn btn-primary" ng-click="premium.registerPremium();">{{_('Ja, förhandsregistrera min förening')}}</button>
    </div>
</div>

<div class="panel panel-default hide" ng-class="{'show': premium.club.club_premium}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12">{{_('Premiumkonto')}}</div>
        </div>
    </div>

    <div class="panel-body">
        <p>{{_('Din förening har förhandsregistrerats för ett Premiumkonto hos Webshooter.')}}</p>
        <p>{{_('Vi kommer att meddela er när det är dags att fullfölja betalningen och aktivera ditt premiumkonto.')}}</p>
    </div>
</div>

