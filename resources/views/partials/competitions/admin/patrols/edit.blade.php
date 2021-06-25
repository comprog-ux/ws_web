<div class="row">
    <style>
        .fullheight {
            height: -webkit-calc(100vh - 200px);
            height: -moz-calc(100vh - 200px);
            height: calc(100vh - 200px);
            overflow-y: auto;
        }
        uib-accordion .panel-heading{
            cursor: pointer;
        }
        .pointer{
            cursor: pointer;
        }
    </style>


    <div class="col-sm-6 col-lg-8" ng-class="{hide: patrols.filter.fullscreen == 'patrols','col-sm-12 col-lg-12': patrols.filter.fullscreen == 'signups'}">
        <div class="panel panel-primary">
            <div class="panel-heading hidden-print">
                <div class="row">
                    <div class="col-sm-6">
                        {{_('Anmälningar')}}
                    </div>
                    <div class="col-sm-6 text-right">
                        {{_('Visar')}} <% signups_current_paged.length %> {{_('av')}} <% signups.length %> {{_('av totalt')}} <% patrols.signups.length %>
                        <i class="fa fa-angle-double-right" ng-class="{'hide': patrols.filter.fullscreen == 'signups'}" ng-click="patrols.filter.fullscreen = 'signups'"></i>
                        <i class="fa fa-angle-double-left" ng-class="{'hide': patrols.filter.fullscreen != 'signups'}" ng-click="patrols.filter.fullscreen = ''"></i>

                    </div>
                </div>
            </div>
            <div class="panel-navigation">
                <div class="row">
                    <div class="col-sm-4 col-lg-3">
                        <select ng-model="patrols.filter.weapongroups_id" ng-options="weapongroup.id as weapongroup.name for weapongroup in competitions.competition.weapongroups" class="form-control input-sm">
                            <option value="">{{_('Välj vapengrupp')}}</option>
                        </select>
                    </div>
                    <div class="col-sm-4 col-lg-3 visible-lg">
                        <select ng-model="patrols.filter.orderby" class="form-control input-sm">
                            <option value="">{{_('Sortera på')}}</option>
                            <option value="clubs_id">{{_('Föreningsnamn')}}</option>
                            <option value="user.fullname">{{_('Namn')}}</option>
                            <option value="user.shooting_card_number">{{_('Pistolskyttekortsnummer')}}</option>
                            <option value="created_at">{{_('Tidpunkt för anmälan')}}</option>
                        </select>
                    </div>
                    <div class="col-sm-4 col-lg-3">
                        <input ng-model="patrols.filter.shooting_card_number" class="form-control input-sm" placeholder="{{_('Sök på pistolskyttekortsnummer')}}">
                    </div>
                    <div class="col-sm-4 col-lg-3 text-right">
                        <button class="btn btn-sm btn-block btn-default" ng-click="patrols.filter.show = !patrols.filter.show" ng-class="{'hide':patrols.filter.show}">{{_('Visa filter')}}</button>
                        <button class="btn btn-sm btn-block btn-default" ng-click="patrols.filter.show = !patrols.filter.show" ng-class="{'hide':!patrols.filter.show}">{{_('Göm filter')}}</button>
                    </div>
                </div>
            </div>
            <div class="panel-body" ng-class="{'hide': !patrols.filter.show}">
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Antal per sida')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.per_page" ng-options="n for n in [10,15,30,50,100]" class="form-control input-sm"> </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Vapengrupp')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.weapongroups_id" ng-options="weapongroup.id as weapongroup.name for weapongroup in competitions.competition.weapongroups" class="form-control input-sm">
                            <option value="">{{_('Välj vapengrupp')}}</option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Sortering')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.orderby" class="form-control input-sm">
                            <option value="">{{_('Sortera på')}}</option>
                            <option value="clubs_id">{{_('Föreningsnamn')}}</option>
                            <option value="user.fullname">{{_('Namn')}}</option>
                            <option value="user.shooting_card_number">{{_('Pistolskyttekortsnummer')}}</option>
                            <option value="created_at">{{_('Tidpunkt för anmälan')}}</option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Pistol kort nr')}}</div>
                    <div class="col-sm-7"><input ng-model="patrols.filter.shooting_card_number" class="form-control input-sm" placeholder="{{_('Sök på pistolskyttekortsnummer')}}"></div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Dela %s med', '<% competitions.competition.translations.patrols_name_singular %>')}}</div>
                    <div class="col-sm-7"><input ng-model="patrols.filter.share_patrol_with" class="form-control input-sm" placeholder="{{_('Sök på pistolskyttekortsnummer')}}"></div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Start gärna före')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.start_before" class="form-control input-sm">
                            <option value="00:00:00">{{_('Filtrera ej')}}</option>
                            <option value="08:00:00">08:00</option>
                            <option value="09:00:00">09:00</option>
                            <option value="10:00:00">10:00</option>
                            <option value="11:00:00">11:00</option>
                            <option value="12:00:00">12:00</option>
                            <option value="13:00:00">13:00</option>
                            <option value="14:00:00">14:00</option>
                            <option value="15:00:00">15:00</option>
                            <option value="16:00:00">16:00</option>
                            <option value="17:00:00">17:00</option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Start gärna efter')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.start_after" class="form-control input-sm">
                            <option value="00:00:00">{{_('Filtrera ej')}}</option>
                            <option value="08:00:00">08:00</option>
                            <option value="09:00:00">09:00</option>
                            <option value="10:00:00">10:00</option>
                            <option value="11:00:00">11:00</option>
                            <option value="12:00:00">12:00</option>
                            <option value="13:00:00">13:00</option>
                            <option value="14:00:00">14:00</option>
                            <option value="15:00:00">15:00</option>
                            <option value="16:00:00">16:00</option>
                            <option value="17:00:00">17:00</option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Första/Sista %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.first_last_patrol" class="form-control input-sm">
                            <option value="">{{_('Filtrera ej')}}</option>
                            <option value="first">{{_('Första %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</option>
                            <option value="last">{{_('Sista %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</option>
                        </select>
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-5">{{_('Eventuell krock')}}</div>
                    <div class="col-sm-7">
                        <select ng-model="patrols.filter.possible_collision" class="form-control input-sm">
                            <option value="">{{_('Filtrera ej')}}</option>
                            <option value="yes">{{_('Ja')}}</option>
                            <option value="no">{{_('Nej')}}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="fullheight margin-top-25">
                <div class="container-fluid">
                    <div class="row"
                        ng-repeat-start="signup in signups = (patrols.signups
                            | filter:{weaponclass:{weapongroups_id:(patrols.filter.weapongroups_id|num)||undefined}}:true
                            | filter:{user:{shooting_card_number:patrols.filter.shooting_card_number||undefined}}
                            | filter:{share_patrol_with:patrols.filter.share_patrol_with}
                            | filter:{start_before: patrols.filter.start_before}
                            | filter:{start_after: patrols.filter.start_after}:patrols.filterStartAfter
                            | filter:{start_before: patrols.filter.start_before}:patrols.filterStartBefore
                            | filter:{first_last_patrol: patrols.filter.first_last_patrol||undefined}
                            | filter:patrols.filterPossibleCollision
                            | orderBy:[patrols.filter.orderby])
                            | limitTo:patrols.filter.per_page:(patrols.filter.current_page-1)*patrols.filter.per_page as signups_current_paged
                            "
                        >
                        <div class="col-sm-9">
                            <div class="row">
                                <div class="col-xs-3 col-sm-2" ng-click="patrols.associateSignupWithPatrol(patrols.active_patrol_id, signup);"><% signup.user.shooting_card_number %></div>
                                <div class="col-xs-4 col-sm-5" ng-click="patrols.associateSignupWithPatrol(patrols.active_patrol_id, signup);"><% signup.user.fullname %> (<% (competitions.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %>)</div>
                                <div class="col-xs-4 col-sm-5" ng-click="patrols.associateSignupWithPatrol(patrols.active_patrol_id, signup);"><% signup.club.name %></div>
                            </div>
                        </div>
                        <div class="col-xs-6 col-xs-offset-6 col-sm-3 col-sm-offset-0">
                            <div class="row">
                                <div class="col-xs-4 text-right padding-left-5 padding-right-5">
                                    <select ng-class="{'hide': patrols.active_patrol_id}" ng-model="signup.patrols_id" ng-options="patrol.id as (patrols.patrols.indexOf(patrol)+1)+' ('+(patrol.start_time_human)+')'+' '+patrol.signups.length+'/'+patrol.patrol_size for patrol in patrols.patrols | orderBy:'start_time'" class="form-control input-sm"></select>
                                </div>
                                <div class="col-xs-4 text-right padding-left-5 padding-right-5">
                                    <select ng-model="signup.lane" ng-class="{'hide':((!patrols.active_patrol_id && !signup.patrols_id) || patrols.active_patrol_id)}" ng-options="n for n in (patrols.patrols | filter:{id:signup.patrols_id}:true)[0].available_lanes" class="form-control input-sm"></select>
                                    <select ng-model="signup.lane" ng-class="{'hide':((!patrols.active_patrol_id && !signup.patrols_id) || signup.patrols_id)}" ng-options="n for n in (patrols.patrols | filter:{id:patrols.active_patrol_id}:true)[0].available_lanes" class="form-control input-sm"></select>
                                </div>
                                <div class="col-xs-4 text-right padding-left-5 padding-right-5">
                                    <button class="btn btn-sm btn-default" ng-class="{'hide': patrols.active_patrol_id}" ng-click="patrols.associateSignupWithPatrol(signup.patrols_id, signup);"><i class="fa fa-angle-right"></i></button>
                                    <button class="btn btn-sm btn-default" ng-class="{'hide':!patrols.active_patrol_id}" ng-click="patrols.associateSignupWithPatrol(patrols.active_patrol_id, signup);"><i class="fa fa-angle-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-12">
                            <small>
                                <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" tooltip-append-to-body="true" tooltip-placement="top-left" class="label label-default" ng-if="signup.special_wishes"><i class="fa fa-fw fa-question-circle"></i></span>
                                <span uib-tooltip-html="signup.note | renderHTMLCorrectly" tooltip-placement="top-left" tooltip-append-to-body="true" class="label label-default" ng-if="signup.note"><i class="fa fa-fw fa-comment"></i></span>
                                <span class="label label-danger" ng-if="!signup.invoices_id">{{_('Ej betald')}}</span>
                                <span class="label label-default" ng-if="signup.start_after != '00:00:00'">{{_('Efter')}} <% signup.start_after %></span>
                                <span class="label label-primary" ng-if="signup.share_patrol_with"><i class="fa fa-user-plus"></i> <% signup.share_patrol_with %></span>
                                <span class="label label-danger" ng-if="signup.share_weapon_with"><i class="fa fa-user-times"></i> <% signup.share_weapon_with %></span>
                                <span class="label label-danger" ng-if="signup.shoot_not_simultaneously_with"><i class="fa fa-ban"></i> <% signup.shoot_not_simultaneously_with %></span>
                                <span class="label label-default" ng-if="signup.start_before && signup.start_before != '00:00:00'">{{_('Före')}} <% signup.start_before %></span>
                                <span class="label label-default" ng-if="signup.first_last_patrol == 'last'">{{_('Sista %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</span>
                                <span class="label label-default" ng-if="signup.first_last_patrol == 'first'">{{_('Första %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</span>
                                <span class="label label-default" ng-if="signup.participate_out_of_competition">{{_('Deltar utom tävlan')}}</span>
                                <span class="label label-default" ng-if="signup.exclude_from_standardmedal">{{_('Exludera från standardmedalj')}}</span>
                                <span class="label label-warning margin-right-5" ng-class="{'label-danger': colliding_signup.patrols_id}" ng-repeat="colliding_signup in signup.colliding_signups">
                                    <span ng-if="colliding_signup.start_time"><% colliding_signup.start_time_human %>-<% colliding_signup.end_time_human %> </span>(<% (competitions.competition.championships_id) ? colliding_signup.weaponclass.classname_general : colliding_signup.weaponclass.classname %>)
                                </span>
                                <span class="label label-warning margin-right-5" ng-repeat="possible_final in signup.possible_finals"><% possible_final.competition.final_time_human %> final (<% (competitions.competition.championships_id) ? possible_final.weaponclass.classname_general : possible_final.weaponclass.classname %>)</span>
                            </small>
                        </div>
                    </div>
                    <hr ng-repeat-end>
                </div>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div uib-pagination
                                total-items="patrols.signups.length"
                                ng-model="patrols.filter.current_page"
                                items-per-page="patrols.filter.per_page"
                                max-size="5"
                                class="margin-0"
                                boundary-links="true"
                                rotate="false"
                                first-text="{{_('Första')}}"
                                last-text="{{_('Sista')}}"
                                next-text="{{_('&raquo;')}}"
                                previous-text="{{_('&laquo;')}}"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-lg-4" ng-class="{'col-sm-12 col-lg-12': patrols.filter.fullscreen == 'patrols','hide': patrols.filter.fullscreen == 'signups'}">
        <div class="panel panel-primary">
            <div class="panel-heading hidden-print">
                <div class="row">
                    <div class="col-sm-4">
                        <i class="fa fa-angle-double-left" ng-class="{'hide': patrols.filter.fullscreen == 'patrols'}" ng-click="patrols.filter.fullscreen = 'patrols'"></i>
                        <i class="fa fa-angle-double-right" ng-class="{'hide': patrols.filter.fullscreen != 'patrols'}" ng-click="patrols.filter.fullscreen = ''"></i>
                        <% competitions.competition.translations.patrols_name_plural | ucfirst %> (<% patrols.patrols.length %>) {{_('st')}}
                    </div>
                    <div class="col-sm-8 text-right">
                        <% competitions.competition.translations.patrols_lane_singular | ucfirst %> <% lanes = (patrols.patrols | sumTotalLength:'signups') %> {{_('av')}} <% total_patrol_size = (patrols.patrols | sumByKey:'patrol_size') %> (<% total_patrol_size - lanes %> {{_('lediga')}})
                    </div>
                </div>
            </div>
            <div class="panel-navigation text-right">
                <button class="btn btn-sm btn-default" ng-click="patrols.createPatrol();">{{_('Lägg till %s','<% competitions.competition.translations.patrols_name_singular %>')}}</button>
                <button class="btn btn-sm btn-default" ng-click="patrols.generatePatrols();">{{_('Generera %s','<% competitions.competition.translations.patrols_name_plural %>')}}</button>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{_('Avancerad')}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right">
                        <li><a ng-click="patrols.downloadPatrolsList(competitions.competition);">{{_('Ladda ner %s','<% competitions.competition.translations.patrols_list_plural %>')}}</a></li>
                        <li><a ng-click="patrols.deleteAllPatrols();">{{_('Radera alla %s','<% competitions.competition.translations.patrols_name_plural %>')}}</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="alert alert-info" ng-if="!patrols.patrols.length">
            {{_('Denna tävling har inte några %s ännu.','<% competitions.competition.translations.patrols_name_plural %>')}}
            <button class="btn btn-xs btn-default" ng-click="patrols.createPatrol();">{{_('Lägg till %s','<% competitions.competition.translations.patrols_name_singular %>')}}</button>
        </div>

        <script type="text/ng-template" id="patrol-template.html">
            <div class="panel <% panelClass || 'panel-default' %>" ng-class="{'panel-primary':isOpen}">
                <div class="panel-heading">
                    <span href tabindex="0" class="accordion-toggle" ng-click="toggleOpen(panel-id)" uib-accordion-transclude="heading">
                        <span uib-accordion-header ng-class="{'text-muted': isDisabled}">
                          <% heading %>
                        </span>
                    </span>
                </div>
                <div class="panel-collapse collapse" uib-collapse="!isOpen">
                    <div ng-transclude></div>
                </div>
            </div>
        </script>
        <div class="fullheight">
        <uib-accordion close-others="true">
            <div uib-accordion-group ng-repeat="patrol in patrols.patrols | orderBy:'start_time'" template-url="patrol-template.html">
                <uib-accordion-heading>
                    <div class="row" ng-click="patrols.setActivePatrol(patrol.id);">
                        <div class="col-xs-1 padding-top-5">
                            <i class="fa fa-2x fa-check-square-o" ng-if="patrols.active_patrol_id == patrol.id"></i>
                            <i class="fa fa-2x fa-square-o text-white" ng-if="patrols.active_patrol_id != patrol.id"></i>
                        </div>
                        <div class="col-xs-6">
                            <% competitions.competition.translations.patrols_name_singular | ucfirst %>: #<% $index+1 %><br>
                            {{_('Tid')}}: <% patrol.start_time_human %>-<% patrol.end_time_human %>
                        </div>
                        <div class="col-xs-5 text-right">
                            <span class="label" ng-class="{'label-success':patrol.signups.length == patrol.patrol_size, 'label-default':!patrol.signups.length, 'label-warning':(patrol.signups.length && (patrol.signups.length < patrol.patrol_size)), 'label-danger':(patrol.signups.length && (patrol.signups.length > patrol.patrol_size))}"><% patrol.signups.length %>/<% patrol.patrol_size %></span><br>
                            <span class="label label-default margin-left-5" ng-repeat="weaponclass in patrol.signups | unique:'weaponclasses_id'"><% (competitions.competition.championships_id) ? weaponclass.weaponclass.classname_general : weaponclass.weaponclass.classname %></span>
                        </div>
                    </div>
                </uib-accordion-heading>

                <div class="panel-navigation">
                    <button class="btn btn-xs btn-default" ng-click="patrols.openPatrolEditModal(patrol, competitions.competition);">{{_('Redigera')}}</button>
                    <button class="btn btn-xs btn-danger" ng-click="patrols.deletePatrol(patrol);">{{_('Radera')}}</button>
                    <button class="btn btn-xs btn-danger" ng-click="patrols.emptyPatrol(patrol);">{{_('Töm')}}</button>
                </div>
                <ul class="list-group margin-bottom-0">
                    <li class="list-group-item " ng-if="!patrol.signups.length">
                        {{_('%s är tom', '<% competitions.competition.translations.patrols_name_singular | ucfirst %>')}}
                    </li>
                    <li class="list-group-item" ng-repeat="signup in patrol.signups | orderBy:['!lane','lane']">
                        <div class="row">
                            <div class="col-xs-2">
                                #<% signup.lane %>
                                <select ng-model="signup.new_lane" ng-options="n for n in (patrols.patrols | filter:{id:signup.patrols_id}:true)[0].available_lanes" class="form-control" ng-change="patrols.updateSignupLane(signup);"></select>
                            </div>
                            <div class="col-xs-8">
                                <% signup.user.shooting_card_number %> <% signup.user.fullname %> (<% (competitions.competition.championships_id) ? signup.weaponclass.classname_general : signup.weaponclass.classname %>) <small class="text-muted"><% signup.club.name %></small>
                                <div class="row">
                                    <div class="col-xs-12">
                                        <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" tooltip-append-to-body="true" tooltip-placement="top-left" class="label label-default" ng-if="signup.special_wishes"><i class="fa fa-fw fa-question-circle"></i></span>
                                        <span uib-tooltip-html="signup.note | renderHTMLCorrectly" tooltip-append-to-body="true" tooltip-placement="top-left" class="label label-default" ng-if="signup.note"><i class="fa fa-fw fa-comment"></i></span>

                                        <span class="label label-default" ng-if="signup.start_after != '00:00:00'">{{_('Efter')}} <% signup.start_after %></span>
                                        <span class="label label-danger" ng-if="!signup.invoices_id">{{_('Ej betald')}}</span>
                                        <span class="label label-primary pointer" ng-if="signup.share_patrol_with" ng-click="patrols.sharePatrolWith(signup.patrols_id, signup.share_patrol_with);"><i class="fa fa-user-plus"></i> <% signup.share_patrol_with %></span>
                                        <span class="label label-danger" ng-if="signup.share_weapon_with"><i class="fa fa-user-times"></i> <% signup.share_weapon_with %></span>
                                        <span class="label label-danger" ng-if="signup.shoot_not_simultaneously_with"><i class="fa fa-ban"></i> <% signup.shoot_not_simultaneously_with %></span>
                                        <span class="label label-default" ng-if="signup.start_before && signup.start_before != '00:00:00'">{{_('Före')}} <% signup.start_before %></span>
                                        <span class="label label-default" ng-if="signup.first_last_patrol == 'last'">{{_('Sista %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</span>
                                        <span class="label label-default" ng-if="signup.first_last_patrol == 'first'">{{_('Första %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</span>
                                        <span class="label label-default" ng-if="signup.participate_out_of_competition">{{_('Deltar utom tävlan')}}</span>
                                        <span class="label label-default" ng-if="signup.exclude_from_standardmedal">{{_('Exludera från standardmedalj')}}</span>

                                        <span class="label label-warning margin-right-5" ng-class="{'label-danger': colliding_signup.patrols_id}" ng-repeat="colliding_signup in signup.colliding_signups">
                                            <span ng-if="colliding_signup.start_time"><% colliding_signup.start_time_human %>-<% colliding_signup.end_time_human %> </span><% colliding_signup.competition.name %> (<% (competitions.competition.championships_id) ? colliding_signup.weaponclass.classname_general : colliding_signup.weaponclass.classname %>)
                                        </span>
                                        <span class="label label-warning" ng-repeat="possible_final in signup.possible_finals"><% possible_final.competition.final_time_human %> final <% possible_final.competition.name %> (<% (competitions.competition.championships_id) ? possible_final.weaponclass.classname_general : possible_final.weaponclass.classname %>)</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xs-2 text-right">
                                <button class="btn btn-sm btn-default" ng-click="patrols.dissociateSignupWithPatrol(patrol, signup);"><i class="fa fa-trash-o"></i></button>
                            </div>
                        </div>
                    </li>
                </ul>

            </div>
        </uib-accordion>
        </div>
    </div>
</div>

<script type="text/ng-template" id="PatrolEditModal.html">

    <div class="modal-header">
        <h3 class="modal-title">{{_('Redigera')}}</h3>
    </div>

    <div class="modal-body">
        <div class="row">
            <div class="col-sm-6">
                <div class="panel panel-primary">
                    <div class="panel-heading">{{_('Tävlingsinformation')}}</div>
                    <div class="panel-body">
                        <table class="table table-bordered">
                            <tbody>
                            <tr>
                                <td>{{_('Datum')}}</td>
                                <td><% modalcontroller.competition.date %></td>
                            </tr>
                            <tr>
                                <td>{{_('Tävlingsgrupp')}}</td>
                                <td><% (modalcontroller.competition.championship.name) ? modalcontroller.competition.championship.name : '-' %></td>
                            </tr>
                            <tr>
                                <td><% modalcontroller.competition.translations.patrols_size | ucfirst%></td>
                                <td><% modalcontroller.competition.patrol_size %></td>
                            </tr>
                            <tr>
                                <td>{{_('Start tid')}}</td>
                                <td><% modalcontroller.competition.start_time %></td>
                            </tr>
                            <tr>
                                <td>{{_('Final tid')}}</td>
                                <td><% modalcontroller.competition.final_time %></td>
                            </tr>
                            <tr>
                                <td>{{_('Längd')}}</td>
                                <td><% modalcontroller.competition.patrol_time %></td>
                            </tr>
                            <tr>
                                <td>{{_('Rast')}}</td>
                                <td><% modalcontroller.competition.patrol_time_rest %></td>
                            </tr>
                            <tr>
                                <td>{{_('Intervall')}}</td>
                                <td><% modalcontroller.competition.patrol_time_interval %></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="panel panel-primary">
                    <div class="panel-heading"><% competitions.competition.translations.patrols_name_singular | ucfirst %></div>
                    <div class="panel-body">
                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label><% competitions.competition.translations.patrols_lane_plural | ucfirst %></label>
                            </div>
                            <div class="col-sm-8">
                                <div class="input-group">
                                    <input type="tel" ng-model="modalcontroller.patrol.patrol_size" class="form-control" aria-label="<% competitions.competition.translations.patrols_lane_plural | ucfirst %>">
                                    <span class="input-group-addon">{{_('st')}}</span>
                                </div>
                            </div>
                        </div>
                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Start')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <div uib-timepicker ng-model="modalcontroller.patrol.start_time" mousewheel="false" hour-step="1" minute-step="1" show-meridian="ismeridian" ng-change="modalcontroller.changeTime('start')"></div>
                            </div>
                        </div>

                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Längd')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <select class="form-control" ng-model="modalcontroller.patrol.length_time" ng-options="n for n in [] | range:1:24" ng-change="modalcontroller.changeTime('length')"></select>
                            </div>
                        </div>

                        <div class="row form-group">
                            <div class="col-sm-4">
                                <label>{{_('Slut')}}</label>
                            </div>
                            <div class="col-sm-8">
                                <div uib-timepicker ng-model="modalcontroller.patrol.end_time" hour-step="1" mousewheel="false" minute-step="1" show-meridian="ismeridian" ng-change="modalcontroller.changeTime('end')"></>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">Cancel</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.updatePatrol(modalcontroller.patrol)">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</script>