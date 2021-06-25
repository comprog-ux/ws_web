<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Kontaktuppgifter')}}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <tbody>
        <tr>
            <td class="col-sm-4">{{_('Tävlingsplats/Klubb')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.contact_venue" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('Ort/stad')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.contact_city" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('Webbplats')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.website" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('Kontaktperson')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.contact_name" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('Telefonnummer')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.contact_telephone" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('E-postadress')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.contact_email" class="form-control">
            </td>
        </tr>
        <tr>
            <td>{{_('Organisatör')}}</td>
            <td>
                <div class="radio">
                    <label for="organizer_club">
                        <input type="radio"
                               id="organizer_club"
                               name="organizer"
                               ng-model="competitions.competition.organizer_type"
                               value="App\Models\Club">
                        <select class="form-control input-sm pull-right" ng-options="club.id as club.name for club in competitions.available_clubs" ng-model="competitions.competition.organizer_id" ng-click="competitions.competition.organizer_type = 'App\\Models\\Club'"></select>
                    </label>
                </div>
                <div class="radio" ng-if="competitions.competition.club.districts_id">
                    <label for="organizer_district">
                        <input type="radio"
                               id="organizer_district"
                               name="organizer"
                               ng-model="competitions.competition.organizer_type"
                               value="App\Models\District">
                        {{_('Kretsen:')}} <% competitions.competition.club.district.name %>
                    </label>
                </div>
            </td>
        </tr>
        <tr>
            <td>{{_('Google Karta Embed länk')}}</td>
            <td>
                <input type="text" ng-model="competitions.competition.google_maps" class="form-control">
                <div class="alert alert-info margin-bottom-0 margin-top-10">
                    {{_('Gör så här')}}<br>
                    {{_('1) Besök google maps:')}} <a href="https://www.google.com/maps" target="_blank">Google Maps</a><br>
                    {{_('2) Sök eller markera plats på kartan.')}}<br>
                    {{_('3) Klicka på "Dela".')}}<br>
                    {{_('4) Klicka på "Bädda in karta".')}}<br>
                    {{_('5) Kopiera iframe länken och klistra in i rutan här ovanför.')}}<br>
                    {{_('6) Webshooter tar ut den slutgiltiga länken automatiskt när du sparar.')}}
                </div>
            </td>
        </tr>
        </tbody>
    </table>
    <div class="panel-footer">
        <button class="btn btn-primary" ng-click="competitions.update()">{{_('Spara')}}</button>
    </div>
</div>

