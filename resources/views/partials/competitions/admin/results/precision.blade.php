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
            <th width="150px"></th>
            <th width="60px" class="text-center" ng-if="results.filter.per_shot">1</th>
            <th width="60px" class="text-center" ng-if="results.filter.per_shot">2</th>
            <th width="60px" class="text-center" ng-if="results.filter.per_shot">3</th>
            <th width="60px" class="text-center" ng-if="results.filter.per_shot">4</th>
            <th width="60px" class="text-center" ng-if="results.filter.per_shot">5</th>
            <th width="60px" class="text-center">Tot</th>
            <th width="60px" class="text-center">X</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
        <tr ng-repeat="station in results.stations">
            <td class="nowrap"><% competitions.competition.translations.stations_name_singular | ucfirst %> <% station.sortorder %></td>
            <td ng-if="results.filter.per_shot">
                <input type="number"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).station_figure_hits[0]"
                       ng-enter="results.save(signup);">
            </td>
            <td ng-if="results.filter.per_shot">
                <input type="number"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).station_figure_hits[1]"
                       ng-enter="results.save(signup);">
            </td>
            <td ng-if="results.filter.per_shot">
                <input type="number"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).station_figure_hits[2]"
                       ng-enter="results.save(signup);">
            </td>
            <td ng-if="results.filter.per_shot">
                <input type="number"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).station_figure_hits[3]"
                       ng-enter="results.save(signup);">
            </td>
            <td ng-if="results.filter.per_shot">
                <input type="number"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).station_figure_hits[4]"
                       ng-enter="results.save(signup);">
            </td>
            <td>
                <input type="number"
                       ng-min="1"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).points"
                       ng-enter="results.save(signup);">
            </td>
            <td>
                <input type="number"
                       max="50"
                       class="form-control input-sm text-center"
                       ng-readonly="results.editingSignup.id !== signup.id"
                       ng-disabled="results.editingSignup.id !== signup.id"
                       ng-model="(signup.results | where:{stations_id:station.sortorder} | first).hits"
                       ng-enter="results.save(signup);">
            </td>
            <td></td>
        </tr>
        </tbody>
    </table>

    <hr class="margin-0">

    <div class="panel-body" ng-if="signup.user && results.editingSignup.id === signup.id">
        <button ng-click="results.save(signup, true);" class="btn btn-sm btn-primary margin-right-10">{{_('Spara')}}</button>
        <button class="btn btn-sm btn-link" ng-click="results.stopEditing(signup)">Avbryt</button>
        <span uib-alert dismiss-on-timeout="250" close="results.closeAlert(signup)" ng-if="signup.alert" template-url="alert.html"><% signup.alert %></span>
        <span close="results.closeError(signup)" ng-if="signup.error" template-url="alert.html"><% signup.error %></span>
    </div>
    <div class="panel-body" ng-if="signup.user && results.editingSignup.id !== signup.id">
        <button class="btn btn-sm btn-primary margin-right-10" ng-click="results.startEditing(signup)">{{_('Redigera')}}</button>
    </div>

    <div class="panel-body" ng-if="!signup.user">{{_('Användare saknas')}}</div>
</div>

<script type="text/ng-template" id="alert.html">
    <span class="text-success" ng-transclude></span>
</script>
