<div class="panel panel-default">
    <div class="panel-heading">{{_('Föreningsanmälan')}}</div>
        <div class="panel-body" ng-if="clubsignups.club.user_has_role != 'admin'">
            <div class="row">
                <div class="col-sm-12">
                    <p>{{_('Endast användare med administratörsbehörighet för din förening kan göra laganmälan.')}}</p>
                    <button class="btn btn-primary" ui-sref="club.admins">{{_('Hantera administratörer')}}</button>
                </div>
            </div>
        </div>
        <div class="panel-body" ng-if="clubsignups.competition.status == 'not_opened'">
            <div class="row">
                <div class="col-sm-12">
                    <% competitions.competitions.status_human %>
                </div>
            </div>
        </div>

        <div class="panel-body">
            <div class="row">
                <div class="col-sm-3">
                    <select ng-model="filter_weapongroups_id"
                            ng-options="weapongroup.id as weapongroup.name for weapongroup in competitions.competitions.weapongroups"
                            class="form-control">
                        <option value="">{{_('Välj vapengrupp')}}</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="table-responsive" ng-if="clubsignups.club.users">
            <table class="table table-bordered table-hover">
                <thead>
                    <th class="text-right">{{_('Pskn')}}</th>

                    <th>{{_('Användare')}}</th>

                    <th class="text-center" ng-repeat="weaponclass in clubsignups.competition.weaponclasses | filter:{weapongroups_id:filter_weapongroups_id}:true">
                        <% (clubsignups.competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %>
                    </th>

                </thead>
                <tbody>
                    <tr ng-repeat="user in clubsignups.club.users">
                        <td class="text-right"><% (user.shooting_card_number) ? user.shooting_card_number : '-' %></td>

                        <td><% user.fullname %></td>

                        <td class="text-center" ng-repeat="weaponclass in clubsignups.competition.weaponclasses | filter:{weapongroups_id:filter_weapongroups_id}:true">
                            <div ng-repeat="signup in usersignups = (clubsignups.competition.signups | filter:{user:{user_id: (user.user_id|num)}}:true | filter:{weaponclasses_id:weaponclass.id}:true)">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-success btn-xs btn-block dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fa fa-check-circle"></i> {{_('Registrerad')}} <span class="caret"></span>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-right">
                                        <li><a ui-sref="signup({id: signup.id})">Visa anmälan</a></li>
                                        <li><a ui-sref="signup.edit({id: signup.id})">Redigera anmälan</a></li>
                                        <li role="separator" class="divider"></li>
                                        <li ng-if="!signup.invoices_id"><a href="" ng-click="clubsignups.deleteSignup(signup);">Avregistrera</a></li>
                                        <li ng-if="signup.invoices_id"><a ui-sref="club.invoices.show({id:signup.invoices_id})">Visa fakturan</a></li>
                                    </ul>
                                </div>
                                <span uib-tooltip-html="signup.special_wishes | renderHTMLCorrectly" class="label label-primary" ng-if="signup.special_wishes">{{_('Önskemål')}}</span>

                            </div>
                            <button class="btn btn-default btn-xs btn-block" ng-click="clubsignups.createSignup(user.user_id, weaponclass.id);" ng-if="!usersignups.length && competitions.competitions.status == 'open'">{{_('Lägg till')}}</button>
                            <button class="btn btn-default btn-xs btn-block" ng-click="clubsignups.createSignup(user.user_id, weaponclass.id);" ng-if="!usersignups.length && competitions.competitions.status == 'after_signups_closing_date'">{{_('Efteranmäl')}}</button>
                            <span ng-if="competitions.competitions.status == 'closed'"><% competitions.competitions.status_human %></span>
                        </td>

                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>