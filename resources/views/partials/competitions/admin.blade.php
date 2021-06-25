<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading hidden-print">
                {{_('Administrera tävling')}} | <% competitions.competition.date %> <% competitions.competition.name %> i <% competitions.competition.contact_city %>
            </div>

            <div class="panel-navigation">
                <a ui-sref="competitions.admin.close({competitions_id: competitions.competition.id})" class="btn btn-danger btn-outline pull-right hide" ng-class="{'show': !competitions.competition.closed_at}">{{_('Stäng tävling...')}}</a>

                <a ui-sref="competition.show({id: competitions.competition.id, view: 'information'})" class="btn btn-default">{{_('Visa tävling')}}</a>
                <a ui-sref="competitions.admin.index({competitions_id: competitions.competition.id})" class="btn btn-default">{{_('Översikt')}}</a>

                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" ng-class="{'disabled': competitions.competition.closed_at}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{_('Redigera tävling')}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right">
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.information')}">
                            <a ui-sref="competitions.admin.edit.information({competitions_id:competitions.competition.id})">
                                {{_('Information')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.contact')}">
                            <a ui-sref="competitions.admin.edit.contact({competitions_id:competitions.competition.id})">
                                {{_('Kontaktuppgifter')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.status')}">
                            <a ui-sref="competitions.admin.edit.status({competitions_id:competitions.competition.id})">
                                {{_('Visningsstatus')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.date')}">
                            <a ui-sref="competitions.admin.edit.date({competitions_id:competitions.competition.id})">
                                {{_('Datum & tid')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.signup')}">
                            <a ui-sref="competitions.admin.edit.signup({competitions_id:competitions.competition.id})">
                                {{_('Anmälan')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.admins')}">
                            <a ui-sref="competitions.admin.edit.admins({competitions_id:competitions.competition.id})">
                                {{_('Administratörer')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.weaponclasses')}">
                            <a ui-sref="competitions.admin.edit.weaponclasses({competitions_id:competitions.competition.id})">
                                {{_('Vapengrupper')}}
                            </a>
                        </li>
                        <li ng-class="{'active': (currentRoute == 'competitions.admin.edit.stations')}">
                            <a ui-sref="competitions.admin.edit.stations({competitions_id:competitions.competition.id})">
                                <% competitions.competition.translations.stations_name_plural | ucfirst %>
                            </a>
                        </li>
                    </ul>
                </div>

                <a ui-sref="competitions.admin.signups.index({competitions_id: competitions.competition.id})" class="btn btn-default" ng-class="{'disabled': competitions.competition.closed_at}">{{_('Anmälningar')}}</a>
                <a ui-sref="competitions.admin.teamsignups.index({competitions_id: competitions.competition.id})" class="btn btn-default" ng-class="{'disabled': competitions.competition.closed_at}">{{_('Laganmälningar')}}</a>
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" ng-class="{'disabled': competitions.competition.closed_at}">
                        <% competitions.competition.translations.patrols_name_plural | ucfirst %> <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right">
                        <li><a ui-sref="competitions.admin.patrols.index({competitions_id: competitions.competition.id})">{{_('Grundomgång')}}</a></li>
                        <li><a ui-sref="competitions.admin.patrols.edit({competitions_id: competitions.competition.id})">{{_('Redigera grundomgång')}}</a></li>
                        <li><a ui-sref="competitions.admin.patrols.finals({competitions_id: competitions.competition.id})" ng-if="competitions.competition.results_type == 'precision'">{{_('Final')}}</a></li>
                        <li><a ui-sref="competitions.admin.patrols.distinguish({competitions_id: competitions.competition.id})">{{_('Särskjutning')}}</a></li>
                    </ul>
                </div>

                <a ui-sref="competitions.admin.results.index({competitions_id: competitions.competition.id})" class="btn btn-default" ng-class="{'disabled': competitions.competition.closed_at}">{{_('Resultat')}}</a>
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{_('Export & Utskrift')}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right">
                        <li><a ui-sref="competitions.admin.export.signups({competitions_id: competitions.competition.id})">{{_('Anmälningslista')}}</a></li>
                        <li><a ui-sref="competitions.admin.export.teams({competitions_id: competitions.competition.id})" ng-if="competitions.competition.allow_teams">{{_('Laglistor')}}</a></li>
                        <li><a ui-sref="competitions.admin.export.patrols({competitions_id: competitions.competition.id})"><% competitions.competition.translations.patrols_list_plural | ucfirst %></a></li>
                        <li><a ui-sref="competitions.admin.export.shootingcards({competitions_id: competitions.competition.id})">{{_('Skjutkort')}}</a></li>
                        <li><a ui-sref="competitions.admin.export.results({competitions_id: competitions.competition.id})">{{_('Resultat')}}</a></li>
                    </ul>
                </div>
            </div>

            <div class="panel-body">
                <div class="alert alert-info" ng-if="competitions.competition.closed_at">
                    {{_('Denna tävling är stängd. Ta kontakt med oss på support@webshooter.se om du vill du öppna upp tävlingen igen.')}}
                </div>
                <div class="alert alert-info" ng-if="!competitions.competition.is_public || !competitions.competition.results_is_public || !competitions.competition.patrols_is_public">
                    <div class="row">
                        <div class="col-sm-8">
                            <div ng-if="!competitions.competition.is_public">{{_('Denna tävling är inte synlig för övriga användare.')}}</div>
                            <div ng-if="!competitions.competition.results_is_public">{{_('Resultat för denna tävling är inte synlig för övriga användare.')}}</div>
                            <div ng-if="!competitions.competition.patrols_is_public">{{_('Patruller eller skjutlag för denna tävling är inte synliga för övriga användare.')}}</div>
                        </div>
                        <div class="col-sm-4 text-right">
                            <a class="btn btn-sm btn-primary" ui-sref="competitions.admin.edit.status({competitions_id:competitions.competition.id})">{{_('Ändra denna tävling')}}</a>
                        </div>
                    </div>
                </div>
                <div ui-view="main" ng-if="competitions.competition"></div>
            </div>

            </div>
        </div>
    </div>
</div>
