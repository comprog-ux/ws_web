<div class="row">
    <div class="col-sm-6">

        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Anmälningslista (pdf)')}}
            </div>
            <div class="panel-body">
                <div class="form-group">
                    <select ng-model="export.filter.signups_output.orderby" class="form-control">
                        <option value="name">{{_('Sortera på förnamn')}}</option>
                        <option value="lastname">{{_('Sortera på efternamn')}}</option>
                        <option value="date">{{_('Sortera på anmälningsdatum')}}</option>
                        <option value="clubname">{{_('Sortera på föreningsnamn')}}</option>
                        <option value="weapongroup">{{_('Sortera på vapengrupp')}}</option>
                        <option value="weapongroup_and_clubname">{{_('Sortera på vapengrupp och förening')}}</option>
                    </select>
                </div>
                <div class="form-group">
                    <select ng-model="export.filter.signups_output.pagebreak" class="form-control">
                        <option value="">{{_('Ej automatisk sidbrytning')}}</option>
                        <option value="pagebreak">{{_('Automatisk sidbrytning per vapengrupp')}}</option>
                    </select>
                </div>

                <button class="btn btn-default" ng-click="export.downloadSignupsList(competitions.competition);">{{_('Ladda ner anmälningslistor')}}</button>
            </div>
        </div>

        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Anmälningslista (xlsx)')}}
            </div>
            <div class="panel-body">
                <button class="btn btn-default" ng-click="export.downloadSignupsListAsXlsx(competitions.competition);">{{_('Ladda ner anmälningslistor')}}</button>
            </div>
        </div>

    </div>
</div>

