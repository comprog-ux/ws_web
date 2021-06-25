<div class="row">
    <div class="col-sm-3">
        <div class="panel panel-default">
            <div class="panel-heading">{{_('Export & Utskrift')}}</div>

            <ul class="nav nav-pills nav-stacked">
                <li>
                    <a ui-sref="competitions.admin.export.signups({competitions_id: competitions.competition.id})">{{_('Anmälningslista')}}</a>
                    <a ui-sref="competitions.admin.export.teams({competitions_id: competitions.competition.id})" ng-if="competitions.competition.allow_teams">{{_('Laglistor')}}</a>
                    <a ui-sref="competitions.admin.export.patrols({competitions_id: competitions.competition.id})"><% competitions.competition.translations.patrols_list_plural | ucfirst %></a>
                    <a ui-sref="competitions.admin.export.shootingcards({competitions_id: competitions.competition.id})">{{_('Skjutkort')}}</a>
                    <a ui-sref="competitions.admin.export.results({competitions_id: competitions.competition.id})">{{_('Resultat-export.blade')}}</a>
                </li>
            </ul>

        </div>
    </div>
    <div class="col-sm-9">
        <div ui-view="export"></div>
    </div>
</div>

