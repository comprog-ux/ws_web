<div class="row">
    <div class="col-sm-3">
        <div class="panel panel-default">
            <div class="panel-heading">{{_('Inmatning')}}</div>

            <ul class="nav nav-pills nav-stacked" ng-if="competitions.competition.results_type == 'military'">
                <li>
                    <a ui-sref="competitions.admin.results.registration({competitions_id: competitions.competition.id, per_shot:0, station_end: 4, lane_end:10})">{{_('Registrera grundomgång')}}</a>
                </li>
                <li>
                    <a ui-sref="competitions.admin.results.distinguish({competitions_id: competitions.competition.id, per_shot:0, lane_end:competitions.competition.patrol_size})">{{_('Registrera särskjutning')}}</a>
                </li>
                <li ng-if="competitions.competition.results_prices">
                    <a ui-sref="competitions.admin.results.prices({competitions_id: competitions.competition.id})">{{_('Priser')}}</a>
                </li>
            </ul>
            <ul class="nav nav-pills nav-stacked" ng-if="competitions.competition.results_type == 'precision'">
                <li>
                    <a ui-sref="competitions.admin.results.registration({competitions_id: competitions.competition.id, per_shot:0, lane_end:10})">{{_('Registrera grundomgång')}}</a>
                </li>
                <li>
                    <a ui-sref="competitions.admin.results.finals({competitions_id: competitions.competition.id, per_shot:0, lane_end:10})">{{_('Registrera final')}}</a>
                </li>
                <li>
                    <a ui-sref="competitions.admin.results.distinguish({competitions_id: competitions.competition.id, per_shot:0, lane_end:10})">{{_('Registrera särskjutning')}}</a>
                </li>
                <li ng-if="competitions.competition.results_prices">
                    <a ui-sref="competitions.admin.results.prices({competitions_id: competitions.competition.id})">{{_('Priser')}}</a>
                </li>
            </ul>
            <ul class="nav nav-pills nav-stacked" ng-if="competitions.competition.results_type == 'field' || competitions.competition.results_type == 'pointfield' || competitions.competition.results_type == 'magnum'">
                <li>
                    <a ui-sref="competitions.admin.results.registration({competitions_id: competitions.competition.id, per_shot:0, station_end: competitions.competition.stations.length, lane_end:competitions.competition.patrol_size})">{{_('Registrera grundomgång')}}</a>
                </li>
                <li>
                    <a ui-sref="competitions.admin.results.distinguish({competitions_id: competitions.competition.id, per_shot:0, station_end: 1, lane_end:competitions.competition.patrol_size})">{{_('Registrera särskjutning')}}</a>
                </li>
                <li ng-if="competitions.competition.results_prices">
                    <a ui-sref="competitions.admin.results.prices({competitions_id: competitions.competition.id})">{{_('Priser')}}</a>
                </li>
            </ul>
        </div>
    </div>
</div>

