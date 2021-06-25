<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                <div class="row">
                    <div class="col-xs-9">{{_('Anmälningar')}}</div>
                    <div class="col-xs-3 text-right"><% signups.signups.data.length %> av <% signups.signups.total %></div>
                </div>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-3">
                        <select ng-model="signups.signups.competitions_id" ng-change="signups.updatePage()" ng-options="competition.id as competition.date+' '+competition.name for competition in championships.championship.competitions" class="form-control">
                            <option value="">{{_('Välj tävling')}}</option>
                        </select>
                    </div>
                    <div class="col-sm-4 col-sm-offset-5">
                        <div class="input-group">
                            <input type="text" ng-model="signups.signups.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 500}' ng-change="signups.updatePage();">
                            <span class="input-group-addon"><i class="fa fa-search"></i></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-striped table-condensed">
                    <thead>
                    <tr>
                        <th>{{_('Namn')}}</th>
                        <th>{{_('Förening')}}</th>
                        <th class="text-right">{{_('Vapengrupp')}}</th>
                        <th>{{_('Datum')}}</th>
                        <th>{{_('Start')}}</th>
                        <th>{{_('Tävling')}}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr ng-repeat="signup in signups.signups.data">
                        <td><% signup.user.fullname %></td>
                        <td><% signup.club.name %></td>
                        <td class="text-right">
                            <span class="label label-default margin-right-5"><% signup.weaponclass.classname %></span>
                        </td>
                        <td><% signup.competition.date %></td>
                        <td><span ng-if="(signup.competition.patrols_is_public || signup.competition.user_roles.length) && signup.start_time"><% signup.start_time_human %> (<% signup.lane %>)</span></td>
                        <td><% signup.competition.name %></td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel-footer">
                <div class="row">
                    <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                        <div uib-pagination
                                total-items="signups.signups.total"
                                ng-model="signups.signups.current_page"
                                items-per-page="signups.signups.per_page"
                                max-size="5"
                                ng-change="signups.updatePage()"
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
                        <select ng-model="signups.signups.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="signups.updatePage();">
                        </select>
                    </div>
                    <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                        <input type="number" min="1" ng-model="signups.signups.current_page" class="form-control text-right" ng-model-options='{debounce: 500}' ng-change="signups.updatePage();">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
