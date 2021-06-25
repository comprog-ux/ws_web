<ui-view>
    <div class="panel panel-default">
        <div class="panel-heading">{{_('Laganmälan')}}</div>
        <div class="panel-body">
            <div class="hide" ng-class="{'show': (!(teamsignups | isEmpty) && (!teamsignups.signups_reserve_available.length && !teamsignups.signups_ordinary_available.length) && !teamsignups.teams.length)}">{{_('Din förening saknar anmälningar som krävs för att skapa laganmälan')}}</div>
            <div class="hide" ng-class="{'show': (!(teamsignups | isEmpty) && (!teamsignups.signups_reserve_available.length && !teamsignups.signups_ordinary_available.length) && teamsignups.teams.length)}">{{_('Din förening behöver fler anmälningar för att skapa fler lag.')}}</div>
            <div class="row hide" ng-class="{'show': (teamsignups | isEmpty)}">
                <div class="col-sm-12">
                    <p>{{_('Endast användare med administratörsbehörighet för din förening kan göra laganmälan.')}}</p>
                    <button class="btn btn-primary" ui-sref="club.admins">{{_('Hantera administratörer')}}</button>
                </div>
            </div>
            <button ui-sref="competition.teamsignups.create({id:competitions.competitions.id})" class="btn btn-primary margin-bottom-20" ng-if="(teamsignups.signups_reserve_available.length || teamsignups.signups_ordinary_available.length)">{{_('Skapa ett nytt lag')}}</button>
        </div>
    </div>

    <div class="panel panel-default" ng-repeat="team in teamsignups.teams">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Lagnamn')}}: <b><% team.name %></b></div>
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
                <button class="btn btn-default" ui-sref="competition.teamsignups.edit({id:competitions.competitions.id, teams_id: team.id})">{{_('Ändra')}}</button>
            </div>
            <div class="col-sm-6 text-right" ng-if="!team.invoices_id">
                <a href="" class="text-danger" ng-click="teamsignups.deleteTeam(team.id)">{{_('Radera lag')}}</a>
            </div>
        </div>
    </div>
</div>
</ui-view>