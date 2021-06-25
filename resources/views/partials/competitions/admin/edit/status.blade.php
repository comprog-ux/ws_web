<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Visningsstatus')}}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <tbody>
        <tr>
            <td class="col-sm-4">{{_('Tävlingen')}}</td>
            <td>
                <div class="btn-group">
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.is_public" uib-btn-radio="0">{{_('Dold')}}</label>
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.is_public" uib-btn-radio="1">{{_('Publik')}}</label>
                </div>
            </td>
        </tr>
        <tr>
            <td class="col-sm-4"><% competitions.competition.translations.patrols_name_plural | ucfirst %></td>
            <td>
                <div class="btn-group">
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.patrols_is_public" uib-btn-radio="0">{{_('Dold')}}</label>
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.patrols_is_public" uib-btn-radio="1">{{_('Publik')}}</label>
                </div>
            </td>
        </tr>
        <tr>
            <td class="col-sm-4">{{_('Resultat')}}</td>
            <td>
                <div class="btn-group">
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.results_is_public" uib-btn-radio="0">{{_('Dold')}}</label>
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.results_is_public" uib-btn-radio="1">{{_('Publik')}}</label>
                </div>
            </td>
        </tr>
        </tbody>
    </table>
    <div class="panel-footer">
        <button class="btn btn-primary" ng-click="competitions.update()">{{_('Spara')}}</button>
    </div>
</div>