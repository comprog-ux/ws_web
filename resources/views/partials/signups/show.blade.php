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

                            <div class="alert alert-warning"
                                 ng-if="signups.signups.requires_approval && !signups.signups.is_approved_by">
                                {{_('Efteranmälan väntar på granskning från administratör')}}
                            </div>

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
                                                <% (signups.signups.start_before != '00:00:00') ? signups.signups.start_before : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Start gärna efter')}}</div>
                                            <div class="col-sm-4">
                                                <% (signups.signups.start_after != '00:00:00') ? signups.signups.start_after : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Första/Sista patrull')}}</div>
                                            <div class="col-sm-4">
                                                <% signups.signups.first_last_patrol_human %>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Delar vapen med')}}<br><small>{{_('(Pistolskyttekortnr)')}}</small></div>
                                            <div class="col-sm-4">
                                                <% (signups.signups.share_weapon_with) ? signups.signups.share_weapon_with : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Gärna samma patrull som')}}<br><small>{{_('(Pistolskyttekortnr)')}}</small></div>
                                            <div class="col-sm-4">
                                                <% (signups.signups.share_patrol_with) ? signups.signups.share_patrol_with : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Skjuter ej samtidigt som')}}<br><small>{{_('(Pistolskyttekortnr)')}}</small></div>
                                            <div class="col-sm-4">
                                                <% (signups.signups.shoot_not_simultaneously_with) ? signups.signups.shoot_not_simultaneously_with : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group" ng-if="!signups.signups.competition.championship">
                                            <div class="col-sm-4">{{_('Deltar utom tävlan')}}</div>
                                            <div class="col-sm-4">
                                                <% (signups.signups.participate_out_of_competition) ? signups.signups.participate_out_of_competition : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group" ng-if="!signups.signups.competition.championship">
                                            <div class="col-sm-4">{{_('Standardmedalj')}}</div>
                                            <div class="col-sm-4">
                                                <% (signups.signups.exclude_from_standardmedal) ? signups.signups.exclude_from_standardmedal : '-' %>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="col-sm-4">{{_('Anteckning')}}</div>
                                            <div class="col-sm-8">
                                                <% (signups.signups.note) ? signups.signups.note : '-' %>
                                            </div>
                                        </div>
                                    </form>
                                    <hr>
                                    <div class="row">
                                        <div class="col-xs-6">
                                            <button class="btn btn-primary hidden-xs" ui-sref="signup.edit({id: signups.signups.id})">{{_('Ändra anmälan')}}</button>
                                            <button class="btn btn-primary visible-xs" ui-sref="signup.edit({id: signups.signups.id})">{{_('Ändra')}}</button>
                                        </div>
                                        <div class="col-xs-6 text-right">
                                            <a href="" class="text-danger hidden-xs" ng-click="signups.deleteSignup(signups.signups);">{{_('Avregistrera denna anmälan')}}</a>
                                            <a href="" class="text-danger visible-xs" ng-click="signups.deleteSignup(signups.signups);">{{_('Avregistrera')}}</a>
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
