<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Information')}}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <tbody>
        <tr>
            <td class="col-sm-4">{{_('Namn')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.name" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('Beskrivning')}}</td>
            <td>
                <textarea type="text" ng-model="competitions.competition.description" class="form-control"></textarea>
            </td>
        </tr>
        <tr>
            <td>{{_('Mästerskap')}}</td>
            <td>
                <select ng-model="competitions.competition.championships_id" class="form-control" ng-options="championship.id as championship.name for championship in competitions.championships">
                    <option value="">{{_('Fristående tävling, Inget mästerskap')}}</option>
                </select>
                <div class="row margin-top-5 margin-bottom-5">
                    <div class="col-sm-12 text-right">
                        <button class="btn btn-primary btn-xs" ng-click="competitions.openCreateChampionshipsModal()"><i class="fa fa-plus"></i> {{_('Skapa ett nytt mästerskap')}}</a>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Tävlingstyp')}}</td>
            <td>
                <select ng-model="competitions.competition.competitiontypes_id" class="form-control" ng-options="competitiontype.id as competitiontype.name for competitiontype in competitions.competition_types"></select>
            </td>
        </tr>
        <tr>
            <td>{{_('Resultatberäkning')}}</td>
            <td>
                <select ng-model="competitions.competition.results_type" class="form-control" ng-options="resultstype.type as resultstype.name for resultstype in competitions.results_types"></select>
            </td>
        </tr>
        <tr>
            <td>{{_('Använd priser i resultat')}}</td>
            <td>
                <div class="btn-group">
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.results_prices" uib-btn-radio="0">{{_('Inga priser')}}</label>
                    <label class="btn btn-sm btn-primary" ng-model="competitions.competition.results_prices" uib-btn-radio="1">{{_('Använd priser')}}</label>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Vapengrupper')}}</td>
            <td>
                <span ng-repeat="weaponclass in competitions.competition.weaponclasses" class="label label-default margin-right-5 inline-block"><% (competitions.competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></span>
                <br>
                <a ui-sref="competitions.admin.weaponclasses({competitions_id: competitions.competition.id})" class="btn btn-primary btn-xs margin-top-5">{{_('Hantera vapengrupper')}}</a>
            </td>
        </tr>
        <tr>
            <td><% competitions.competition.translations.patrols_size | ucfirst %></td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.patrol_size" class="form-control text-right" placeholder="{{_('Antal platser')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('styck')}}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Max antalet deltagare')}}</td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.max_competitors" class="form-control text-right" placeholder="{{_('Antal platser')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('styck')}}</span>
                </div>
            </td>
        </tr>
        </tr>
        <tr>
            <td>{{_('Åtgångstid')}}</td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.patrol_time" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('minuter')}}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Rast')}}</td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.patrol_time_rest" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('minuter')}}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Tid mellan %s', '<% competitions.competition.translations.patrols_name_plural %>')}}</td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.patrol_time_interval" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('minuter')}}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('PDF-logotyp')}}</td>
            <td>
                <select class="form-control" ng-model="competitions.competition.pdf_logo">
                    <option value="webshooter">Webshooter</option>
                    <option value="club" ng-if="competitions.competition.available_logos.indexOf('club') > -1">{{_('Förening')}}</option>
                    <option value="district" ng-if="competitions.competition.available_logos.indexOf('district') > -1">{{_('Krets')}}</option>
                </select>
            </td>
        </tr>
        </tbody>
    </table>
    <div class="panel-footer">
        <button class="btn btn-primary" ng-click="competitions.update()">{{_('Spara')}}</button>
    </div>
</div>
<script type="text/ng-template" id="CreateChampionshipModal.html">

    <div class="modal-header">
        <h3 class="modal-title">{{_('Skapa mästerskap')}}</h3>
    </div>

    <div class="modal-body">
        <input type="text" ng-model="modalcontroller.championship.name" class="form-control" placeholder="{{_('Mästerskapets namn')}}">
    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.save()">{{_('Skapa mästerskap')}}</button>
            </div>
        </div>
    </div>
</script>