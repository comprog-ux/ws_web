<div class="row">
    <div class="col-sm-8">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Användare')}}
            </div>
            <div class="table-responsive" ng-hide="user.user | isEmpty">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td>{{_('Förnamn')}}</td>
                            <td><% user.user.name %></td>
                        </tr>
                        <tr>
                            <td>{{_('Efternamn')}}</td>
                            <td><% user.user.lastname %></td>
                        </tr>
                        <tr>
                            <td>{{_('E-postadress')}}</td>
                            <td><% user.user.email %></td>
                        </tr>
                        <tr>
                            <td>{{_('Mobiltelefon')}}</td>
                            <td><% user.user.mobile %></td>
                        </tr>
                        <tr>
                            <td>{{_('Hemtelefon')}}</td>
                            <td><% user.user.phone %></td>
                        </tr>
                        <tr>
                            <td>{{_('Kön')}}</td>
                            <td><% (user.user.gender == 'male') ? '{{_('Man')}}' : '{{_('Kvinna')}}' %></td>
                        </tr>
                        <tr>
                            <td>{{_('Födelseår')}}</td>
                            <td><% user.user.birthday %></td>
                        </tr>
                        <tr>
                            <td>{{_('Pistolskyttekortsnummer')}}</td>
                            <td><% user.user.shooting_card_number %></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel-body" ng-show="user.user | isEmpty">
                {{_('Användaren verkar inte finnas i systemet.')}}
            </div>

            <hr>
            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-6">
                        <button class="btn btn-default" ui-sref="club.users.index">{{_('Alla användare')}}</button>
                    </div>
                    <div class="col-sm-6 text-right" ng-hide="user.user | isEmpty">
                        <button class="btn btn-primary" ui-sref="club.users.edit({user_id:user.user.user_id})">{{_('Ändra')}}</button>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

