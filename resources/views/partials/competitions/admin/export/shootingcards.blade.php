<div class="alert alert-danger" ng-if="!competitions.competition.stations_count">
    <div class="row">
        <div class="col-sm-8">
            <div ng-if="!competitions.competition.stations_count">{{_('Denna tävling har inte några stationer ännu')}}</div>
        </div>
        <div class="col-sm-4 text-right">
            <a class="btn btn-sm btn-primary" ui-sref="competitions.admin.edit.stations({competitions_id:competitions.competition.id})">{{_('Skapa stationer')}}</a>
        </div>
    </div>
</div>
<div class="row" ng-if="competitions.competition.stations_count">
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Skjutkort')}}
            </div>
            <div class="panel-body">
                <div class="row form-group">
                    <div class="col-sm-12">
                        <label>{{_('Typ av skjutkort')}}</label>
                        <select class="form-control" ng-model="export.filter.patrol_type">
                            <option value="patrols">{{_('Skjutkort')}}</option>
                            <option value="finals">{{_('Skjutkort Final')}}</option>
                            <option value="distinguish">{{_('Skjutkort Särskjutning')}}</option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-lg-12">
                        <label><% competitions.competition.translations.patrols_name_singular | ucfirst %></label>
                        <select class="form-control" ng-options="patrol.sortorder as (patrol.sortorder+ ' ('+patrol.start_time_human+')') for patrol in competitions.competition.patrols" ng-model="export.filter.patrol" ng-if="export.filter.patrol_type == 'patrols'">
                            <option value=""><% competitions.competition.translations.patrols_name_singular | ucfirst %></option>
                        </select>
                        <select class="form-control" ng-options="patrol.sortorder as (patrol.sortorder+ ' ('+patrol.start_time_human+')') for patrol in competitions.competition.patrols_finals" ng-model="export.filter.patrol" ng-if="export.filter.patrol_type == 'finals'">
                            <option value=""><% competitions.competition.translations.patrols_name_singular | ucfirst %></option>
                        </select>
                        <select class="form-control" ng-options="patrol.sortorder as (patrol.sortorder+ ' ('+patrol.start_time_human+')') for patrol in competitions.competition.patrols_distinguish" ng-model="export.filter.patrol" ng-if="export.filter.patrol_type == 'distinguish'">
                            <option value=""><% competitions.competition.translations.patrols_name_singular | ucfirst %></option>
                        </select>
                    </div>
                </div>
                <label><% competitions.competition.translations.patrols_lane_singular | ucfirst %> ({{_('från')}}/{{_('till')}})</label>
                <div class="row form-group">
                    <div class="col-sm-6">
                        <select class="form-control" ng-options="n for n in [] | range:1:competitions.competition.patrol_size+1" ng-model="export.filter.lane_start">
                            <option value=""><% competitions.competition.translations.patrols_lane_singular | ucfirst %></option>
                        </select>
                    </div>
                    <div class="col-sm-6">
                        <select class="form-control" ng-options="n for n in [] | range:1:competitions.competition.patrol_size+1" ng-model="export.filter.lane_end">
                            <option value=""><% competitions.competition.translations.patrols_lane_singular | ucfirst %></option>
                        </select>
                    </div>
                </div>
                <a ng-click="export.downloadShootingcards(competitions.competition, {patrol_type:export.filter.patrol_type, patrol:export.filter.patrol, lane_start: export.filter.lane_start, lane_end: export.filter.lane_end});" class="btn btn-default">{{_('Skjutkort')}}</a>
            </div>
        </div>
    </div>
</div>

