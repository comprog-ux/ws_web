<div class="panel panel-danger" ng-if="club.club.address_incomplete">
    <div class="panel-heading">{{_('Addressuppgifter för din förening är ej fullständiga')}}</div>
    <div class="panel-body">
        {{_('Det verkar som att din förening saknar adressuppgifter')}}.
        <a ui-sref="club.edit">{{_('Redigera information')}}</a>
    </div>
</div>
<div class="panel panel-default" ng-if="invoices.clubs.length">
    <div class="panel-heading">{{_('Generera fakturor')}}</div>
    <div class="panel-body">
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>{{_('Avsändare')}}</th>
                        <td>{{_('Antal anmälningar')}}</td>
                        <td>{{_('Avgifter')}}</td>
                        <td>{{_('Antal lag')}}</td>
                        <td>{{_('Avgifter')}}</td>
                        <td>{{_('Summa avgifter')}}</td>
                    </tr>
                </thead>
                <tbody>
                    <tr ng-repeat="club in invoices.clubs">
                        <td><% club.name %></td>
                        <td class="text-right"><% club.signups.length %></td>
                        <td class="text-right"><% club.signups | sumByKey:'registration_fee' %></td>
                        <td class="text-right"><% club.teams.length %></td>
                        <td class="text-right"><% club.teams | sumByKey:'registration_fee' %></td>
                        <td class="text-right"><% (club.signups | sumByKey:'registration_fee') + (club.teams | sumByKey:'registration_fee') %></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <button class="btn btn-primary" ng-click="invoices.createInvoice(invoices.signups);">{{_('Generera fakturor')}}</button>
    </div>
</div>
<div class="panel panel-primary" ng-if="invoices.clubs.length" ng-repeat="club in invoices.clubs">
    <div class="panel-heading"><% club.name %></div>
    <div class="panel-body" ng-if="club.signups.length">
        <h4>{{_('Anmälningar')}}</h4>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-bordered">
            <thead>
            <tr>
                <th width="10">{{_('Fakturera')}}</th>
                <th>{{_('Användare')}}</th>
                <th>{{_('Tävling')}}</th>
                <th>{{_('Vapengrupp')}}</th>
                <th class="text-right">{{_('Summa')}}</th>
            </tr>
            </thead>
            <tbody>
                <tr ng-repeat="signup in club.signups">
                    <td><input type="checkbox" ng-click="invoices.toggleInvoiceSignup(signup)" checked></td>
                    <td><a ui-sref="club.users.show({user_id: signup.user.user_id})"><% signup.user.fullname %></a></td>
                    <td><a ui-sref="competition.clubsignups({id: signup.competitions_id})"><% signup.competition.date %> <% signup.competition.name %></a></td>
                    <td><% (signup.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %></td>
                    <td class="text-right"><% signup.registration_fee %></td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="panel-body" ng-if="club.teams.length">
        <h4>{{_('Lag')}}</h4>
    </div>
    <div class="table-responsive" ng-if="club.teams.length">
        <table class="table table-hover table-bordered">
            <thead>
            <tr>
                <th width="10">{{_('Fakturera')}}</th>
                <th>{{_('Lag')}}</th>
                <th>{{_('Tävling')}}</th>
                <th>{{_('Vapengrupp')}}</th>
                <th class="text-right">{{_('Summa')}}</th>
            </tr>
            </thead>
            <tbody>
            <tr ng-repeat="team in club.teams">
                <td><input type="checkbox" ng-click="invoices.toggleInvoiceTeam(team)" ng-checked="invoices.teamIsSelected(team)"></td>
                <td><a ui-sref="competition.teamsignups({id: team.competitions_id})"><% team.name %></a></td>
                <td><a ui-sref="competition.clubsignups({id: team.competitions_id})"><% team.competition.date %> <% team.competition.name %></a></td>
                <td><% team.weapongroup.name %></td>
                <td class="text-right"><% team.registration_fee %></td>
            </tr>
            </tbody>
        </table>
    </div>
    <div class="panel-body">
        <h4>{{_('Summering')}}</h4>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered">
            <thead>
            <tr>
                <td>{{_('Antal anmälningar')}}</td>
                <td>{{_('Avgifter')}}</td>
                <td>{{_('Antal lag')}}</td>
                <td>{{_('Avgifter')}}</td>
                <td>{{_('Summa avgifter')}}</td>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td class="text-right"><% club.signups.length %></td>
                <td class="text-right"><% club.signups | sumByKey:'registration_fee' %></td>
                <td class="text-right"><% club.teams.length %></td>
                <td class="text-right"><% club.teams | sumByKey:'registration_fee' %></td>
                <td class="text-right"><% (club.signups | sumByKey:'registration_fee') + (club.teams | sumByKey:'registration_fee') %></td>
            </tr>
            </tbody>
        </table>
    </div>

</div>

<button class="btn btn-primary" ng-click="invoices.createInvoicesFromSelectedRows();" ng-if="invoices.clubs.length">{{_('Generera fakturor utifrån valda rader')}}</button>

<div class="panel panel-default" ng-if="!invoices.clubs.length">

    <div class="panel-heading">{{_('Generera fakturor')}}</div>
    <div class="panel-body">
        {{_('Det finns inga fakturor att generera.')}}
        <hr>
        <button ui-sref="club.invoices.index" class="btn btn-primary">{{_('Fakturaöversikt')}}</button>
    </div>
</div>