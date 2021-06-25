<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Anmälningar')}}</div>
            <div class="col-sm-6 text-right">{{_('Antal')}}: <% competitions.competitions.signups.length %></div>
        </div>
    </div>

    <div class="panel-body">
        <div class="row">
            <div class="col-sm-2">
                <select ng-model="signups_filter_weaponclass" ng-options="weapongroup.id as weapongroup.name for weapongroup in competitions.competitions.weapongroups" class="form-control">
                    <option value="">{{_('Vapengrupp')}}</option>
                </select>
            </div>
            <div class="col-sm-4 col-sm-offset-6">
                <div class="input-group">
                    <input type="text" ng-model="signups_filter" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
                    <span class="input-group-addon"><i class="fa fa-search"></i></span>
                </div>
            </div>
        </div>
    </div>

    <table class="table table-striped">
        <thead>
        <tr>
            <th>{{_('Namn')}}</th>
            <th>{{_('Förening')}}</th>
            <th class="text-right">{{_('Vapengrupp')}}</th>
        </tr>
        </thead>
        <tbody>
        <tr ng-repeat="signup in competitions.competitions.signups | filter:{weaponclass:{weapongroups_id: signups_filter_weaponclass}} | filter: signups_filter">
            <td><% signup.user.fullname %></td>
            <td><% signup.club.name %></td>
            <td class="text-right">
                <span ng-repeat="weaponclass in competitions.competitions.weaponclasses | filter:{id: signup.weaponclasses_id}: true" class="label label-default margin-right-5"><% (competitions.competitions.championship) ? weaponclass.classname_general : weaponclass.classname %></span>
            </td>
        </tr>
        </tbody>
    </table>
</div>