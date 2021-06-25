<div class="row">
    <div class="col-sm-8">
        <div class="panel panel-default" ng-if="invoices.signups.length">
            <div class="panel-heading">{{_('Generera fakturor')}}</div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <tr>
                                    <td>{{_('Antal anmälningar')}}</td>
                                    <td class="text-right"><% invoices.signups.length %></td>
                                </tr>
                                <tr>
                                    <td>{{_('Summa avgifter')}}</td>
                                    <td class="text-right"><%  invoices.signups | sumByKey:'registration_fee' %></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
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
                    <tr ng-repeat="signup in invoices.signups">
                        <td><input type="checkbox" ng-click="invoices.toggleInvoiceSignup(signup)" ng-checked="invoices.signupIsSelected(signup)"></td>
                        <td><a ui-sref="users.show({user_id: signup.user.user_id})"><% signup.user.fullname %></a></td>
                        <td><a ui-sref="competition.clubsignups({id: signup.competitions_id})"><% signup.competition.date %> <% signup.competition.name %></a></td>
                        <td><% (signup.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %></td>
                        <td class="text-right"><% signup.registration_fee %></td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel-body" ng-if="invoices.selectedSignups.length">
                <button class="btn btn-primary" ng-click="invoices.createInvoice(invoices.signups);">{{_('Generera fakturor')}}</button>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="panel panel-primary" ng-if="invoices.signups.length">
            <div class="panel-heading">{{_('Ska föreningen betala?')}}</div>
            <div class="panel-body">
                {{_('Här genererar du fakturor som du vill betala själv. När det är tänkt att din förening ska betala anmälningsavgifter bör fakturan skapas genom föreningen. En administratör för din förening har möjlighet att skapa fakturor för samtliga användare kopplade till föreningen och kan således betala anmälningsavgifterna istället för dig.')}}
                <hr>
                {{_('Som administratör hittar du fakturorna under "Din förening" följd av "Fakturaöversikt".')}}
            </div>
        </div>
    </div>
</div>



<div class="panel panel-default" ng-if="!invoices.signups.length">

    <div class="panel-heading">{{_('Generera fakturor')}}</div>
    <div class="panel-body">
        {{_('Det finns inga fakturor att generera.')}}
        <hr>
        <button ui-sref="invoices.index" class="btn btn-primary">{{_('Fakturaöversikt')}}</button>
    </div>
</div>