<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-xs-9">{{_('Kretsar')}}</div>
                        <div class="col-xs-3 text-right"><% districts.districts.data.length %> av <% districts.districts.total %></div>
                    </div>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-8">
                        </div>
                        <div class="col-sm-4">
                            <div class="input-group">
                                <input type="text" ng-model="districts.districts.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 500}' ng-change="districts.updatePage();">
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
                                <th>{{_('Nr')}}</th>
                                <th>{{_('Krets')}}</th>
                                <th class="text-right">{{_('Antal föreningar')}}</th>
                                <th>{{_('Registrerad')}}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="admin.districts.show({id:district.id})" ng-repeat="district in districts.districts.data">
                                <td><% district.id %></td>
                                <td><% district.districts_nr %></td>
                                <td><% district.name %></td>
                                <td class="text-right"><% district.clubs_count %></td>
                                <td><% district.created_at %></td>
                                <td><button ui-sref="admin.districts.show({id:district.id})" class="btn btn-primary btn-xs">{{_('Visa')}}</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="panel-footer">
                    <div class="row">
                        <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                            <div uib-pagination
                                    total-items="districts.districts.total"
                                    ng-model="districts.districts.current_page"
                                    items-per-page="districts.districts.per_page"
                                    max-size="5"
                                    ng-change="districts.updatePage()"
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
                            <select ng-model="districts.districts.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="districts.updatePage();">
                            </select>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <input type="number" min="1" ng-model="districts.districts.current_page" class="form-control text-right" ng-model-options='{debounce: 500}' ng-change="districts.updatePage();">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>