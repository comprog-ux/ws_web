<ui-view>

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
                            <select ng-model="signups.signups.competitions_id" ng-change="signups.updatePage()" ng-options="competition.id as competition.date+' '+competition.name for competition in signups.competitions" class="form-control">
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
                <% signups_filter_active %>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped ">
                        <thead>
                        <tr>
                            <th>{{_('ID')}}</th>
                            <th>{{_('Datum')}}</th>
                            <th>{{_('Tävling')}}</th>
                            <th>{{_('Användare')}}</th>
                            <th>{{_('Förening')}}</th>
                            <th>{{_('Faktura')}}</th>
                            <th>{{_('Önskemål')}}</th>
                            <th>{{_('Kommentar')}}</th>
                            <th class="text-right">{{_('Vapengrupp')}}</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr ng-repeat="signup in signups.signups.data"  ui-sref="admin.signups.show({signup_id:signup.id})">
                            <td><% signup.id %></td>
                            <td><% signup.competition.date %></td>
                            <td><% signup.competition.name %></td>
                            <td><a ui-sref="admin.users.show({user_id:signup.user.user_id})"><% signup.user.fullname %> (<% signup.user.shooting_card_number %>)</a></td>
                            <td><a ui-sref="admin.clubs.show({id:signup.clubs_id})"><% signup.club.name %></a></td>
                            <td><a ui-sref="admin.invoices.show({id:signup.invoices_id})"><% signup.invoice.invoice_reference %></a></td>
                            <td>
                                <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" class="label label-primary" ng-if="signup.special_wishes">{{_('Önskemål')}}</span>
                                <span ng-if="!signup.special_wishes">-</span>
                            </td>
                            <td>
                                <span uib-tooltip-html="signup.note | renderHTMLCorrectly" class="label label-primary" ng-if="signup.note">{{_('Kommentar')}}</span>
                                <span ng-if="!signup.note">-</span>
                            </td>
                            <td class="text-right">
                                <span class="label label-default margin-right-5"><% signup.weaponclass.classname %></span>
                            </td>
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
</ui-view>
