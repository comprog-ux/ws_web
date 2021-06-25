<div class="panel panel-default">
    <div class="panel-heading">
        {{_('Föreningsbyten som behöver granskas')}}
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th>{{_('Användare')}}</th>
                    <th>{{_('Från förening')}}</th>
                    <th>{{_('Till förening')}}</th>
                    <th>{{_('Initierad av')}}</th>
                    <th>{{_('Skapades')}}</th>
                    <th></th>               
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="change in user.clubChanges">
                    <td><% change.user.fullname %></td>
                    <td><% change.from_club.name %></td>
                    <td><% change.to_club.name %></td>
                    <td><% change.creator.fullname %></td>
                    <td><% change.created_at %></td>
                    <td>
                        <a class="btn btn-success btn-xs" ng-click="user.approveClubChange(change)">{{_('Godkänn')}}</a>
                        <a class="btn btn-danger btn-xs" ng-click="user.cancelClubChange(change)">{{_('Avslå')}}</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>