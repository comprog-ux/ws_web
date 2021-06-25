<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-xs-9">{{_('Användare')}}</div>
                        <div class="col-xs-3 text-right"><% users.users.data.length %> av <% users.users.total %></div>
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
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="btn-group">
                                <label class="btn btn-success" ng-model="users.users.status" ng-click="users.updatePage()" uib-btn-radio="'all'" uib-uncheckable="uncheckable">{{_('Alla')}}</label>
                                <label class="btn btn-success" ng-model="users.users.status" ng-click="users.updatePage()" uib-btn-radio="'active'" uib-uncheckable="uncheckable">{{_('Aktiva')}}</label>
                                <label class="btn btn-success" ng-model="users.users.status" ng-click="users.updatePage()" uib-btn-radio="'inactive'" uib-uncheckable="uncheckable">{{_('Inaktiva')}}</label>
                                <label class="btn btn-success" ng-model="users.users.status" ng-click="users.updatePage()" uib-btn-radio="'noaccount'" uib-uncheckable="uncheckable">{{_('Utan konto')}}</label>
                                <label class="btn btn-success" ng-model="users.users.status" ng-click="users.updatePage()" uib-btn-radio="'deleted'" uib-uncheckable="uncheckable">{{_('Raderade')}}</label>
                            </div>
                        </div>
                        <div class="col-sm-4 col-sm-offset-2">
                            <div class="input-group">
                                <input type="text" ng-model="users.users.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 500}' ng-change="users.updatePage();">
                                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover table-bordered table-striped ">
                        <thead>
                            <tr>
                                <th>{{_('ID')}}</th>
                                <th>{{_('Namn')}}</th>
                                <th>{{_('Förening')}}</th>
                                <th>{{_('E-postadress')}}</th>
                                <th>{{_('Pskn')}}</th>
                                <th>{{_('Status')}}</th>
                                <th>{{_('Registrerad')}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ng-repeat="user in users.users.data | filter: users.filter.search | filter:{status: users.filter.status}:true">
                                <td ui-sref="admin.users.show({user_id:user.user_id})"><% user.id %></td>
                                <td ui-sref="admin.users.show({user_id:user.user_id})"><% user.fullname %></td>
                                <td>
                                    <div ng-repeat="club in user.clubs">
                                        <a ui-sref="admin.clubs.show({id: club.id})"><% club.clubs_nr %> <% club.name %></a>
                                    </div>
                                </td>
                                <td ui-sref="admin.users.show({user_id:user.user_id})"><% user.email %></td>
                                <td ui-sref="admin.users.show({user_id:user.user_id})" class="text-right"><% user.shooting_card_number %></td>
                                <td ui-sref="admin.users.show({user_id:user.user_id})"><% user.status %></td>
                                <td ui-sref="admin.users.show({user_id:user.user_id})" class="text-right nowrap"><% user.created_at | dateToISO | date:"yyyy-MM-dd" %></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="panel-footer">
                    <div class="row">
                        <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                            <div uib-pagination
                                    total-items="users.users.total"
                                    ng-model="users.users.current_page"
                                    items-per-page="users.users.per_page"
                                    max-size="5"
                                    ng-change="users.updatePage()"
                                    class="margin-0"
                                    boundary-links="true"
                                    rotate="false"
                                    first-text="{{_('Första')}}"
                                    last-text="{{_('Sista')}}"
                                    next-text="{{_('&raquo;')}}"
                                    previous-text="{{_('&laquo;')}}"
                            ></div>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <select ng-model="users.users.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="users.updatePage();">
                            </select>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <input type="number" min="1" ng-model="users.users.current_page" class="form-control text-right" ng-model-options='{debounce: 500}' ng-change="users.updatePage();">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>