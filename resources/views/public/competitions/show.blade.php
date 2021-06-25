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
                            
                            <ul class="nav nav-pills nav-stacked" ng-if="competitions.competitions.id">


                                <li>
                                    <a ui-sref="public.competitions.show({id: competitions.competitions.id})">
                                        {{_('Information')}}
                                    </a>
                                </li>

                                <li>
                                    <a ui-sref="public.competitions.show.signups({id: competitions.competitions.id})">
                                        {{_('Anmälningslista')}}
                                    </a>
                                </li>

                                <li>
                                    <a ui-sref="public.competitions.show.teams({id: competitions.competitions.id})" ng-if="competitions.competitions.allow_teams">
                                        {{_('Lag')}}<span class="label label-primary pull-right" ng-if="competitions.competitions.teams_count"><% competitions.competitions.teams_count %></span>
                                    </a>
                                </li>

                                <li>
                                    <a ui-sref="public.competitions.show.patrols({id: competitions.competitions.id})">
                                        {{_('Patruller')}}<span class="label label-primary pull-right" ng-if="(competitions.competitions.patrols_is_public || competitions.competitions.user_roles.length) && competitions.competitions.patrols_count"><% competitions.competitions.patrols_count %></span>
                                    </a>
                                </li>

                                <li>
                                    <a ui-sref="public.competitions.show.results({id: competitions.competitions.id})">
                                        {{_('Resultat')}}
                                    </a>
                                </li>
                                {{--

                                <li ng-class="{'active': currentView == 'result'}">
                                    <a ui-sref="competitions.show({id: competitions.competitions.id, view:'result'})">
                                        {{_('Resultat')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentView == 'contact'}">
                                    <a ui-sref="competitions.show({id: competitions.competitions.id, view:'contact'})">
                                        {{_('Kontakt')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentView == 'map'}">
                                    <a ui-sref="competitions.show({id: competitions.competitions.id, view:'map'})">
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
