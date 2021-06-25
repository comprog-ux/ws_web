<div class="panel panel-default">
    <div class="panel-heading">{{_('Lag')}}</div>
    <div class="panel-body">
        <div class="row">
            <div class="col-sm-2">
                <select ng-model="teams_filter_weaponclass" ng-options="weapongroup.id as weapongroup.name for weapongroup in competitions.competitions.weapongroups" class="form-control">
                    <option value="">{{_('Vapengrupp')}}</option>
                </select>
            </div>
            <div class="col-sm-4 col-sm-offset-6">
                <div class="input-group">
                    <input type="text" ng-model="teams_filter_search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
                    <span class="input-group-addon"><i class="fa fa-search"></i></span>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="panel panel-default" ng-repeat="team in competitions.competitions.teams | filter:{weapongroups_id: teams_filter_weaponclass} | filter: teams_filter_search">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-7">
                {{_('Förening')}}: <b><% team.club.name %></b><br>
                {{_('Lagnamn')}}: <b><% team.name %></b>
            </div>
            <div class="col-sm-5 text-right">{{_('Vapengrupp')}}: <b><% team.weapongroup.name %></b></div>
        </div>
    </div>

    <ul class="list-group" ng-if="team.signups.length">
        <li class="list-group-item" ng-repeat="signup in team.signups | orderBy:pivot.position">
            <b><span ng-switch="signup.pivot.position">
                <span ng-switch-when="1">{{_('Första skytt')}}: </span>
                <span ng-switch-when="2">{{_('Andra skytt')}}: </span>
                <span ng-switch-when="3">{{_('Tredje skytt')}}: </span>
                <span ng-switch-when="4">{{_('Första reserv')}}: </span>
                <span ng-switch-when="5">{{_('Andra reserv')}}: </span>
            </span></b>
            <% signup.user.fullname %>
        </li>
    </ul>
</div>