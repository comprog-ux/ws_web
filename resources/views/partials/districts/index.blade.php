<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-xs-6">{{_('Administrera dina kretsar')}}</div>
                        <div class="col-xs-6 text-right"><% districts.districts.length %> st</div>
                    </div>
                </div>

                <div class="table-responsive  hidden-xs" ng-if="districts.districts.length">
                    <table class="table table-hover table-bordered table-striped ">
                        <thead>
                            <tr>
                                <th>{{_('Krets nr')}}</th>
                                <th>{{_('Krets')}}</th>
                                <th>{{_('Adress')}}</th>
                                <th>{{_('Telefon')}}</th>
                                <th>{{_('E-postadress')}}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="districts.show({districts_id: district.id, view: 'information'})" ng-repeat="district in districts.districts">
                                <td class="text-nowrap"><% district.districts_nr %></td>
                                <td><% district.name %></td>
                                <td><% district.address_combined %></td>
                                <td><% district.phone %></td>
                                <td><% district.email %></td>
                                <td><a ui-sref="districts.show({districts_id: district.id})" class="btn btn-primary btn-xs">Visa</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="panel-body" ng-if="!districts.districts.length">
                    <div class="alert alert-info">
                        {{_('Du verkar inte ha tillgång till någon krets.')}}
                    </div>
                </div>

            </div>
        </div>
    </div>
</ui-view>