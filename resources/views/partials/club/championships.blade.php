<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Mästerskap')}}
                </div>

                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-3 col-sm-offset-9">
                            <div class="input-group">
                                <input type="text" ng-model="championships.championships.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 1000}' ng-change="championships.updatePage();">
                                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>

                <table class="table table-hover table-striped">
                    <thead>
                        <tr>
                            <th>{{_('Mästerskap')}}</th>
                            <th>{{_('Antal tävlingar')}}</th>
                            <th>{{_('Anmälningar')}}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr ui-sref="championships.show.competitions({championships_id: championship.id})" ng-repeat="championship in championships.championships.data">
                            <td><% championship.name %></td>
                            <td><% championship.competitions_count %></td>
                            <td><% championship.signups_count %></td>
                            <td class="text-right"><a ui-sref="championships.show.competitions({championships_id: championship.id})" class="btn btn-primary btn-sm">Visa</a></td>
                        </tr>
                    </tbody>
                </table>
                <div class="panel-footer" ng-if="championships.championships.total">
                    <div class="row">
                        <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                            <div uib-pagination
                                    total-items="championships.championships.total"
                                    ng-model="championships.championships.current_page"
                                    items-per-page="championships.championships.per_page"
                                    max-size="5"
                                    ng-change="championship.updatePage()"
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
                            <select ng-model="championships.championships.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="championship.updatePage();">
                            </select>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <input type="number" min="1" ng-model="championships.championships.current_page" class="form-control text-right" ng-model-options='{debounce: 1500}' ng-change="championship.updatePage();">
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</ui-view>