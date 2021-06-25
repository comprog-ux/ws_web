<div class="panel panel-default">
    <div class="panel-heading">
        {{_('Användare')}}
    </div>
    <div class="panel-body">
        <div class="row">
            <div class="col-sm-8 col-sm-offset-4">
                <div class="input-group">
                    <input type="text" ng-model="club.filter.users.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
                    <span class="input-group-addon"><i class="fa fa-search"></i></span>
                </div>
            </div>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th class="text-right">{{_('Pskn')}}</th>
                    <th>{{_('Förnamn')}}</th>
                    <th>{{_('Efternamn')}}</th>
                    <th>{{_('E-postadress')}}</th>
                    <th ng-if="club.club.user_has_role =='admin'"></th>
                </tr>
            </thead>
            <tbody>
                <tr ng-class="{'warning': !user.email}" ng-repeat="user in club.club.users | filter: club.filter.users.search">
                    <td class="text-right"><% (user.shooting_card_number) ? user.shooting_card_number : '-' %></td>
                    <td><% user.name %></td>
                    <td><% user.lastname %></td>
                    <td><span ng-if="user.email"><% user.email %></span><span class="label label-danger" ng-if="!user.email">{{_('E-post saknas')}}</span></td>
                    <td ng-if="club.club.user_has_role=='admin'">
                        <a ui-sref="club.users.edit({user_id:user.user_id})" class="btn btn-xs btn-primary">{{_('Ändra')}}</a>
                        <a ui-sref="club.users.changeClub({user_id:user.user_id})" class="btn btn-xs btn-default">{{_('Byt förening')}}</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>