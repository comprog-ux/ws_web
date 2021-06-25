<ui-view>
    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Anmälan')}} | <% signups.signups.competition.name %>
                </div>

                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-4">
                            <div class="panel panel-default">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-sm-6">{{_('Tävlingsinformation')}}</div>
                                    </div>
                                </div>

                                <table class="table table-bordered">
                                    <tbody>
                                    <tr>
                                        <td>Användare</td>
                                        <td><% signups.signups.user.fullname %></td>
                                    </tr>
                                    <tr>
                                        <td>Vapengrupp</td>
                                        <td>
                                            <span class="label label-primary"><% signups.signups.weaponclass.classname %></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Datum</td>
                                        <td><% signups.signups.competition.date %></td>
                                    </tr>
                                    <tr>
                                        <td>Tävlingsgrupp</td>
                                        <td><% (signups.signups.competition.championship.name) ? signups.signups.competition.championship.name : '-' %></td>
                                    </tr>
                                    <tr ng-if="signups.signups.competition.competitiontype">
                                        <td>Tävlingstyp</td>
                                        <td><% signups.signups.competition.competitiontype.name %></td>
                                    </tr>
                                    <tr>
                                        <td>Avgift</td>
                                        <td><% (signups.signups.registration_fee) ? signups.signups.registration_fee : '-' %></td>
                                    </tr>
                                    </tbody>
                                </table>

                                <div class="panel-body text-right">
                                    <a ui-sref="competition.show({id: signups.signups.competitions_id, view: 'information'})">Visa tävlingen</a>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-8">

                            <div class="alert alert-info">
                                {{_('Arrangör är ej förpliktigad till att uppfylla särskilda önskemål.')}}
                            </div>

                            <div class="panel panel-default">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-sm-6">{{_('Anmälan')}}</div>
                                        <div class="col-sm-6 text-right"></div>
                                    </div>
                                </div>

                                <div class="panel-body">
                                    <form class="form-horizontal">
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Start gärna före')}}</div>
                                            <div class="col-sm-4">
                                                <select ng-model="signups.signups.start_before" class="form-control">
                                                    <option value="00:00:00">Inget önskemål</option>
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
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Start gärna efter')}}</div>
                                            <div class="col-sm-4">
                                                <select ng-model="signups.signups.start_after" class="form-control">
                                                    <option value="00:00:00">Inget önskemål</option>
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
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Första/Sista patrull')}}</div>
                                            <div class="col-sm-4">
                                                <select ng-model="signups.signups.first_last_patrol" class="form-control">
                                                    <option value="">Inget önskemål</option>
                                                    <option value="first">Första patrull</option>
                                                    <option value="last">Sista patrull</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Delar vapen med')}}<br><small>{{_('(Pistolskyttekortnr)')}}</small></div>
                                            <div class="col-sm-4">
                                                <input type="text" ng-model="signups.signups.share_weapon_with" class="form-control">
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Gärna samma patrull som')}}<br><small>{{_('(Pistolskyttekortnr)')}}</small></div>
                                            <div class="col-sm-4">
                                                <input type="text" ng-model="signups.signups.share_patrol_with" class="form-control">
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Skjuter ej samtidigt som')}}<br><small>{{_('(Pistolskyttekortnr)')}}</small></div>
                                            <div class="col-sm-4">
                                                <input type="text" ng-model="signups.signups.shoot_not_simultaneously_with" class="form-control">
                                            </div>
                                        </div>
                                        <div class="form-group" ng-if="!signups.signups.competition.championship">
                                            <div class="col-sm-4">{{_('Deltar utom tävlan')}}</div>
                                            <div class="col-sm-4">
                                                <label><input type="checkbox" ng-model="signups.signups.participate_out_of_competition" ng-true-value="1"> Deltar utom tävlan</label>
                                            </div>
                                        </div>
                                        <div class="form-group" ng-if="!signups.signups.competition.championship">
                                            <div class="col-sm-4">{{_('Standardmedalj')}}</div>
                                            <div class="col-sm-4">
                                                <label><input type="checkbox" ng-model="signups.signups.exclude_from_standardmedal" ng-true-value="1"> Exkludera från standardmedaljpoäng</label>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Anteckning')}}</div>
                                            <div class="col-sm-8">
                                                <textarea class="form-control" rows="6" ng-model="signups.signups.note"></textarea>
                                            </div>
                                        </div>
                                    </form>
                                    <hr>
                                    <div class="row">
                                        <div class="col-sm-6">
                                            <a ui-sref="signup({id: signups.signups.id})" class="btn btn-default">{{_('Avbryt')}}</a>
                                        </div>
                                        <div class="col-sm-6 text-right">
                                            <button class="btn btn-primary" ng-click="signups.updateSignup(signups.signups);">{{_('Spara')}}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>
