<ui-view>
    <div class="row" ng-if="competitions.competitions.id">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Tävlingar')}} | <% competitions.competitions.name %>
                </div>

                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-3">

                            <div style="display: flex; justify-content: center;">
                                <img ng-if="competitions.competitions.pdf_logo !== 'webshooter'" ng-src="<% competitions.competitions.pdf_logo_url %>" class="img-responsive img-thumbnail margin-bottom-20" style="max-height: 100px;">
                            </div>

                            <div class="panel panel-default" @if(!\Auth::user()->is_admin) ng-if="competitions.competitions.user_roles.length @endif">
                                <div class="panel-heading">
                                    {{_('Administration')}}
                                </div>
                                <ul class="nav nav-pills nav-stacked">
                                    <li>
                                        <a ui-sref="competitions.admin.index({competitions_id: competitions.competitions.id})">
                                            {{_('Administrera denna tävling')}}</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div class="panel panel-default">
                                <div class="panel-heading">
                                    {{_('Anmälan')}}
                                </div>
                                <ul class="nav nav-pills nav-stacked">
                                    <li ng-class="{'active': (currentRoute == 'competition.signup')}">
                                        <a ui-sref="competition.signup({id: competitions.competitions.id})">
                                            {{_('Din anmälan')}}
                                        </a>
                                    </li>
                                    <li ng-class="{'active': currentRoute == 'competition.teamsignups'}" ng-if="competitions.competitions.allow_teams">
                                        <a ui-sref="competition.teamsignups({id: competitions.competitions.id})">
                                            {{_('Laganmälan')}}</span>
                                        </a>
                                    </li>
                                    <li ng-class="{'active': currentRoute == 'competition.clubsignups'}">
                                        <a ui-sref="competition.clubsignups({id: competitions.competitions.id})">
                                            {{_('Föreningsanmälan')}}</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <ul class="nav nav-pills nav-stacked" ng-if="competitions.competitions.id">

                                <li ng-class="{'active': currentRoute == 'competition.show' && currentView == 'information'}">
                                    <a ui-sref="competition.show({id: competitions.competitions.id, view:'information'})">
                                        {{_('Information')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute == 'competition.show' && currentView == 'championship'}" ng-if="competitions.competitions.championship.competitions.length">
                                    <a ui-sref="competition.show({id: competitions.competitions.id, view:'championship'})">
                                        {{_('Mästerskap')}}<span class="label label-primary pull-right"><% competitions.competitions.championship.competitions.length %></span>
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute == 'competition.signups'}">
                                    <a ui-sref="competition.signups({id: competitions.competitions.id})">{{_('Anmälningslista')}}</a>
                                </li>

                                <li ng-class="{'active': currentRoute == 'competition.show' && currentView == 'teams'}" ng-if="competitions.competitions.allow_teams">
                                    <a ui-sref="competition.teams({id: competitions.competitions.id})">
                                        {{_('Lag')}}<span class="label label-primary pull-right" ng-if="competitions.competitions.teams_count"><% competitions.competitions.teams_count %></span>
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute == 'competition.show' && currentView == 'patrols'}" @if(!\Auth::user()->is_admin) ng-if="competitions.competitions.patrols_is_public || competitions.competitions.user_roles.length" @endif>
                                    <a ui-sref="competition.show({id: competitions.competitions.id, view:'patrols'})">
                                        <% competitions.competitions.translations.patrols_name_plural | ucfirst %><span class="label label-primary pull-right" ng-if="competitions.competitions.patrols_count"><% competitions.competitions.patrols_count %></span>
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute == 'competition.results'}">
                                    <a ui-sref="competition.results({id: competitions.competitions.id})">
                                        {{_('Resultat')}}
                                    </a>
                                </li>

                                {{--
                                <li ng-class="{'active': currentView == 'contact'}">
                                    <a ui-sref="competition.show({id: competitions.competitions.id, view:'contact'})">
                                        {{_('Kontakt')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentView == 'map'}">
                                    <a ui-sref="competition.show({id: competitions.competitions.id, view:'map'})">
                                        {{_('Karta')}}
                                    </a>
                                </li>
                                --}}
                            </ul>
                        </div>
                        <div class="col-sm-9">
                            <div ui-view="main"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>
