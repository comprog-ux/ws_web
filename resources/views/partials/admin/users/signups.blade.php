<div class="panel panel-default">
    <div class="panel-heading">
        {{_('Anmälningar')}}
    </div>

    <div class="row hide" ng-class="{'show': user.user.signups.length}">
        <div class="col-sm-12">
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                    <tr>
                        <th>{{_('ID')}}</th>
                        <th>{{_('Datum')}}</th>
                        <th>{{_('Tävling')}}</th>
                        <th>{{_('Avgift')}}</th>
                        <th>{{_('Vapengrupp')}}</th>
                        <th>{{_('Anteckning')}}</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr ng-repeat="signup in user.user.signups">
                        <td class="text-nowrap"><% signup.id %></td>
                        <td class="text-nowrap"><% signup.competition.date %></td>
                        <td><% signup.competition.name %></td>
                        <td><% signup.registration_fee %></td>
                        <td><% signup.weaponclass.classname %></td>
                        <td><i class="fa fa-comment-o" ng-show="signup.note"></i></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>