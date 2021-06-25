<div class="panel panel-danger hide" ng-class="{'show': (!competitions.user.fullname || !competitions.user.email || !competitions.user.birthday || (!competitions.user.shooting_card_number && !competitions.user.no_shooting_card_number))}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Din information')}}</div>
            <div class="col-sm-6 text-right"></div>
        </div>
    </div>

    <div class="panel-body">
        {{_('Du behöver kontrollera din personliga information nedan innan du kan anmäla dig till en tävling.')}} {{_('Ändringar gör du genom att gå till din profil.')}}
    </div>
    <table class="table">
        <tr>
            <td>{{_('För- och efternamn')}}</td>
            <td><% competitions.user.fullname %></td>
        </tr>
        <tr>
            <td>{{_('E-postadress')}}</td>
            <td>
                <span class="text-warning hide" ng-class="{'show': !competitions.user.email}">{{_('Din e-postadress saknas')}}</span>
                <% competitions.user.email %>
            </td>
        </tr>
        <tr>
            <td>{{_('Telefonnummer')}}</td>
            <td><% competitions.user.phone %></td>
        </tr>
        <tr>
            <td>{{_('Mobiltelefon')}}</td>
            <td><% competitions.user.mobile %></td>
        </tr>
        <tr>
            <td>{{_('Födelseår')}}</td>
            <td>
                <% competitions.user.birthday %>
                <span class="label label-danger" ng-if="!competitions.user.birthday">{{_('Födelseår saknas')}}</span>
            </td>
        </tr>
        <tr>
            <td>{{_('Pistolskyttekort')}}</td>
            <td>
                <% competitions.user.shooting_card_number %>
                <span class="label label-danger" ng-if="!competitions.user.shooting_card_number">{{_('Pistolskyttekortsnummer saknas')}}</span>
            </td>
        </tr>
    </table>
    <div class="panel-body">
        <a ui-sref="settings.editprofile" class="btn btn-default">Gå till inställningar</a>
    </div>
</div>


<div class="panel panel-default" ng-class="{'hide': (!competitions.user.fullname || !competitions.user.email || !competitions.user.birthday || (!competitions.user.shooting_card_number && !competitions.user.no_shooting_card_number))}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Vapengrupper')}}</div>
            <div class="col-sm-6 text-right"></div>
        </div>
    </div>

    <div class="panel-body">
        <div class="row">
            <div class="col-sm-12">
                {{_('Du kan anmäla dig till en eller flera tillgängliga vapengrupper för denna tävling.')}}<br>
                {{_('Vill du se alla tävlingar som du är anmäld till?')}} <a ui-sref="signups">{{_('Visa dina anmälningar')}}</a>
            </div>
        </div>
    </div>

    <div class="table-responsive"></div>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th class="col-sm-2">{{_('Vapengrupp')}}</th>
                    <th class="col-sm-2" class="text-right">{{_('Avgift')}}</th>
                    <th>{{_('Anmälan')}}</th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="weaponclass in competitions.competitions.weaponclasses">
                    <td>
                        <span class="label label-default margin-right-5">
                            <% (competitions.competitions.championships_id) ? weaponclass.classname_general : weaponclass.classname %>
                        </span>
                    </td>

                    <td class="text-right">
                        <% (weaponclass.pivot.registration_fee) ? weaponclass.pivot.registration_fee : '-' %>
                    </td>

                    <td>
                        <div ng-repeat="signup in usersignups = (competitions.competitions.usersignups | filter:{weaponclasses_id: weaponclass.id}: true)">
                            <a ui-sref="signup({id: signup.id})">
                                {{_('Visa anmälan')}}
                                <span ng-if="signup.requires_approval && !signup.is_approved_by">({{_('Väntar på granskning')}})</span>
                            </a>
                            <a href=""
                               class="text-danger"
                               ng-click="competitions.deleteSignup(signup);"
                               ng-if="!signup.invoices_id">
                                <i class="fa fa-trash-o"></i> {{_('Avregistrera')}}
                            </a>
                        </div>
                        <div ng-if="!usersignups.length">
                            <button class="btn btn-primary btn-sm"
                                    ng-click="competitions.createSignup(weaponclass.id);"
                                    ng-if="competitions.competitions.status == 'open'">
                                {{_('Registrera dig')}}
                            </button>
                            <button class="btn btn-primary btn-sm"
                                    ng-click="competitions.createSignup(weaponclass.id);"
                                    ng-if="competitions.competitions.status == 'after_signups_closing_date'">
                                {{_('Efteranmäl dig')}}
                            </button>
                            <span ng-if="competitions.competitions.status == 'not_opened'">
                                <% competitions.competitions.status_human %>
                            </span>
                            <span ng-if="competitions.competitions.status == 'closed'">
                                <% competitions.competitions.status_human %>
                            </span>
                        </div>
                    </td>
                </tr>
            </tbody>
       </table>
    </div>

</div>
