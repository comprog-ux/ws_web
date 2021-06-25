<div class="panel panel-default">
    <div class="panel-heading">
        {{_('Bjud in en annan användare')}}
    </div>

    <div class="panel-body">

        <div class="row">
            <div class="col-sm-4 padding-top-5">{{_('För- och efternamn')}}</div>
            <div class="col-sm-8">
                <div class="row">
                    <div class="col-sm-6">
                        <input type="text" class="form-control" ng-model="invite.user.name" ng-enter="invite.invite()" placeholder="{{_('Förnamn')}}">
                    </div>
                    <div class="col-sm-6">
                        <input type="text" class="form-control" ng-model="invite.user.lastname" ng-enter="invite.invite()" placeholder="{{_('Efternamn')}}">
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-top-10">
            <div class="col-sm-4 padding-top-5">{{_('E-postadress')}}</div>
            <div class="col-sm-8"><input type="text" class="form-control" ng-model="invite.user.email" ng-enter="invite.invite()" placeholder="{{_('E-postadress')}}"></div>
        </div>
        <div class="row margin-top-10">
            <div class="col-sm-4 padding-top-5">{{_('Meddelande')}}</div>
            <div class="col-sm-8"><textarea class="form-control" ng-model="invite.user.message" placeholder="{{_('Ditt meddelande')}}" rows="8"></textarea></div>
        </div>
        <hr>
        <a ng-click="invite.invite();" class="btn btn-primary">{{_('Skicka inbjudan')}}</a>
    </div>
</div>
<div class="panel panel-default hide margin-top-20" ng-class="{'show': invite.invites.length}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Skickade inbjudningar')}}</div>
            <div class="col-sm-6 text-right">{{_('Antal')}}: <% invite.invites.length %></div>
        </div>
    </div>

    <div class="panel-body">

        <table class="table table-striped">
            <thead>
            <th>{{_('Namn')}}</th>
            <th>{{_('Efternamn')}}</th>
            <th>{{_('E-post')}}</th>
            <th>{{_('Meddelande')}}</th>
            <th>{{_('Skickat')}}</th>
            <th>{{_('Registrerad')}}</th>
            </thead>

            <tbody>
            <tr ng-repeat="invite in invite.invites" ng-class="{'success': invite.registered_at}">
                <td><% invite.name %></td>
                <td><% invite.lastname %></td>
                <td><% invite.email %></td>
                <td><% invite.message %></td>
                <td><% invite.created_at | dateToISO | date : 'yyyy-MM-dd' %></td>
                <td>
                    <span ng-if="invite.registered_at"><i class="fa fa-check"></i> <% invite.registered_at | dateToISO | date : 'yyyy-MM-dd' %></span>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</div>