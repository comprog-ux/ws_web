<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Dina Anmälningar')}}
                </div>
                <div class="panel-body">
                    <div class="row hide" ng-class="{'show': !signups.signups.length}">
                        <div class="col-sm-12">
                            <h2>{{_('Det finns inga aktuella anmälningar för dig.')}}</h2>
                            <p>{{_('Du anmäler dig genom att registrera dig under tävlingar.')}}</p>
                            <a ui-sref="competitions" class="btn btn-primary">{{_('Visa tävlingar')}}</a>
                            
                        </div>
                    </div>

                    <div class="alert alert-info hide" ng-class="{'show': signups.invoices_generate.length}">
                        <div class="row">
                            <div class="col-sm-8">
                                {{_('Du kan generera en eller flera fakturor för några av dina anmälningar.')}}
                            </div>
                            <div class="col-sm-4 text-right">
                                <a ui-sref="invoices.generate" class="btn btn-primary margin-0">{{_('Generera fakturor')}}</a>
                            </div>
                        </div>
                    </div>

                    <div class="row hide" ng-class="{'show': signups.signups.length}">
                        <div class="col-sm-12">
                            <div class="table-responsive">
                            <table class="table table-hover table-striped">
                                <thead>
                                    <tr>
                                        <th>{{_('Datum')}}</th>
                                        <th>{{_('Tävling')}}</th>
                                        <th>{{_('Patrull/Skjutlag')}}</th>
                                        <th>{{_('Lag')}}</th>
                                        <th>{{_('Placering')}}</th>
                                        <th>{{_('Vapengrupp')}}</th>
                                        <th>{{_('Avgift')}}</th>
                                        <th>{{_('Önskemål')}}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr ng-repeat="signup in signups.signups">
                                        <td ui-sref="signup({id: signup.id})" class="text-nowrap"><% signup.competition.date %></td>
                                        <td><a ui-sref="competition.show({id: signup.competition.id, view: 'information'})"><% signup.competition.name %> i <% signup.competition.contact_city %></a></td>
                                        <td>
                                            <a ng-if="signup.patrols_id && signup.competition.patrols_is_public" ui-sref="competition.patrols({id: signup.competition.id,'patrols_id':signup.patrols_id})">
                                                #<% signup.patrol.sortorder %>
                                                (<% signup.start_time_human %>)
                                            </span>
                                            <span ng-if="!signup.competition.patrols_is_public">---</span>
                                        </td>
                                        <td>
                                            <a ng-repeat="team in signup.team" ui-sref="competition.teams({id: signup.competition.id,'teams_id':team.id})">
                                                <% team.name %> (<% team.pivot.position %>)
                                            </a>

                                        </td>
                                        <td>
                                            <a ng-if="signup.results_placements" ui-sref="competition.results({id: signup.competition.id,'signups_id':signup.id})">
                                                #<% signup.results_placements.placement %>
                                            </a>
                                        </td>
                                        <td ui-sref="signup({id: signup.id})"><% signup.weaponclass.classname %></td>
                                        <td ui-sref="signup({id: signup.id})"><% signup.registration_fee %></td>
                                        <td ui-sref="signup({id: signup.id})">
                                            <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" class="label label-primary" ng-if="signup.special_wishes">{{_('Önskemål')}}</span>
                                            <span ng-if="!signup.special_wishes">-</span>
                                        </td>
                                        <td class="text-right"><a ui-sref="signup({id: signup.id})" class="btn btn-primary btn-sm">Visa</a></td>
                                    </tr>
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>