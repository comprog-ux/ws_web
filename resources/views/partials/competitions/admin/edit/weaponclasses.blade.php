<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Vapengrupper')}}</div>
        </div>
    </div>

    <table class="table table-striped table-bordered">
        <thead>
        <tr>
            <th>{{_('Vapengrupp')}}</th>
            <th>{{_('Anmälningsavgift')}}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
        <tr ng-repeat="weaponclass in weaponclasses.weaponclasses">
            <td><% competitions.competition.championship ? weaponclass.classname_general : weaponclass.classname %></td>
            <td><% weaponclass.pivot.registration_fee %></td>
            <td class="text-right">
                <button class="btn btn-xs btn-primary" ng-click="weaponclasses.openWeaponclassEditModal(weaponclass, competitions.competition);">{{_('Redigera')}}</button>
                <button class="btn btn-xs btn-danger" ng-click="weaponclasses.deleteWeaponclass(weaponclass);">{{_('Radera')}}</button>
            </td>
        </tr>
        </tbody>
        <tfood>
            <tr>
                <td>
                    <select
                            ng-if="competitions.competition.championship"
                            ng-model="weaponclasses.newWeaponclass.weaponclasses_id"
                            ng-options="weaponclass.id as weaponclass.classname_general for weaponclass in weaponclasses.allweaponclasses | filter:{championship:1}:true"
                            class="form-control">
                        <option value="">{{_('Välj vapengrupp')}}</option>
                    </select>

                    <select
                            ng-if="!competitions.competition.championship"
                            ng-model="weaponclasses.newWeaponclass.weaponclasses_id"
                            ng-options="
                                    weaponclass.id as weaponclass.classname for weaponclass in weaponclasses.allweaponclasses
                                 " class="form-control">
                        <option value="">{{_('Välj vapengrupp')}}</option>
                    </select>
                </td>
                <td>
                    <div class="input-group">
                        <input type="tel"
                               ng-model="weaponclasses.newWeaponclass.registration_fee"
                               class="form-control text-right"
                               placeholder="{{_('Anmälningsavgift')}}"
                               ng-enter="weaponclasses.createWeaponclass();"
                               aria-describedby="basic-addon2"
                        >
                        <span class="input-group-addon">{{_('kr')}}</span>
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary" ng-click="weaponclasses.createWeaponclass();">{{_('Skapa')}}</button>
                </td>
            </tr>
        </tfood>
    </table>
</div>

<script type="text/ng-template" id="WeaponclassEditModal.html">

    <div class="modal-header">
        <h3 class="modal-title">{{_('Redigera')}}</h3>
    </div>
    <div class="modal-body">
        <label>{{_('Anmälningsavgift')}}</label>
        <input type="text"
               class="form-control text-right"
               ng-model="modalcontroller.weaponclass.pivot.registration_fee"
               ng-enter="modalcontroller.updateWeaponclass(modalcontroller.weaponclass)"
               autofocus
        >
    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.updateWeaponclass(modalcontroller.weaponclass)">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</script>