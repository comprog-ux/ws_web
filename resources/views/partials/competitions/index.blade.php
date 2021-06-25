<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-xs-6">{{_('Tävlingar')}}</div>
                        <div class="col-xs-6 text-right"><% competitions.competitions.total %> st</div>
                    </div>
                </div>

                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-3 col-xs-6">
                            <select ng-model="competitions.competitions.type"
                                    class="form-control"
                                    ng-options="type.id as type.name for type in competitions.competitions.competitiontypes"
                                    ng-change="competitions.updatePage();">
                                <option value="">{{_('Alla')}}</option>
                            </select>
                        </div>
                        <div class="col-sm-3 col-xs-6">
                            <select ng-model="competitions.competitions.status"
                                    class="form-control"
                                    ng-change="competitions.updatePage();">
                                <option value="all">{{_('Alla')}}</option>
                                <option value="open">{{_('Öppen för anmälan')}}</option>
                                <option value="upcoming">{{_('Kommande')}}</option>
                                <option value="closed">{{_('Anmälan stängd')}}</option>
                                <option value="completed">{{_('Avslutad')}}</option>
                            </select>
                        </div>
                        <div class="col-sm-3 col-xs-12 col-sm-offset-3 hidden-xs">
                            <div class="input-group">
                                <input type="text" ng-model="competitions.competitions.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 1000}' ng-change="competitions.updatePage();">
                                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                    <div class="row visible-xs margin-top-10">
                        <div class="col-sm-3 col-xs-12 col-sm-offset-3">
                            <div class="input-group">
                                <input type="text" ng-model="competitions.competitions.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search" ng-model-options='{debounce: 1000}' ng-change="competitions.updatePage();">
                                <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="container-fluid visible-xs">
                    <hr>
                    <div class="grid-striped">
                        <div class="row" ui-sref="competition.show({id: competition.id, view: 'information'})" ng-repeat="competition in competitions.competitions.data">
                            <div class="col-sm-12 padding-left-10 padding-top-15 padding-right-10 padding-bottom-15">
                                <div class="container-fluid">
                                    <div class="row">
                                        <h4 class="text-uppercase margin-0"><% competition.name %></h4>
                                        <span ng-if="competition.championship"><% (competition.championship.name) ? competition.championship.name : '-' %></span>
                                        <div class="row">
                                            <div class="col-xs-6"><% competition.date %></div>
                                            <div class="col-xs-6 text-right"><% competition.signups_count %> {{_('anmälda')}}</div>
                                        </div>
                                        <div class="row">
                                            <div class="col-xs-6"><% competition.competitiontype.name %></div>
                                            <div class="col-xs-6 text-right"><% competition.status_human %></div>
                                        </div>
                                        <div><span ng-repeat="weapongroup in competition.weapongroups" class="label label-default margin-right-5 inline-block"><% weapongroup.name %></span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive  hidden-xs" ng-if="competitions.competitions.total">
                    <table class="table table-hover table-bordered table-striped ">
                        <thead>
                            <tr>
                                <th>{{_('Datum')}}</th>
                                <th>{{_('Tävling')}}</th>
                                <th>{{_('Status')}}</th>
                                <th>{{_('Mästerskap')}}</th>
                                <th>{{_('Typ av tävling')}}</th>
                                <th>{{_('Ort/stad')}}</th>
                                <th>{{_('Vapengrupper')}}</th>
                                <th>{{_('Anmäld')}}</th>
                                <th>{{_('Anmälningar')}}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="competition.show({id: competition.id, view: 'information'})" ng-repeat="competition in competitions.competitions.data">
                                <td class="text-nowrap"><% competition.date %></td>
                                <td><% competition.name %></td>
                                <td><% competition.status_human %></td>
                                <td><% (competition.championship.name) ? competition.championship.name : '-' %></td>
                                <td><% competition.competitiontype.name %></td>
                                <td><% competition.contact_city %></td>
                                <td><span ng-repeat="weapongroup in competition.weapongroups" class="label label-default margin-right-5 inline-block"><% weapongroup.name %></span></td>
                                <td>
                                    <span ng-repeat="weaponclass in competition.weaponclasses">
                                        <a ui-sref="signup({id: signup.id})" class="label label-primary margin-right-5" ng-repeat="signup in usersignups = (competition.usersignups | filter:{weaponclasses_id: weaponclass.id}: true)"><% (competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></a>
                                    </span>
                                </td>
                                <td class="text-right">
                                    <% competition.signups_count %>
                                </td>
                                <td><a ui-sref="competition.show({id: competition.id, view: 'information'})" class="btn btn-primary btn-xs">Visa</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="panel-body" ng-if="!competitions.competitions.total">
                    <div class="alert alert-info">
                        {{_('Din aktuella sökning matchar inte någon tävling.')}}
                    </div>
                </div>

                <div class="panel-footer" ng-if="competitions.competitions.total">
                    <div class="row">
                        <div class="col-lg-10 col-md-8 col-sm-8 col-xs-6">
                            <div uib-pagination
                                    total-items="competitions.competitions.total"
                                    ng-model="competitions.competitions.current_page"
                                    items-per-page="competitions.competitions.per_page"
                                    max-size="5"
                                    ng-change="competitions.updatePage()"
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
                            <select ng-model="competitions.competitions.per_page" ng-options="n for n in [5,10,25,50,100]" class="form-control text-right" ng-change="competitions.updatePage();">
                            </select>
                        </div>
                        <div class="col-lg-1 col-md-2 col-sm-2 col-xs-3">
                            <input type="number" min="1" ng-model="competitions.competitions.current_page" class="form-control text-right" ng-model-options='{debounce: 1500}' ng-change="competitions.updatePage();">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>
