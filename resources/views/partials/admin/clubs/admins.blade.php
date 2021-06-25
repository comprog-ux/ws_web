    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Administratörsroller')}}
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-4 col-sm-offset-4">
                            <div class="btn-group">
                                <label class="btn btn-success" ng-model="users.filter.active" uib-btn-radio="1" uib-uncheckable="uncheckable">{{_('Aktiva')}}</label>
                                <label class="btn btn-success" ng-model="users.filter.active" uib-btn-radio="0" uib-uncheckable="uncheckable">{{_('Inaktiva')}}</label>
                                <label class="btn btn-success" ng-model="users.filter.active" uib-btn-radio="" uib-uncheckable="uncheckable">{{_('Alla')}}</label>
                            </div>                        </div>
                        <div class="col-sm-4">
                            <div class="input-group">
                                <input type="text" ng-model="users.filter.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
                                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <% users_filter_active %>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped ">
                        <thead>
                            <tr>
                                <th>{{_('ID')}}</th>
                                <th>{{_('Förnamn')}}</th>
                                <th>{{_('Efternamn')}}</th>
                                <th>{{_('E-postadress')}}</th>
                                <th>{{_('Mobiltelefon')}}</th>
                                <th>{{_('Hemtelefon')}}</th>
                                <th>{{_('Födelseår')}}</th>
                                <th>{{_('Pskn')}}</th>
                                <th>{{_('Status')}}</th>
                                <th>{{_('Registrerad')}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="admin.users.show({user_id: user.user_id})" ng-repeat="user in clubs.club.admins | filter: users.filter.search | filter:{active: users.filter.active}:true">
                                <td><% user.id %></td>
                                <td><% user.name %></td>
                                <td><% user.lastname %></td>
                                <td><% user.email %></td>
                                <td><% user.mobile %></td>
                                <td><% user.phone %></td>
                                <td><% user.birthday %></td>
                                <td><% user.shooting_card_number %></td>
                                <td><% user.active %></td>
                                <td><% user.created_at %></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>