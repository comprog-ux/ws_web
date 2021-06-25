<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-xs-9">{{_('Laganmälan')}}</div>
            <div class="col-xs-3 text-right"><% clubs.club.teams.length %></div>
        </div>
    </div>

    <div class="row hide" ng-class="{'show': clubs.club.teams.length}">
        <div class="col-sm-12">
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                    <tr>
                        <th>{{_('Datum')}}</th>
                        <th>{{_('Tävling')}}</th>
                        <th>{{_('Användare')}}</th>
                        <th>{{_('Faktura')}}</th>
                        <th class="text-right">{{_('Vapengrupp')}}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr ng-repeat="team in clubs.club.teams">
                        <td><% team.competition.date %></td>
                        <td><% team.competition.name %></td>
                        <td>
                            <div ng-repeat="signup in team.signups">
                                <a ui-sref="admin.users.show({user_id:signup.user.user_id})">#<% signup.pivot.position %> <% signup.user.fullname %> (<% signup.weaponclass.classname %>)</a>
                            </div>
                        </td>
                        <td><a ui-sref="admin.invoices.show({id:team.invoices_id})"><% team.invoice.invoice_reference %></a></td>
                        <td class="text-right">
                            <span class="label label-default margin-right-5"><% team.weapongroup.name %></span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>