<div class="row">
    <div class="col-sm-3">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Redigera tävling')}}
            </div>
            <ul class="nav nav-pills nav-stacked">
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
    </div>
    <div class="col-sm-9">
        <div ui-view="edit" ng-if="competitions.competition"></div>
    </div>
</div>


