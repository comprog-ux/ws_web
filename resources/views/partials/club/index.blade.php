<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading hidden-print">
                {{_('Din förening')}}
            </div>

            <div class="panel-navigation">
                <a ui-sref="club.information" class="btn btn-default" ng-class="{'active': (currentRoute == 'club.information')}">
                    {{_('Förenings information')}}
                </a>
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" ng-class="{'btn-primary': (currentRoute == 'club.competitions') || (currentRoute == 'club.championships')}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{_('Tävlingar')}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a ui-sref="club.championships({clubs_id:'true'})">
                                {{_('Mästerskap')}}
                            </a>
                            <a ui-sref="club.competitions({clubs_id:'true'})">
                                {{_('Tävlingar')}}
                            </a>
                            <a ui-sref="competitions.create" ng-if="club.club.user_has_role =='admin'">
                                {{_('')}}
                            </a>
                        </li>
                    </ul>
                </div>

                <a ui-sref="club.admins" class="btn btn-default" ng-class="{'active': (currentRoute == 'club.admins')}">
                    {{_('Administratörsroller')}}
                </a>
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" ng-class="{'btn-primary': (currentRoute == 'club.users.index') || (currentRoute == 'club.users.edit') || (currentRoute == 'club.users.create')}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{_('Användare')}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a ui-sref="club.users.index">
                                {{_('Alla Användare')}}
                            </a>
                            <a ui-sref="club.users.create" ng-if="club.club.user_has_role =='admin'">
                                {{_('Lägg till ny användare')}}
                            </a>
                            <a ui-sref="club.users.clubChanges" ng-if="club.club.user_has_role =='admin'">
                                {{_('Föreningsbyten')}}
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="btn-group" ng-if="club.club.user_has_role =='admin'">
                    <button type="button" class="btn btn-default dropdown-toggle" ng-class="{'btn-primary': (currentRoute == 'club.invoices.index') || (currentRoute == 'club.invoices.incoming') || (currentRoute == 'club.invoices.outgoing') || (currentRoute == 'club.invoices.generate')}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{_('Fakturaöversikt')}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a ui-sref="club.invoices.index">
                                {{_('Fakturaöversikt')}}
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a ui-sref="club.invoices.incoming">
                                {{_('Inkommande Fakturor')}}
                            </a>
                        </li>
                        <li>
                            <a ui-sref="club.invoices.outgoing">
                                {{_('Skickade Fakturor')}}
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a ui-sref="club.invoices.generate">
                                {{_('Generera Fakturor')}}
                            </a>
                        </li>
                    </ul>
                </div>
                <a ui-sref="club.change" class="btn btn-default" ng-class="{'active': (currentRoute == 'club.change')}">
                    {{_('Byt förening')}}
                </a>
            </div>

            <div class="panel-body">
                <div ui-view="main"></div>
            </div>
        </div>
    </div>
</div>
