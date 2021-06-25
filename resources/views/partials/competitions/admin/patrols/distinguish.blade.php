<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-default">
            <div class="panel-heading"><% competitions.competition.translations.patrols_name_plural | ucfirst %> | {{_('Särskjutning')}}</div>
            <div class="panel-body">
                <button ng-click="patrols.generatePatrols();" class="btn btn-primary">{{_('Generera')}}</button>
            </div>
        </div>
    </div>
</div>
<div class="row" ng-if="patrols.patrols.length">
    <div class="col-sm-12">

        <div class="panel panel-default">
            <div class="panel-heading"><% competitions.competition.translations.patrols_name_plural | ucfirst %></div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-2">
                        <select ng-model="patrols_filter_weaponclass" ng-options="weaponclass.id as (competitions.competition.championships_id) ? weaponclass.classname_general : weaponclass.classname for weaponclass in competitions.competition.weaponclasses" class="form-control">
                            <option value="">{{_('Vapengrupp')}}</option>
                        </select>
                    </div>
                    <div class="col-sm-4 col-sm-offset-6">
                        <div class="input-group">
                            <input type="text" ng-model="patrols_filter_search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
                            <span class="input-group-addon"><i class="fa fa-search"></i></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel panel-default" ng-repeat="patrol in patrols.patrols | filter:{signups:{weaponclasses_id: patrols_filter_weaponclass}} | filter: patrols_filter_search">
            <div class="panel-heading">
                <div class="row">
                    <div class="col-sm-6">
                        <% competitions.competition.translations.patrols_name_singular | ucfirst %>: <% patrol.sortorder %><br>
                        {{_('Tid (ca)')}}: <% patrol.start_time | dateToISO | date:'HH:mm' %>-<% patrol.end_time | dateToISO | date:'HH:mm' %>
                    </div>
                    <div class="col-sm-6 text-right">
                        <% patrol.signups.length %> {{_('st')}}<br>
                        {{_('Vapengrupp')}}: <span ng-repeat="weaponclass in patrol.signups | unique:'weaponclasses_id'"><% (competitions.competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></span>
                    </div>
                </div>
            </div>
            <ul class="list-group">
                <li class="list-group-item" ng-repeat="signup in patrol.signups | filter: patrols_filter_search | orderBy:'lane_distinguish'">
                    <div class="row">
                        <div class="col-sm-1"><% signup.lane_distinguish %></div>
                        <div class="col-sm-4"><% signup.user.fullname %></div>
                        <div class="col-sm-5"><% signup.club.name %></div>
                        <div class="col-sm-2 text-right"><% (competitions.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %></div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</div>

