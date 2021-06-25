<div class="row">
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Information')}}
            </div>

            <table class="table table-bordered">
                <tbody>
                <tr>
                    <td>{{_('Namn')}}</td>
                    <td><% competitions.competitions.name %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Datum')}}</td>
                    <td><% competitions.competitions.date %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Öppnas för anmälan')}}</td>
                    <td><% competitions.competitions.signups_opening_date %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Sista anmälningsdag')}}</td>
                    <td><% competitions.competitions.signups_closing_date %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Efteranmälan')}}</td>
                    <td><% competitions.competitions.allow_signups_after_closing_date_human %></td>
                </tr>
                <tr>
                    <td width="40%">{{_('Lagtävling')}}</td>
                    <td>
                        <% (competitions.competitions.allow_teams) ? "{{_('Ja')}}" : "{{_('Nej')}}" %>
                        <% (competitions.competitions.allow_teams) ? "{{_('Avgift:')}} "+competitions.competitions.teams_registration_fee+" kr" : "" %>
                    </td>
                </tr>
                <tr>
                    <td>{{_('Tävlingsgrupp')}}</td>
                    <td><a ui-sref="championships.show({championships_id: competitions.competitions.championships_id})"><% competitions.competitions.championship.name %></a></td>
                </tr>
                <tr ng-if="competitions.competitions.competitiontype">
                    <td>{{_('Tävlingstyp')}}</td>
                    <td><% competitions.competitions.competitiontype.name %></td>
                </tr>
                <tr>
                    <td>{{_('Resultatberäkning')}}</td>
                    <td><% competitions.competitions.results_type_human %></td>
                </tr>
                </tbody>
            </table>
        </div>

        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Beskrivning')}}
            </div>
            <div class="panel-body">
                <span class="break-lines"><% competitions.competitions.description %></span>
            </div>
        </div>

        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Vapenklasser')}}
            </div>
            <div class="panel-body">
                <span ng-repeat="weaponclass in competitions.competitions.weaponclasses" class="label label-default margin-right-5 inline-block"><% (competitions.competitions.championships_id) ? weaponclass.classname_general : weaponclass.classname %></span>
            </div>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Kontaktuppgifter')}}
            </div>

            <table class="table table-bordered">
                <tbody>
                <tr>
                    <td width="40%">{{_('Arrangör')}}</td>
                    <td><% competitions.competitions.club.name %></td>
                </tr>
                <tr>
                    <td>{{_('Tävlingsplats')}}</td>
                    <td><% competitions.competitions.contact_venue %></td>
                </tr>
                <tr>
                    <td>{{_('Ort')}}</td>
                    <td><% competitions.competitions.contact_city %></td>
                </tr>
                <tr>
                    <td>{{_('Kontaktperson')}}</td>
                    <td><% competitions.competitions.contact_name %></td>
                </tr>
                <tr>
                    <td>{{_('Telefonnummer')}}</td>
                    <td><% competitions.competitions.contact_telephone %></td>
                </tr>
                <tr>
                    <td>{{_('E-postadress')}}</td>
                    <td><% competitions.competitions.contact_email %></td>
                </tr>

                <tr>
                    <td>{{_('Webbplats')}}</td>
                    <td>
                        <a href="<% competitions.competitions.website %>" target="_blank" ng-if="competitions.competitions.website"><% competitions.competitions.website %></a>
                        <span ng-if="!competitions.competitions.website">-</span>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <div class="panel panel-default" ng-if="competitions.competitions.google_maps_url">
            <div class="panel-heading">
                {{_('Karta')}}
            </div>
            <iframe ng-src="<% competitions.competitions.google_maps_url %>" width="100%" height="300" frameborder="0" style="border:0" allowfullscreen></iframe>
        </div>
    </div>
</div>
