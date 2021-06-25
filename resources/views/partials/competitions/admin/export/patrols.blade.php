<div class="row">
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <% competitions.competition.translations.patrols_list_plural | ucfirst %>
            </div>
            <div class="panel-body">
                <div class="form-group">
                    <select ng-model="export.filter.patrols_output.pagebreak" class="form-control">
                        <option value="">{{_('Ej automatisk sidbrytning')}}</option>
                        <option value="pagebreak">{{_('Automatisk sidbrytning')}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <select ng-model="export.filter.patrols_output.orderby" class="form-control">
                        <option value="patrols">{{_('Sortera på %s', '<% competitions.competition.translations.patrols_name_plural %>')}}</option>
                        <option value="clubs">{{_('Sortera på förening')}}</option>
                    </select>
                </div>
                <button class="btn btn-default" ng-click="export.downloadPatrolsList(competitions.competition);">{{_('Ladda ner %s','<% competitions.competition.translations.patrols_list_plural %>')}}</button>
            </div>
        </div>
    </div>
</div>

