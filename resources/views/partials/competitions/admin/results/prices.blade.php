<div class="panel panel-default">
    <div class="panel-heading">{{_('Resultat')}}</div>
    
    <div class="panel-body" ng-if="!prices.results.length">
        {{_('Än så länge finns det inte något resultat att presentera för denna tävling.')}}
    </div>

    <div ng-if="prices.results.length">
        <div ng-repeat="(weaponclasses_id, results) in prices.results | groupBy: 'weaponclasses_id'">
            <table class="table table-striped table-condensed" ng-if="competitions.competition.results_type == 'military'" ng-include="'ResultMilitaryTemplate'"></table>
            <table class="table table-striped table-condensed" ng-if="competitions.competition.results_type == 'precision'" ng-include="'ResultPrecisionTemplate'"></table>
            <table class="table table-striped table-condensed" ng-if="competitions.competition.results_type == 'field'" ng-include="'ResultFieldTemplate'"></table>
            <table class="table table-striped table-condensed" ng-if="competitions.competition.results_type == 'magnum'" ng-include="'ResultFieldTemplate'"></table>
            <table class="table table-striped table-condensed" ng-if="competitions.competition.results_type == 'pointfield'" ng-include="'ResultPointfieldTemplate'"></table>
        </div>
    </div>

</div>

