    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
         {{_('Föreningar i denna krets')}}
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-4 col-sm-offset-4">
´                        </div>
                        <div class="col-sm-4">
                            <div class="input-group">
                                <input type="text" ng-model="districts.filter.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
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
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="admin.clubs.show({id: club.id})" ng-repeat="club in districts.district.clubs | filter: districts.filter.search">
                                <td><% club.id %></td>
                                <td><% club.name %></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>