<div class="row">
    <div class="col-sm-3">
        <div class="panel panel-default">
            <div class="panel-heading"><% competitions.competition.translations.patrols_name_plural | ucfirst %></div>

            <ul class="nav nav-pills nav-stacked">
                <li>
                    <a ui-sref="competitions.admin.patrols.index({competitions_id: competitions.competition.id})">{{_('Grundomgång')}}</a>
                    <a ui-sref="competitions.admin.patrols.edit({competitions_id: competitions.competition.id})">{{_('Redigera grundomgång')}}</a>
                    <a ui-sref="competitions.admin.patrols.finals({competitions_id: competitions.competition.id})" ng-if="competitions.competition.results_type == 'precision'">{{_('Final')}}</a>
                    <a ui-sref="competitions.admin.patrols.distinguish({competitions_id: competitions.competition.id})">{{_('Särskjutning')}}</a>
                </li>
            </ul>

        </div>
    </div>
    <div class="col-sm-9">
        <div ui-view="patrols"></div>
    </div>
</div>

