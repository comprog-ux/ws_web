<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Anmälan')}}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <tbody>
        <tr>
            <td>{{_('Mottagare för anmälningsavgiften')}}</td>
            <td>
                <div class="radio">
                    <label for="invoices_recipients_club">
                    <input type="radio"
                           id="invoices_recipients_club"
                           name="invoices_recipient"
                           ng-model="competitions.competition.invoices_recipient_type"
                           value="App\Models\Club">
                        {{_('Föreningen:')}} <% competitions.competition.club.name %>
                    </label>
                </div>
                <div class="radio" ng-if="competitions.competition.club.districts_id">
                    <label for="invoices_recipients_district">
                    <input type="radio"
                           id="invoices_recipients_district"
                           name="invoices_recipient"
                           ng-model="competitions.competition.invoices_recipient_type"
                           value="App\Models\District">
                        {{_('Kretsen:')}} <% competitions.competition.club.district.name %>
                    </label>
                </div>
                <div ng-if="!competitions.competition.club.districts_id">
                    <div class="text-danger">{{_('Din förening behöver tillhöra en krets om du vill att kretsen ska stå som avsändare på fakturan som skickas till anmälda användare och föreningar.')}}</div>
                    <button class="btn btn-primary btn-xs" ui-sref="club.edit">{{_('Koppla föreningen till en krets')}}</button>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Anmälningen öppnar')}}</td>
            <td><div uib-datepicker ng-model="competitions.competition.signups_opening_date" class="margin-bottom-0"></div></td>
        </tr>
        <tr>
            <td>{{_('Sista anmälningsdatum')}}</td>
            <td><div uib-datepicker ng-model="competitions.competition.signups_closing_date" class="margin-bottom-0"></div></td>
        </tr>
        <tr>
            <td>{{_('Lagtävling')}}</td>
            <td>
                <label for="allow_teams">
                    <input type="checkbox" ng-model="competitions.competition.allow_teams" id="allow_teams" ng-true-value="1" ng-false-value="0"> {{_('Tillåt anmälan av lag')}}</a>
                </label>
            </td>
        </tr>
        <tr>
            <td>{{_('Anmälningsavgift per lag')}}</td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.teams_registration_fee" class="form-control text-right" placeholder="{{_('Anmälningsavgift per lag')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('kr')}}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Tillåt Efteranmälan')}}</td>
            <td>
                <label for="allow_signups_after_closing_date">
                    <input type="checkbox" ng-model="competitions.competition.allow_signups_after_closing_date" id="allow_signups_after_closing_date" ng-true-value="1" ng-false-value="0"> {{_('Tillåt anmälan efter sista anmälningsdag')}}</a>
                </label>
            </td>
        </tr>
        <tr>
            <td>{{_('Pristillägg efteranmälan')}}</td>
            <td>
                <div class="input-group">
                    <input type="tel" ng-model="competitions.competition.price_signups_after_closing_date" class="form-control text-right" placeholder="{{_('Avgift per efteranmälan')}}" aria-describedby="basic-addon2">
                    <span class="input-group-addon">{{_('kr')}}</span>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Godkännande av efteranmälan')}}</td>
            <td>
                <label for="approval_signups_after_closing_date">
                    <input type="checkbox" ng-model="competitions.competition.approval_signups_after_closing_date" id="approval_signups_after_closing_date" ng-true-value="1" ng-false-value="0"> {{_('Efteranmälan behöver godkännas av administratör för tävlingen')}}</a>
                </label>
            </td>
        </tr>
        </tbody>
    </table>
    <div class="panel-footer">
        <button class="btn btn-primary" ng-click="competitions.update()">{{_('Spara')}}</button>
    </div>
</div>
