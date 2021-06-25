<div class="row">
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">
                <div class="row">
                    <div class="col-sm-6">{{_('Användarens information')}}</div>
                    <div class="col-sm-6 text-right"></div>
                </div>
            </div>

            <table class="table">
                <tr>
                    <td>{{_('För- och efternamn')}}</td>
                    <td><% user.user.fullname %></td>
                </tr>
                <tr>
                    <td>{{_('E-postadress')}}</td>
                    <td>
                        <span class="text-warning hide" ng-class="{'show': !user.user.email}">{{_('Din e-postadress saknas')}}</span>
                        <% user.user.email %>
                    </td>
                </tr>
                <tr>
                    <td>{{_('Telefonnummer')}}</td>
                    <td><% user.user.phone %></td>
                </tr>
                <tr>
                    <td>{{_('Mobiltelefon')}}</td>
                    <td><% user.user.mobile %></td>
                </tr>
                <tr>
                    <td>{{_('Födelseår')}}</td>
                    <td>
                        <% user.user.birthday %>
                        <span class="label label-danger" ng-if="!user.user.birthday">{{_('Födelseår saknas')}}</span>
                    </td>
                </tr>
                <tr>
                    <td>{{_('Pistolskyttekort')}}</td>
                    <td>
                        <% user.user.shooting_card_number %>
                        <span class="label label-danger" ng-if="!user.user.shooting_card_number">{{_('Pistolskyttekortsnummer saknas')}}</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="col-sm-8">
        <div class="panel panel-default">
            <div class="panel-heading">
                <div class="row">
                    <div class="col-sm-6">{{_('Vapengrupper')}}</div>
                    <div class="col-sm-6 text-right"></div>
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
                        <tr ng-repeat="weaponclass in competitions.competition.weaponclasses">
                            <td><span class="label label-default margin-right-5"><% (competitions.competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></span></td>
                            <td class="text-right"><% (weaponclass.pivot.registration_fee) ? weaponclass.pivot.registration_fee : '-' %></td>
                            <td>
                                <div ng-repeat="signup in usersignups = (user.user.signups | filter:{weaponclasses_id: weaponclass.id}: true)">
                                    {{--<a ui-sref="signup({id: signup.id})">{{_('Visa anmälan')}}</a>--}}
                                    <div class="btn-group">
                                        <button type="button" class="btn btn-warning btn-sm btn-block dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            {{_('Byt vapengrupp')}} <span class="caret"></span>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-right">

                                            <li ng-repeat="weaponclass in competitions.competition.weaponclasses | excludeByIds:(user.user.signups | map: 'weaponclasses_id')">
                                                <a ng-click="user.changeSignupWeaponclass(weaponclass.id, signup)"><% (competitions.competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></a>
                                            </li>

                                        </ul>
                                    </div>
                                    <a href="" class="text-danger" ng-click="user.deleteSignup(signup);" ng-if="!signup.invoices_id"><i class="fa fa-trash-o"></i> {{_('Avregistrera')}}</a>
                                    <a ui-sref="competitions.admin.invoices.show({id: signup.invoices_id})" ng-if="signup.invoices_id" class="btn btn-sm btn-default">{{_('Visa fakturan')}}</a>
                                </div>
                                <div ng-if="!usersignups.length">
                                    <button class="btn btn-primary btn-sm" ng-click="user.createSignup(weaponclass.id);">{{_('Registrera anmälan')}}</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
               </table>
            </div>
        </div>
    </div>
</div>
