<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Användare')}} | <% user.user.fullname %>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-3">
                            <ul class="nav nav-pills nav-stacked">

                                <li>
                                    <a ui-sref="admin.users.index">
                                        {{_('Alla användare')}}
                                    </a>
                                </li>
                                <li>
                                    <a ui-sref="admin.users.show({user_id: user.user.user_id})">
                                        {{_('Information')}}
                                    </a>
                                </li>
                                <li>
                                    <a ui-sref="admin.users.show.signups({user_id: user.user.user_id})">
                                        {{_('Anmälningar')}}
                                    </a>
                                </li>
                                <li>
                                    <a ui-sref="admin.users.show.invoices({user_id: user.user.user_id})">
                                        {{_('Fakturor')}}
                                    </a>
                                </li>

                            </ul>
                        </div>
                        <div class="col-sm-9">
                            <div ui-view="main">
                                <div class="panel panel-default">
                                    <div class="panel-heading">
                                        {{_('Information')}}
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
                                                <td>{{_('Aktiv')}}</td>
                                                <td><% (user.user.active) ? '{{_('Ja')}}' : '{{_('Nej')}}' %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Aktiveringskod')}}</td>
                                                <td><% user.user.activation_code %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Förening')}}</td>
                                                <td>
                                                    <div ng-repeat="club in user.user.clubs">
                                                        <a ui-sref="admin.clubs.show({id: club.id})"><% club.clubs_nr %> <% club.name %></a>
                                                        <div class="break-lines"><% club.address_combined %></div>
                                                    </div>
                                                </td>
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
                                            <tr>
                                                <td>{{_('Klass banskjutning')}}</td>
                                                <td><% user.user.grade_trackshooting %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Klass fält')}}</td>
                                                <td><% user.user.grade_field %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Registrerades')}}</td>
                                                <td><% user.user.created_at %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Senast uppdaterad')}}</td>
                                                <td><% user.user.created_at %></td>
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
                                            <div class="col-sm-6" ng-hide="user.user | isEmpty">
                                                <button class="btn btn-primary" ui-sref="admin.users.show.edit({user_id:user.user.user_id})">{{_('Ändra')}}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>

