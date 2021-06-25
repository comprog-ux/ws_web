<div class="panel panel-primary">
    <div class="panel-heading">
        <div class="row">
            <div class="col-xs-9">{{_('Importera användare')}}</div>
        </div>
    </div>
    <div class="panel-navigation">
        <a ui-sref="admin.users.index" class="btn btn-default" ng-class="{'active': (currentRoute == 'admin.users.index')}">
            {{_('Användarlista')}}
        </a>
        <a ui-sref="admin.users.import" class="btn btn-default" ng-class="{'active': (currentRoute == 'admin.users.import')}">
            {{_('Importera användare')}}
        </a>
        <a ui-sref="admin.users.clubChanges" class="btn btn-default" ng-class="{'active': (currentRoute == 'admin.users.clubChanges')}">
            {{_('Föreningsbyten')}}
        </a>
    </div>
    <div class="panel-body">
        <input type="file" id="import-file">
        <hr>
        <a class="btn btn-success" ng-class="{'disabled': user.importing}" ng-click="user.import()">Importera</a>
    </div>
</div>