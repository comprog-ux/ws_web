<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6"><% competitions.competition.translations.stations_name_plural | ucfirst %></div>
        </div>
    </div>

    <table class="table table-striped table-bordered">
        <thead>
        <tr>
            <th>{{_('Nummer')}}</th>
            <th>{{_('Figurer')}}</th>
            <th>{{_('Skott')}}</th>
            <th>{{_('Poängräkning')}}</th>
            <th>{{_('Särskjutning')}}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
        <tr ng-repeat="station in stations.stations | filter:{distinguish:0}:true">
            <td><% station.station_nr %></td>
            <td><% station.figures %></td>
            <td><% station.shots %></td>
            <td>
                <span ng-if="station.points" class="label label-primary">Poängräkning</span>
            </td>
            <td><span ng-if="station.distinguish">{{_('Särskjutning')}}</span></td>
            <td>
                <button class="btn btn-xs btn-primary" ng-click="stations.openStationEditModal(station, competitions.competition);">{{_('Redigera')}}</button>
                <button class="btn btn-xs btn-danger" ng-click="stations.deleteStation(station);">{{_('Radera')}}</button>
            </td>
        </tr>
        {{--
        <tr ng-if="stations_distinguish.length">
            <td colspan="6">{{_('Särskjutning')}}</td>
        </tr>
        <tr ng-repeat="station in stations_distinguish = (stations.stations | filter:{distinguish:1}:true)">
            <td><% station.station_nr %></td>
            <td><% station.figures %></td>
            <td><% station.shots %></td>
            <td>
                <span ng-if="station.points" class="label label-primary">Poängräkning</span>
            </td>
            <td><span ng-if="station.distinguish">{{_('Särskjutning')}}</span></td>
            <td>
                <button class="btn btn-xs btn-primary" ng-click="stations.openStationEditModal(station, competitions.competition);">{{_('Redigera')}}</button>
                <button class="btn btn-xs btn-danger" ng-click="stations.deleteStation(station);">{{_('Radera')}}</button>
            </td>
        </tr>
        --}}
        </tbody>
        <tfood>
            <tr>
                <td colspan="6">
                    <button class="btn btn-primary" ng-click="stations.createStation();">{{_('Skapa %s', '<% competitions.competition.translations.stations_name_singular %>')}}</button>
                </td>
            </tr>
        </tfood>
    </table>
</div>

<script type="text/ng-template" id="StationEditModal.html">

    <div class="modal-header">
        <h3 class="modal-title">{{_('Redigera')}}</h3>
    </div>

    <div class="modal-body">
        <div class="row">
            <div class="col-sm-6">
                <div class="panel panel-primary">
                    <div class="panel-heading">{{_('Tävlingsinformation')}}</div>
                    <div class="panel-body">
                        <table class="table table-bordered">
                            <tbody>
                            <tr>
                                <td>{{_('Datum')}}</td>
                                <td><% modalcontroller.competition.date %></td>
                            </tr>
                            <tr>
                                <td>{{_('Tävlingsgrupp')}}</td>
                                <td><% (modalcontroller.competition.championship.name) ? modalcontroller.competition.championship.name : '-' %></td>
                            </tr>
                            <tr>
                                <td><% modalcontroller.competition.translations.patrols_lane_plural | ucfirst %></td>
                                <td><% modalcontroller.competition.patrol_size %></td>
                            </tr>
                            <tr>
                                <td>{{_('Start tid')}}</td>
                                <td><% modalcontroller.competition.start_time_human %></td>
                            </tr>
                            <tr>
                                <td>{{_('Final tid')}}</td>
                                <td><% modalcontroller.competition.final_time_human %></td>
                            </tr>
                            <tr>
                                <td>{{_('Längd')}}</td>
                                <td><% modalcontroller.competition.patrol_time %></td>
                            </tr>
                            <tr>
                                <td>{{_('Rast')}}</td>
                                <td><% modalcontroller.competition.patrol_time_rest %></td>
                            </tr>
                            <tr>
                                <td>{{_('Intervall')}}</td>
                                <td><% modalcontroller.competition.patrol_time_interval %></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="panel panel-primary">
                    <div class="panel-heading"><% modalcontroller.competition.translations.stations_name_singular | ucfirst %></div>
                    <div class="panel-body">
                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Figurer')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <div class="input-group">
                                    <input type="tel" ng-model="modalcontroller.station.figures" class="form-control" aria-label="{{_('st')}}" ng-enter="modalcontroller.updateStation(modalcontroller.station)">
                                    <span class="input-group-addon">{{_('st')}}</span>
                                </div>
                            </div>
                        </div>
                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Antal skott')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <div class="input-group">
                                    <input type="tel" ng-model="modalcontroller.station.shots" class="form-control" aria-label="{{_('st')}}" ng-enter="modalcontroller.updateStation(modalcontroller.station)">
                                    <span class="input-group-addon">{{_('st')}}</span>
                                </div>
                            </div>
                        </div>
                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Poängräkning')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <input type="checkbox" ng-model="modalcontroller.station.points" ng-true-value="1" ng-false-value="0">
                            </div>
                        </div>
                        {{--
                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Särskjutning')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <input type="checkbox" ng-model="modalcontroller.station.distinguish" ng-true-value="1" ng-false-value="0">
                            </div>
                        </div>
                        --}}

                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.updateStation(modalcontroller.station)">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</script>