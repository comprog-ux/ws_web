<div class="row hide" ng-class="{'show': (club.club | isEmpty)}">
    <div class="col-sm-12 text-center padding-bottom-30">
        <h3>{{_('Du har inte kopplat dig till någon förening ännu.')}}</h3>
        <button class="btn btn-primary" ui-sref="club.information">{{_('Koppla dig till en förening')}}</button>
    </div>
</div>

<div class="panel panel-default" ng-class="{'hide': (club.club | isEmpty)}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Administratörsroller')}}</div>
        </div>
    </div>

    <div class="panel-body" ng-if="club.club.admins.length">
        <p>{{_('Nedan listas alla användare som har behörighet till att administrera din förening. ')}}</p>
        <table class="table table-bordered margin-bottom-0 margin-top-20" ng-if="club.club.admins.length">
            <thead>
            <tr>
                <th class="col-xs-9">{{_('Namn')}}</th>
                <th ng-if="club.club.user_has_role=='admin'"></th>
            </tr>
            </thead>
            <tbody>
            <tr ng-repeat="admin in club.club.admins">
                <td><% admin.fullname %></td>
                <td ng-if="club.club.user_has_role=='admin'" class="text-right"><button class="btn btn-danger btn-xs" ng-click="club.deleteUserAsAdmin(admin.user_id)">Ta bort</button></td>
            </tr>
            </tbody>
        </table>
    </div>

    <div class="panel-body" ng-if="!club.club.admins.length">
        <p>{{_('Din förening har än så länge inte någon administratör kopplad till sig och du kan därmed koppla dig själv som administratör.')}}</p>
        <hr>
        <div class="row">
            <div class="col-sm-3">
                <button class="btn btn-primary" ng-click="club.addUserAsAdmin(currentUser.user_id)">{{_('Lägg till dig som administratör')}}</button>
            </div>
        </div>
    </div>
</div>

<div class="panel panel-default" ng-if="club.club.user_has_role == 'admin'">
    <div class="panel-heading">
        {{_('Lägg till en användaren med admininistratör behörighet')}}
    </div>
    <div class="panel-body">
        <p>{{_('Du kan enkelt lägga till administratörer som sedan får tillgång till att administrera föreningen.')}}</p>
        <hr>
        <div class="row">
            <div class="col-sm-6">
                <select ng-model="club.add_admin" ng-options="user.user_id as user.fullname for user in club.club.users" class="form-control">
                    <option value="">{{_('Välj någon från din förening')}}</option>
                </select>
            </div>
            <div class="col-sm-3">
                <button class="btn btn-primary" ng-click="club.addUserAsAdmin(club.add_admin)">{{_('Lägg till')}}</button>
            </div>
        </div>
    </div>

</div>
