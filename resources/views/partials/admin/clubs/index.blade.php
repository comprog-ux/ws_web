<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-xs-9">{{_('Föreningar')}}</div>
                        <div class="col-xs-3 text-right"><% clubs.clubs.data.length %> av <% clubs.clubs.total %></div>
                    </div>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-8">
                            <span class="btn-group">
                                <button class="btn btn-primary"
                                        ng-model="clubs.clubs.hide_without_admins"
                                        uib-btn-checkbox btn-checkbox-true="'1'"
                                        btn-checkbox-false="'0'"
                                        ng-change="clubs.updatePage();">
                                    <i class="fa" ng-class="{'fa-check-square-o': clubs.clubs.hide_without_admins == '1', 'fa-square-o': clubs.clubs.hide_without_admins == '0'}"></i> {{_('Göm utan admins')}}
                                </button>
                                <button class="btn btn-primary"
                                        ng-model="clubs.clubs.hide_without_users"
                                        uib-btn-checkbox btn-checkbox-true="'1'"
                                        btn-checkbox-false="'0'"
                                        ng-click="clubs.updatePage();">
                                    <i class="fa" ng-class="{'fa-check-square-o': clubs.clubs.hide_without_users == '1', 'fa-square-o': clubs.clubs.hide_without_users == '0'}"></i> {{_('Göm utan användare')}}
                                </button>
                                <button class="btn btn-primary"
                                        ng-model="clubs.clubs.hide_deleted"
                                        uib-btn-checkbox btn-checkbox-true="'0'"
                                        btn-checkbox-false="'1'"
                                        ng-click="clubs.updatePage();">
                                    <i class="fa" ng-class="{'fa-check-square-o': clubs.clubs.hide_deleted == '0', 'fa-square-o': clubs.clubs.hide_deleted == '1'}"></i> {{_('Visa raderade')}}
                                </button>
                            </span>
                        </div>
                        <div class="col-sm-4">
                            <div class="input-group">
                                <input type="text" ng-model="clubs.clubs.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 500}' ng-change="clubs.updatePage();">
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
                                <th>{{_('Krets')}}</th>
                                <th>{{_('Nr')}}</th>
                                <th>{{_('Förening')}}</th>
                                <th class="text-right">{{_('Användare')}}</th>
                                <th class="text-right">{{_('Admins')}}</th>
                                <th>{{_('Registrerad')}}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="admin.clubs.show({id:club.id})" ng-repeat="club in clubs.clubs.data" ng-class="{'danger': club.deleted_at}">
                                <td><% club.id %></td>
                                <td><% (club.district) ? club.district.districts_nr+' '+club.district.name : '-' %></td>
                                <td><% club.clubs_nr %></td>
                                <td><% club.name %></td>
                                <td class="text-right"><% club.users_count %></td>
                                <td class="text-right"><% club.admins_count %></td>
                                <td><% club.created_at %></td>
                                <td><button ui-sref="admin.clubs.show({id:club.id})" class="btn btn-primary btn-xs">{{_('Visa')}}</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="panel-footer">
                    <div class="row">
                        <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                            <div uib-pagination
                                    total-items="clubs.clubs.total"
                                    ng-model="clubs.clubs.current_page"
                                    items-per-page="clubs.clubs.per_page"
                                    max-size="5"
                                    ng-change="clubs.updatePage()"
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
                            <select ng-model="clubs.clubs.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="clubs.updatePage();">
                            </select>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <input type="number" min="1" ng-model="clubs.clubs.current_page" class="form-control text-right" ng-model-options='{debounce: 500}' ng-change="clubs.updatePage();">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>