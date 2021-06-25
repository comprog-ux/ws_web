<div class="panel panel-default"
     ng-form name="signupForm"
     ng-repeat="(key, signup) in results.signups"
     ng-class="{'panel-danger': !signupForm.$valid, 'panel-primary': (signup.user && signupForm.$valid)}"
     ng-if="signup.user || (!signup.user && results.filter.show_empty_lanes)">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">
                <% competitions.competition.translations.patrols_lane_singular | ucfirst %> <% key %>
            </div>
            <div class="col-sm-6 text-right">
                <span ng-if="signup.user"><% signup.user.fullname %>, <% signup.club.name %>, <% (competitions.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %></span>
                <span ng-if="!signup.user">-</span>
            </div>
        </div>
    </div>

    <table class="table-bordered table-condensed" ng-if="signup.user">
        <thead>
        <tr>
            <th width="150px">
                <% competitions.competition.translations.stations_name_singular | ucfirst %>
            </th>
            <th width="60px" class="text-center" ng-repeat="station in results.stations">
                <% station.sortorder %>
            </th>
            <th width="60px" class="text-center">{{_('Tot')}}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
        <tr ng-if="results.filter.per_shot">
            <td>
                <% competitions.competition.translations.patrols_lane_plural | ucfirst %>
            </td>
            <td valign="top" ng-repeat="station in results.stations">
                <input
                    tabindex="<% key | padZero:3 %><% station.sortorder | padZero:3 %>"
                    class="form-control input-sm text-center"
                    ng-class="{'margin-top-5': $index>0}"
                    type="number"
                    max="50"
                    ng-model="(signup.results | where:{stations_id:station.sortorder} | first).station_figure_hits[n]"
                    ng-repeat="n in [] | range:0:station.figures"
                    ng-readonly="results.editingSignup.id !== signup.id"
                    ng-disabled="results.editingSignup.id !== signup.id"
                    ng-enter="results.save(signup);">
            </td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>
                {{_('Träffar')}}
            </td>
            <td valign="top" ng-repeat="station in results.stations">
                <input
                    type="number"
                    max="<% station.shots %>"
                    ng-max="station.shots"
                    min="<% (signup.results | where:{stations_id:station.sortorder} | first).figure_hits %>"
                    tabindex="<% key | padZero:3 %><% station.sortorder | padZero:3 %>"
                    class="form-control input-sm text-center input-sm text-right"
                    ng-model="(signup.results | where:{stations_id:station.sortorder} | first).hits"
                    ng-if="signup.results.length"
                    ng-readonly="results.editingSignup.id !== signup.id"
                    ng-disabled="results.editingSignup.id !== signup.id"
                    ng-enter="results.save(signup);">
            </td>
            <td>
                <input type="number" class="form-control input-sm text-center" disabled ng-value="signup.results | sumByKey:'hits'">
            </td>
            <td></td>
        </tr>
        <tr>
            <td class="nowrap">
                {{_('Träffade figurer')}}
            </td>
            <td valign="top" ng-repeat="station in results.stations">
                <input
                    type="number"
                    max="<% station.figures %>"
                    min="<% ((signup.results | where:{stations_id:station.sortorder} | first).hits) ? 1 : 0 %>"
                    tabindex="<% key | padZero:3 %><% station.sortorder | padZero:3 %>"
                    class="form-control input-sm text-center input-sm text-right"
                    ng-if="signup.results.length"
                    ng-model="(signup.results | where:{stations_id:station.sortorder} | first).figure_hits"
                    ng-readonly="results.editingSignup.id !== signup.id"
                    ng-disabled="results.editingSignup.id !== signup.id"
                    ng-enter="results.save(signup);">
            </td>
            <td>
                <input type="number" class="form-control input-sm text-center" disabled ng-value="signup.results | sumByKey:'figure_hits'">
            </td>
            <td></td>
        </tr>
        <tr>
            <td>
                {{_('Poäng')}}
            </td>
            <td valign="top" ng-repeat="station in results.stations">
                <input
                    type="number"
                    min="0"
                    max="50"
                    tabindex="<% key | padZero:3 %><% station.sortorder | padZero:3 %>"
                    class="form-control input-sm text-center input-sm text-right"
                    ng-model="(signup.results | where:{stations_id:station.sortorder} | first).points"
                    ng-readonly="results.editingSignup.id !== signup.id"
                    ng-disabled="results.editingSignup.id !== signup.id"
                    ng-if="station.points"
                    ng-enter="results.save(signup);">
            </td>
            <td>
                <input type="number" class="form-control input-sm text-center" disabled ng-value="signup.results | sumByKey:'points'">
            </td>
            <td></td>
        </tr>
        </tbody>
    </table>

    <hr class="margin-0">

    <div class="panel-body" ng-if="results.editingSignup.id === signup.id">
        <button ng-click="results.save(signup, true);"
                class="btn btn-sm btn-primary margin-right-10"
                ng-class="{'btn-danger': !signupForm.$valid}">{{_('Spara')}}</button>
        <button class="btn btn-sm btn-link" ng-click="results.stopEditing(signup)">Avbryt</button>
        <span uib-alert dismiss-on-timeout="250" close="results.closeAlert(signup)" ng-if="!signupForm.$valid" template-url="alert-danger.html">{{_('Formuläret innehåller fel')}}</span>
        <span uib-alert dismiss-on-timeout="250" close="results.closeAlert(signup)" ng-if="signup.alert" template-url="alert.html"><% signup.alert %></span>
        <span close="results.closeError(signup)" ng-if="signup.error" template-url="alert.html"><% signup.error %></span>
    </div>
    <div class="panel-body" ng-if="results.editingSignup.id !== signup.id">
        <button class="btn btn-sm btn-primary margin-right-10" ng-click="results.startEditing(signup)">{{_('Redigera')}}</button>
    </div>

    <div class="panel-body" ng-if="!signup.user">{{_('Användare saknas')}}</div>
</div>

<script type="text/ng-template" id="alert.html">
    <span class="text-success" ng-transclude></span>
</script>
<script type="text/ng-template" id="alert-danger.html">
    <span class="text-danger" ng-transclude></span>
</script>

