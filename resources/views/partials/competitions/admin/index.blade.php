<div class="row">
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Information')}}
            </div>

            <table class="table table-bordered">
                <tbody>
                <tr>
                    <td>{{_('Namn')}}</td>
                    <td><% competitions.competition.name %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Datum')}}</td>
                    <td><% competitions.competition.date %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Öppnas för anmälan')}}</td>
                    <td><% competitions.competition.signups_opening_date %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Sista anmälningsdag')}}</td>
                    <td><% competitions.competition.signups_closing_date %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Efteranmälan')}}</td>
                    <td><% competitions.competition.allow_signups_after_closing_date_human %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Lagtävling')}}</td>
                    <td>
                        <% (competitions.competition.allow_teams) ? "{{_('Ja')}}" : "{{_('Nej')}}" %>
                        <% (competitions.competition.allow_teams) ? "{{_('Avgift:')}} "+competitions.competition.teams_registration_fee+" kr" : "" %>
                    </td>
                </tr>
                <tr>
                    <td>{{_('Tävlingsgrupp')}}</td>
                    <td><a ui-sref="championships.show({championships_id: competitions.competition.championships_id})"><% competitions.competition.championship.name %></a></td>
                </tr>
                <tr ng-if="competitions.competition.competitiontype">
                    <td>{{_('Tävlingstyp')}}</td>
                    <td><% competitions.competition.competitiontype.name %></td>
                </tr>
                <tr>
                    <td>{{_('Resultatberäkning')}}</td>
                    <td><% competitions.competitionsresults_type_human %></td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="col-sm-8">
        <div class="row">
            <div class="col-sm-6">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        {{_('Snabbinfo')}}
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                        <tr>
                            <td class="col-sm-6">{{_('Anmälningar')}}</td>
                            <td><% competitions.competition.signups_count %> st</td>
                        </tr>
                        <tr>
                            <td class="col-sm-6"><% competitions.competition.translations.patrols_name_plural | ucfirst %></td>
                            <td><% competitions.competition.patrols_count %> st</td>
                        </tr>
                        <tr>
                            <td class="col-sm-6">{{_('Resultat')}}</td>
                            <td><% competitions.competition.results_count %> st</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        {{_('Status')}}
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                        <tr>
                            <td class="col-sm-6">{{_('Tävlingen')}}</td>
                            <td>
                                <label class="btn btn-sm btn-primary" ng-if="!competitions.competition.is_public">{{_('Dold')}}</label>
                                <label class="btn btn-sm btn-primary" ng-if="competitions.competition.is_public">{{_('Publik')}}</label>
                            </td>
                        </tr>
                        <tr>
                            <td><% competitions.competition.translations.patrols_name_plural | ucfirst %></td>
                            <td>
                                <label class="btn btn-sm btn-primary" ng-if="!competitions.competition.patrols_is_public">{{_('Dold')}}</label>
                                <label class="btn btn-sm btn-primary" ng-if="competitions.competition.patrols_is_public">{{_('Publik')}}</label>
                            </td>
                        </tr>
                        <tr>
                            <td>{{_('Resultat')}}</td>
                            <td>
                                <label class="btn btn-sm btn-primary" ng-if="!competitions.competition.results_is_public">{{_('Dold')}}</label>
                                <label class="btn btn-sm btn-primary" ng-if="competitions.competition.results_is_public">{{_('Publik')}}</label>
                            </td>
                        </tr>
                        <tr>
                            <td>{{_('Anmälan')}}</td>
                            <td>
                                <% competitions.competition.status_human %>
                            </td>
                        </tr>
                        <tr>
                            <td>{{_('Efteranmälan')}}</td>
                            <td>
                                <% competitions.competition.allow_signups_after_closing_date_human %>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

</div>
