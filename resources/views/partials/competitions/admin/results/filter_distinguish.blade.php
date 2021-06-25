<div class="row">
    <div class="col-sm-3">
        <div class="panel panel-default">
            <div class="panel-heading">{{_('Inmatning')}}</div>
            <table class="table table-bordered">
                <tbody>
                <tr>
                    <td>{{_('Datum')}}</td>
                    <td><% competitions.competition.date %></td>
                </tr>
                <tr>
                    <td>{{_('Tävlingsgrupp')}}</td>
                    <td><% (competitions.competition.championship.name) ? competitions.competition.championship.name : '-' %></td>
                </tr>
                <tr ng-if="competitions.competitions.competitiontype">
                    <td>{{_('Tävlingstyp')}}</td>
                    <td><% competitions.competitions.competitiontype.name %></td>
                </tr>
                </tbody>
            </table>
            <div class="panel-body">
                <div class="row form-group">
                    <div class="col-lg-12">
                        <label><% competitions.competition.translations.patrols_name_singular | ucfirst %></label>
                        <select class="form-control" ng-options="patrol.sortorder as (patrol.sortorder+ ' ('+patrol.start_time_human+')') for patrol in results.patrols" ng-model="results.filter.patrol">
                            <option value=""><% competitions.competition.translations.patrols_name_singular | ucfirst %></option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-lg-6">
                        <label><% competitions.competition.translations.stations_name_singular | ucfirst %> ({{_('från')}})</label>
                        <select class="form-control" ng-options="n for n in [] | range:1:competitions.competition.stations_count+1" ng-model="results.filter.station_start">
                            <option value=""><% competitions.competition.translations.stations_name_singular | ucfirst %></option>
                        </select>
                    </div>
                    <div class="col-lg-6">
                        <label><% competitions.competition.translations.stations_name_singular | ucfirst %> ({{_('till')}})</label>
                        <select class="form-control" ng-options="n for n in [] | range:1:competitions.competition.stations_count+1" ng-model="results.filter.station_end">
                            <option value=""><% competitions.competition.translations.stations_name_singular | ucfirst %></option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-lg-6">
                        <label><% competitions.competition.translations.patrols_lane_singular | ucfirst %> ({{_('från')}})</label>
                        <select class="form-control" ng-options="n for n in [] | range:1:competitions.competition.patrol_size+1" ng-model="results.filter.lane_start">
                            <option value=""><% competitions.competition.translations.patrols_lane_singular | ucfirst %></option>
                        </select>
                    </div>
                    <div class="col-lg-6">
                        <label><% competitions.competition.translations.patrols_lane_singular | ucfirst %> ({{_('till')}})</label>
                        <select class="form-control" ng-options="n for n in [] | range:1:competitions.competition.patrol_size+1" ng-model="results.filter.lane_end">
                            <option value=""><% competitions.competition.translations.patrols_lane_singular | ucfirst %></option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-lg-12">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" ng-model="results.filter.per_shot" ng-true-value="1" ng-false-value="0"> {{_('Registrera alla skott')}}
                            </label>
                        </div>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-lg-12">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" ng-model="results.filter.show_empty_lanes" ng-true-value="1" ng-false-value="0"> {{_('Visa tomma %s', '<% competitions.competition.translations.patrols_lane_plural %>')}}
                            </label>
                        </div>
                    </div>
                </div>
                <a class="btn btn-primary" ui-sref-opts="{reload: true}" ui-sref="competitions.admin.results.distinguish({competitions_id: competitions.competition.id, patrol:results.filter.patrol, patrol_type:results.filter.patrol_type, station_start: results.filter.station_start, station_end: results.filter.station_end, lane_start:results.filter.lane_start, lane_end:results.filter.lane_end, show_empty_lanes:results.filter.show_empty_lanes, per_shot:results.filter.per_shot})">{{_('Visa')}}</a>
            </div>
        </div>
    </div>

    <div class="col-sm-9">
        <div ng-if="results.signups">
            <div ui-view="military" ng-if="competitions.competition.results_type == 'military'"></div>
            <div ui-view="field" ng-if="competitions.competition.results_type == 'field' || competitions.competition.results_type == 'pointfield' || competitions.competition.results_type == 'magnum'"></div>
            <div ui-view="precision" ng-if="competitions.competition.results_type == 'precision'"></div>
        </div>
    </div>
</div>