<script type="text/ng-template" id="ResultMilitaryTemplate">
    <thead>
    <tr>
        <th>{{_('Placering')}}</th>
        <th>{{_('Namn')}}</th>
        <th>{{_('Förening')}}</th>
        <th class="text-right">{{_('Vapengrupp')}}</th>
        <th class="text-right">{{_('Poäng')}}</th>
        <th class="text-right">{{_('X')}}</th>
        <th class="text-center">{{_('SK')}}</th>
        <th class="text-right">{{_('M')}}</th>
        <th>{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        id="signup_<% result.signup.id %>">
        <td width="30px"><input type="text" ng-model="result.placement" class="form-control" ng-enter="prices.savePrice(result)" ng-blur="prices.savePrice(result)" ng-readonly="result.updating"></td>
        <td width="25%"><% result.username %></td>
        <td width="25%"><% result.clubsname %></td>
        <td width="50px" class="text-right"><% (competitions.competition.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-right"><% result.hits %></td>
        <td width="50px" class="text-center"><% result.results_distinguish | sumByKey:'points' %></td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td>
            <div class="input-group input-group-sm">
                <input type="text"
                       tabindex="<% weaponclasses_id | padZero:3 %>_<% $index | padZero:3 %>"
                       ng-model="result.price"
                       ng-enter="prices.savePrice(result)"
                       ng-blur="prices.savePrice(result)"
                       class="form-control"
                       placeholder="Ange ev. pris">
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" ng-click="prices.savePrice(result)"><i class="fa fa-save"></i></button>
                </span>
            </div>
        </td>
    </tr>
    </tbody>
</script>

<script type="text/ng-template" id="ResultPrecisionTemplate">
    <thead>
    <tr>
        <th>{{_('Placering')}}</th>
        <th>{{_('Namn')}}</th>
        <th>{{_('Förening')}}</th>
        <th class="text-right">{{_('Vapengrupp')}}</th>
        <th class="text-right">{{_('Poäng')}}</th>
        <th class="text-center">{{_('Final')}}</th>
        <th class="text-center">{{_('SK')}}</th>
        <th class="text-right">{{_('M')}}</th>
        <th>{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        id="signup_<% result.signup.id %>">
        <td width="30px"><input type="text" ng-model="result.placement" class="form-control" ng-enter="prices.savePrice(result)" ng-blur="prices.savePrice(result)" ng-readonly="result.updating"></td>
        <td width="25%"><% result.username %></td>
        <td width="25%"><% result.clubsname %></td>
        <td width="50px" class="text-right"><% (competitions.competition.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-center"><span ng-if="(result.results_finals | sumByKey:'points') != '0'"><% result.results_finals | sumByKey:'points' %></span></td>
        <td width="50px" class="text-center"><span ng-if="(result.results_distinguish | sumByKey:'points') != '0'"><% result.results_distinguish | sumByKey:'points' %></span></td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td>
            <div class="input-group input-group-sm">
                <input type="text"
                       tabindex="<% weaponclasses_id | padZero:3 %>_<% $index | padZero:3 %>"
                       ng-model="result.price"
                       ng-enter="prices.savePrice(result)"
                       ng-blur="prices.savePrice(result)"
                       class="form-control"
                       placeholder="Ange ev. pris">
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" ng-click="prices.savePrice(result)"><i class="fa fa-save"></i></button>
                </span>
            </div>
        </td>
    </tr>
    </tbody>
</script>

<script type="text/ng-template" id="ResultFieldTemplate">
    <thead>
    <tr>
        <th>{{_('Placering')}}</th>
        <th>{{_('Namn')}}</th>
        <th>{{_('Förening')}}</th>
        <th class="text-right">{{_('Vapengrupp')}}</th>
        <th class="text-right">{{_('T / F')}}</th>
        <th class="text-right">{{_('Poäng')}}</th>
        <th class="text-center">{{_('SK')}}</th>
        <th class="text-right">{{_('M')}}</th>
        <th>{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        id="signup_<% result.signup.id %>">
        <td width="30px"><input type="text" ng-model="result.placement" class="form-control" ng-enter="prices.savePrice(result)" ng-blur="prices.savePrice(result)" ng-readonly="result.updating"></td>
        <td width="25%"><% result.username %></td>
        <td width="25%"><% result.clubsname %></td>
        <td width="50px" class="text-right"><% (competitions.competition.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.hits %>/<% result.figure_hits %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-center">
            <span ng-if="result.results_distinguish | sumByKey:'hits'"><% result.results_distinguish | sumByKey:'hits' %>/<% result.results_distinguish | sumByKey:'figure_hits' %></span>
        </td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td>
            <div class="input-group input-group-sm">
                <input type="text"
                       tabindex="<% weaponclasses_id | padZero:3 %>_<% $index | padZero:3 %>"
                       ng-model="result.price"
                       ng-enter="prices.savePrice(result)"
                       ng-blur="prices.savePrice(result)"
                       class="form-control"
                       placeholder="Ange ev. pris"
                       ng-readonly="result.updating">
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" ng-click="prices.savePrice(result)"><i class="fa fa-save"></i></button>
                </span>
            </div>
        </td>
    </tr>
    </tbody>
</script>

<script type="text/ng-template" id="ResultPointfieldTemplate">
    <thead>
    <tr>
        <th>{{_('Placering')}}</th>
        <th>{{_('Namn')}}</th>
        <th>{{_('Förening')}}</th>
        <th class="text-right">{{_('Vapengrupp')}}</th>
        <th class="text-right">{{_('T / F')}}</th>
        <th class="text-right">{{_('Tot')}}</th>
        <th class="text-right">{{_('Poäng')}}</th>
        <th class="text-center">{{_('SK')}}</th>
        <th class="text-right">{{_('M')}}</th>
        <th>{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        id="signup_<% result.signup.id %>">
        <td width="30px"><input type="text" ng-model="result.placement" class="form-control" ng-enter="prices.savePrice(result)" ng-blur="prices.savePrice(result)" ng-readonly="result.updating"></td>
        <td width="25%"><% result.username %></td>
        <td width="25%"><% result.clubsname %></td>
        <td width="50px" class="text-right"><% (competitions.competition.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.hits %>/<% result.figure_hits %></td>
        <td width="50px" class="text-right"><% result.hits + result.figure_hits %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-center">
            <span ng-if="result.results_distinguish | sumByKey:'hits'"><% result.results_distinguish | sumByKey:'hits' %>/<% result.results_distinguish | sumByKey:'figure_hits' %></span>
        </td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td>
            <div class="input-group input-group-sm">
                <input type="text"
                       tabindex="<% weaponclasses_id | padZero:3 %>_<% $index | padZero:3 %>"
                       ng-model="result.price"
                       ng-enter="prices.savePrice(result)"
                       ng-blur="prices.savePrice(result)"
                       class="form-control"
                       placeholder="Ange ev. pris">
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" ng-click="prices.savePrice(result)"><i class="fa fa-save"></i></button>
                </span>
            </div>
        </td>
    </tr>
    </tbody>
</script>

