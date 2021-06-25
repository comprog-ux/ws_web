<ui-view>
    <div class="panel panel-default">
        <div class="panel-heading">{{_('Laganmälan')}}</div>
        <div class="panel-body">
            <button ui-sref="competitions.admin.teamsignups.create({id:competitions.competitions.id})" class="btn btn-primary">{{_('Skapa ett nytt lag')}}</button>
        </div>
    </div>

    <div class="panel panel-default" ng-repeat="team in signups.teams">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Förening')}}: <b><% team.club.name %>, </b>{{_('Lagnamn')}}: <b><% team.name %></b></div>
            <div class="col-sm-6 text-right">{{_('Vapengrupp')}}: <b><% team.weapongroup.name %></b></div>
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

    <div class="panel-body">
        <p class="alert alert-danger" ng-if="!team.signups.length">{{_('Detta lag har ej några anmälda användare.')}}</p>
        <div class="row">
            <div class="col-sm-6">
                <button class="btn btn-default" ui-sref="competitions.admin.teamsignups.edit({id:competitions.competitions.id, teams_id: team.id})">{{_('Ändra')}}</button>
            </div>
            <div class="col-sm-6 text-right" ng-if="!team.invoices_id">
                <a href="" class="text-danger" ng-click="signups.deleteTeam(team.id)">{{_('Radera lag')}}</a>
            </div>
        </div>
    </div>
</div>
</ui-view>