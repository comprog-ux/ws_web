<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Administratörer')}}</div>
        </div>
    </div>

    <table class="table table-striped table-bordered">
        <thead>
        <tr>
            <th>{{_('Användare')}}</th>
            <th>{{_('E-postadress')}}</th>
            <th>{{_('Behörighetsroll')}}</th>
            <th>{{_('Förening')}}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
        <tr ng-repeat="admin in admins.admins">
            <td><% admin.user.fullname %></td>
            <td><% admin.user.email %></td>
            <td><% admin.role_human %></td>
            <td><% admin.user.clubs[0].name %></td>
            <td class="text-right">
                <button class="btn btn-xs btn-danger" ng-click="admins.deleteAdmin(admin);">{{_('Radera')}}</button>
            </td>
        </tr>
        </tbody>
        <tfood>
            <tr>
                <td>
                    <select
                            ng-model="admins.newAdmin.users_id"
                            ng-options="
                                    user.user_id as user.fullname for user in admins.users
                                 " class="form-control">
                        <option value="">{{_('Välj medlem från din förening')}}</option>
                    </select>
                </td>
                <td>
                    <select
                            ng-model="admins.newAdmin.role"
                            ng-options="
                                    role.id as role.role for role in admins.roles
                                 " class="form-control">
                        <option value="">{{_('Välj behörighetsroll')}}</option>
                    </select>
                </td>
                <td colspan="2">
                    <button class="btn btn-primary" ng-click="admins.createAdmin();">{{_('Lägg till')}}</button>
                </td>
            </tr>
        </tfood>
    </table>
</div>

<script type="text/ng-template" id="AdminEditModal.html">

    <div class="modal-header">
        <h3 class="modal-title">{{_('Redigera')}}</h3>
    </div>
    <div class="modal-body">
        <label>{{_('Anmälningsavgift')}}</label>
        <input type="text"
               class="form-control text-right"
               ng-model="modalcontroller.admin.pivot.registration_fee"
               ng-enter="modalcontroller.updateAdmin(modalcontroller.admin)"
               autofocus
        >
    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.updateAdmin(modalcontroller.admin)">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</script>