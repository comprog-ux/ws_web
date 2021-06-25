<div class="row">
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Individuella resultatlistor')}}
            </div>
            <div class="panel-body">
                <div class="form-group">
                    <select ng-model="export.filter.results_output.pagebreak" class="form-control">
                        <option value="">{{_('Ej automatisk sidbrytning')}}</option>
                        <option value="pagebreak">{{_('Automatisk sidbrytning')}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <select ng-model="export.filter.results_output.std_medals" class="form-control">
                        <option value="">{{_('Dölj standardmedaljer')}}</option>
                        <option value="show">{{_('Visa standardmedaljer')}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <select ng-model="export.filter.results_output.prices" class="form-control">
                        <option value="">{{_('Dölj priser')}}</option>
                        <option value="show">{{_('Visa priser')}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <select ng-model="export.filter.results_output.format" class="form-control">
                        <option value="pdf" selected>{{_('Format')}}: {{_('pdf')}}</option>
                        <option value="xlsx">{{_('Format')}}: {{_('xlsx')}}</option>
                    </select>
                </div>
                <button class="btn btn-default" ng-click="export.downloadResultsList(competitions.competition);"><% competitions.competition.translations.results_list_plural | ucfirst %></button>
            </div>
        </div>
        <div class="panel panel-default" ng-if="competitions.competition.allow_teams">
            <div class="panel-heading">
                {{_('Lagresultatlistor')}}
            </div>
            <div class="panel-body">
                <button class="btn btn-default" ng-click="export.downloadResultsTeamsList(competitions.competition);">{{_('Lagresultat')}}</button>
            </div>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Notering på resultatlistan')}}
            </div>
            <div class="panel-body">
                <div class="form-group">
                    <textarea rows="10" class="form-control" ng-model="competitions.competition.results_comment" placeholder="Skriv en kommentar som visas i slutet på resultatlistan"></textarea>
                </div>
                <button class="btn btn-default" ng-click="export.updateCompetition(competitions.competition);">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</div>

