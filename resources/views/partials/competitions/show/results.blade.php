<div class="panel panel-default">
    <div class="panel-heading">{{_('Resultat')}}</div>

    <div class="panel-body" ng-if="!competitions.competitions.results_is_public && !competitions.competitions.user_roles.length">
        {{_('Än så länge finns det inte något resultat att presentera för denna tävling.')}}
    </div>

    <div ng-if="competitions.competitions.results_is_public || competitions.competitions.user_roles.length">
        <div class="panel-navigation text-right">
            <button class="btn btn-default" ng-click="results.downloadResultsList(competitions.competitions)"><i class="fa fa-download"></i> Ladda ner resultatlistan som pdf</button>
        </div>
        <div ng-repeat="(weaponclasses_id, results) in results.results | groupBy: 'weaponclasses_id'">
            <table class="table table-striped table-condensed" ng-include="(competitions.competitions.results_type == 'military') ? 'ResultMilitaryTemplate' : null"></table>
            <table class="table table-striped table-condensed" ng-include="(competitions.competitions.results_type == 'precision') ? 'ResultPrecisionTemplate' : null"></table>
            <table class="table table-striped table-condensed" ng-include="(competitions.competitions.results_type == 'field') ? 'ResultFieldTemplate' : null"></table>
            <table class="table table-striped table-condensed" ng-include="(competitions.competitions.results_type == 'magnum') ? 'ResultFieldTemplate' : null"></table>
            <table class="table table-striped table-condensed" ng-include="(competitions.competitions.results_type == 'pointfield') ? 'ResultPointfieldTemplate' : null"></table>
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
        <th class="text-right" ng-if="competitions.competitions.results_prices">{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        ng-class="{'success text-bold': result.signup.user.user_id == '{{\Auth::user()->user_id}}'}"
        id="signup_<% result.signup.id %>">
        <td width="30px"><% result.placement %></td>
        <td width="25%"><% result.signup.user.fullname %></td>
        <td width="25%"><% result.signup.club.name %></td>
        <td width="50px" class="text-right"><% (competitions.competitions.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-right"><% result.hits %></td>
        <td width="50px" class="text-center"><% result.results_distinguish | sumByKey:'points' %></td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td width="50px" class="text-right" ng-if="competitions.competitions.results_prices"><% result.price %></td>
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
        <th class="text-right" ng-if="competitions.competitions.results_prices">{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        ng-class="{'success text-bold': result.signup.user.user_id == '{{\Auth::user()->user_id}}'}"
        id="signup_<% result.signup.id %>">
        <td width="30px"><% result.placement %></td>
        <td width="25%"><% result.signup.user.fullname %></td>
        <td width="25%"><% result.signup.club.name %></td>
        <td width="50px" class="text-right"><% (competitions.competitions.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-center"><span ng-if="(result.results_finals | sumByKey:'points') != '0'"><% result.results_finals | sumByKey:'points' %></span></td>
        <td width="50px" class="text-center"><span ng-if="(result.results_distinguish | sumByKey:'points') != '0'"><% result.results_distinguish | sumByKey:'points' %></span></td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td width="50px" class="text-right" ng-if="competitions.competitions.results_prices"><% result.price %></td>
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
        <th class="text-right" ng-if="competitions.competitions.results_prices">{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        ng-class="{'success text-bold': result.signup.user.user_id == '{{\Auth::user()->user_id}}'}"
        id="signup_<% result.signup.id %>">
        <td width="30px"><% result.placement %></td>
        <td width="25%"><% result.signup.user.fullname %></td>
        <td width="25%"><% result.signup.club.name %></td>
        <td width="50px" class="text-right"><% (competitions.competitions.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.hits %>/<% result.figure_hits %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-center">
            <span ng-if="result.results_distinguish | sumByKey:'hits'"><% result.results_distinguish | sumByKey:'hits' %>/<% result.results_distinguish | sumByKey:'figure_hits' %></span>
        </td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td width="50px" class="text-right" ng-if="competitions.competitions.results_prices"><% result.price %></td>
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
        <th class="text-right" ng-if="competitions.competitions.results_prices">{{_('Pris')}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in results | orderBy:['!placement','placement']"
        ng-class="{'success text-bold': result.signup.user.user_id == '{{\Auth::user()->user_id}}'}"
        id="signup_<% result.signup.id %>">
        <td width="30px"><% result.placement %></td>
        <td width="25%"><% result.signup.user.fullname %></td>
        <td width="25%"><% result.signup.club.name %></td>
        <td width="50px" class="text-right"><% (competitions.competitions.championship) ? result.weaponclass.classname_general : result.weaponclass.classname %></td>
        <td width="50px" class="text-right"><% result.hits %>/<% result.figure_hits %></td>
        <td width="50px" class="text-right"><% result.hits + result.figure_hits %></td>
        <td width="50px" class="text-right"><% result.points %></td>
        <td width="50px" class="text-center">
            <span ng-if="result.results_distinguish | sumByKey:'hits'"><% result.results_distinguish | sumByKey:'hits' %>/<% result.results_distinguish | sumByKey:'figure_hits' %></span>
        </td>
        <td width="50px" class="text-right"><% result.std_medal %></td>
        <td width="50px" class="text-right" ng-if="competitions.competitions.results_prices"><% result.price %></td>
    </tr>
    </tbody>
</script>

