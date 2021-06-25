<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-xs-9">{{_('Anmälningar')}}</div>
            <div class="col-xs-3 text-right"><% clubs.club.signups.length %></div>
        </div>
    </div>

    <div class="row hide" ng-class="{'show': clubs.club.signups.length}">
        <div class="col-sm-12">
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                    <tr>
                        <th>{{_('ID')}}</th>
                        <th>{{_('Datum')}}</th>
                        <th>{{_('Tävling')}}</th>
                        <th>{{_('Användare')}}</th>
                        <th>{{_('Faktura')}}</th>
                        <th>{{_('Önskemål')}}</th>
                        <th>{{_('Kommentar')}}</th>
                        <th class="text-right">{{_('Vapengrupp')}}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr ng-repeat="signup in clubs.club.signups">
                        <td><% signup.id %></td>
                        <td class="nowrap"><% signup.competition.date %></td>
                        <td><% signup.competition.name %></td>
                        <td><a ui-sref="admin.users.show({user_id:signup.user.user_id})"><% signup.user.fullname %> (<% signup.user.shooting_card_number %>)</a></td>
                        <td><a ui-sref="admin.invoices.show({id:signup.invoices_id})"><% signup.invoice.invoice_reference %></a></td>
                        <td>
                            <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" class="label label-primary" ng-if="signup.special_wishes">{{_('Önskemål')}}</span>
                            <span ng-if="!signup.special_wishes">-</span>
                        </td>
                        <td>
                            <span uib-tooltip-html="signup.note | renderHTMLCorrectly" class="label label-primary" ng-if="signup.note">{{_('Kommentar')}}</span>
                            <span ng-if="!signup.note">-</span>
                        </td>
                        <td class="text-right">
                            <span class="label label-default margin-right-5"><% signup.weaponclass.classname %></span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>