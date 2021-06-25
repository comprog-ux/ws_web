<div class="row" ng-if="!competitions.error">
    <div class="col-sm-6 col-sm-offset-3">
        <div class="panel panel-primary" ng-if="competitions.competition && !competitions.competition.id">
            <div class="panel-heading">{{_('Skapa ny tävling')}}</div>
            <div class="padding-left-15 padding-top-10 padding-bottom-10 padding-right-15">
                <div><uib-progressbar max="competitions.wizard.max_steps" value="competitions.wizard.current_step" class="margin-0"><span style="color:white; white-space:nowrap;">{{_('Steg')}} <% competitions.wizard.current_step %> {{_('av')}} <% competitions.wizard.max_steps %></span></uib-progressbar></div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 1}">
                @if(env('APP_ENV') != 'production')
                    <div class="alert alert-info">{{_('I denna version av systemet utgår ingen debitering')}}</div>
                @endif
                <div class="panel panel-default">
                    <div class="panel-heading">
                        {{_('Villkor för tävlingen')}}
                    </div>
                    <div class="panel-body text-center">
                        <h3 ng-if="competitions.competition.championships_id"><small>Endast</small> 15 kr/anmälan</h3>
                        <h3 ng-if="!competitions.competition.championships_id"><small>Endast</small> 10 kr/anmälan</h3>
                        <p>Vi håller priset så lågt det bara är möjligt och debiterar endast 10 kr per genomförd anmälan. Ingår tävlingen i ett mästerskap är priset 15 kr per anmälan.</p>
                        <p><small>En faktura skickas till din förening efter genomförd tävling.</small></p>
                        <p><small>Inga ytterligare kostnader tillkommer.</small></p>
                        <p><small>Priset är inklusive moms.</small></p>
                        <div class="row margin-top-10">
                            <div class="col-md-12">
                                <label for="terms">
                                    <input type="checkbox" ng-model="competitions.competition.terms" id="terms"> {{_('Jag godkänner ovanstående')}}</a> <span class="text-muted">*</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 2}">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <div class="row">
                            <div class="col-sm-6">{{_('Information')}}</div>
                        </div>
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td class="col-sm-4">{{_('Namn')}}</td>
                                <td>
                                    <input type="text" ng-model="competitions.competition.name" class="form-control">
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Beskrivning')}}</td>
                                <td>
                                    <textarea type="text" ng-model="competitions.competition.description" class="form-control"></textarea>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Mästerskap')}}</td>
                                <td>
                                    <select ng-model="competitions.competition.championship" class="form-control" ng-options="championship as championship.name for championship in competitions.championships">
                                        <option value="">{{_('Fristående tävling, Inget mästerskap')}}</option>
                                    </select>
                                    <div class="row margin-top-5 margin-bottom-5">
                                        <div class="col-sm-12 text-right">
                                            <button class="btn btn-primary btn-xs" ng-click="competitions.openCreateChampionshipsModal()"><i class="fa fa-plus"></i> {{_('Skapa ett nytt mästerskap')}}</a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Tävlingstyp')}}</td>
                                <td>
                                    <select ng-model="competitions.competition.competitiontype" class="form-control" ng-options="competitiontype as competitiontype.name for competitiontype in competitions.competition_types"></select>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Resultatberäkning')}}</td>
                                <td>
                                    <select ng-model="competitions.competition.results_type" class="form-control" ng-options="resultstype as resultstype.name for resultstype in competitions.results_types"></select>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Använd priser i resultat')}}</td>
                                <td>
                                    <div class="btn-group">
                                        <label class="btn btn-sm btn-primary" ng-model="competitions.competition.results_prices" uib-btn-radio="0">{{_('Inga priser')}}</label>
                                        <label class="btn btn-sm btn-primary" ng-model="competitions.competition.results_prices" uib-btn-radio="1">{{_('Använd priser')}}</label>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 3}">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <div class="row">
                            <div class="col-sm-6">{{_('Kontaktuppgifter')}}</div>
                        </div>
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td>{{_('Tävlingsplats/Klubb')}}</td>
                                <td>
                                    <input type="text" ng-model="competitions.competition.contact_venue" class="form-control">
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Ort/stad - Krävs')}}</td>
                                <td>
                                    <input type="text" ng-model="competitions.competition.contact_city" class="form-control" placeholder="T.ex. Malmö">
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
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 4}">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <div class="row">
                            <div class="col-sm-6">{{_('Patruller och skjutlag')}}</div>
                        </div>
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td><% competitions.competition.translations.patrols_size | ucfirst %></td>
                                <td>
                                    <div class="input-group">
                                        <input type="tel" ng-model="competitions.competition.patrol_size" class="form-control text-right" placeholder="{{_('Antal platser')}}" aria-describedby="basic-addon2">
                                        <span class="input-group-addon">{{_('styck')}}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {{_('Max antalet deltagare')}}<br>
                                    <small>{{_('Lämna tomt för obegränsad')}}</small>
                                </td>
                                <td>
                                    <div class="input-group">
                                        <input type="tel" ng-model="competitions.competition.max_competitors" class="form-control text-right" placeholder="{{_('Antal platser')}}" aria-describedby="basic-addon2">
                                        <span class="input-group-addon">{{_('styck')}}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Åtgångstid')}}</td>
                                <td>
                                    <div class="input-group">
                                        <input type="number" ng-model="competitions.competition.patrol_time" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2">
                                        <span class="input-group-addon">{{_('minuter')}}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Rast')}}</td>
                                <td>
                                    <div class="input-group">
                                        <input type="number" ng-model="competitions.competition.patrol_time_rest" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2">
                                        <span class="input-group-addon">{{_('minuter')}}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Tid mellan %s', '<% competitions.competition.translations.patrols_name_plural %>')}}</td>
                                <td>
                                    <div class="input-group">
                                        <input type="number" ng-model="competitions.competition.patrol_time_interval" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2">
                                        <span class="input-group-addon">{{_('minuter')}}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>{{_('Totaltid för %s', '<% competitions.competition.translations.patrols_name_singular %>')}}</td>
                                <td>
                                    <div class="input-group">
                                        <input type="number" ng-value="(competitions.competition.patrol_time*1 + competitions.competition.patrol_time_rest*1 + competitions.competition.patrol_time_interval*1)" class="form-control text-right" placeholder="{{_('Antal minuter')}}" aria-describedby="basic-addon2" disabled>
                                        <span class="input-group-addon">{{_('minuter')}}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 5}">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <div class="row">
                            <div class="col-sm-6">{{_('Datum och tider')}}</div>
                        </div>
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                        <tr>
                            <td class="col-sm-4">{{_('Datum')}}</td>
                            <td><div uib-datepicker ng-model="competitions.competition.date" class="margin-bottom-0"></div></td>
                        </tr>
                        <tr>
                            <td>{{_('Start tid')}}</td>
                            <td>
                                <div uib-timepicker ng-model="competitions.competition.start_time" mousewheel="false" hour-step="1" minute-step="1" show-meridian="ismeridian"></div>
                            </td>
                        </tr>
                        <tr>
                            <td>{{_('Final tid')}}</td>
                            <td>
                                <div uib-timepicker ng-model="competitions.competition.final_time" mousewheel="false" hour-step="1" minute-step="1" show-meridian="ismeridian"></div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 6}">
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
                                    <button class="btn btn-primary btn-xs" ui-sref="club.edit">{{_('Koppla din förening till en krets')}}</button>
                                </div>
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
                                <div ng-if="!competitions.competition.club.districts_id">
                                    <div class="text-danger">{{_('Din förening behöver tillhöra enkrets om du vill att kretsen ska stå som avsändare på fakturan som skickas till anmälda användare och föreningar.')}}</div>
                                    <button class="btn btn-primary btn-xs" ui-sref="club.edit">{{_('Koppla din förening till en krets')}}</button>
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
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 7}">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <div class="row">
                            <div class="col-sm-6">{{_('Vapengrupper')}}</div>
                        </div>
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                            <tr ng-repeat="weaponclass in competitions.competition.weaponclasses">
                                <td><% (competitions.competition.championship) ? weaponclass.classname_general : weaponclass.classname %></td>
                                <td><% weaponclass.registration_fee %></td>
                                <td class="text-right">
                                    <button class="btn btn-xs btn-danger" ng-click="competitions.deleteWeaponclass(weaponclass);">{{_('Radera')}}</button>
                                </td>
                            </tr>
                        </tbody>
                        <tfood>
                            <tr>
                                <td ng-if="competitions.competition.championship">
                                    <select
                                            ng-model="competitions.newWeaponclass.weaponclass"
                                            ng-options="weaponclass as weaponclass.classname_general for weaponclass in competitions.weaponclasses | filter:{championship:1}:true"
                                            class="form-control">
                                        <option value="">{{_('Välj vapengrupp')}}</option>
                                    </select>
                                </td>
                                <td ng-if="!competitions.competition.championship">
                                    <select
                                            ng-model="competitions.newWeaponclass.weaponclass"
                                            ng-options="weaponclass as weaponclass.classname for weaponclass in competitions.weaponclasses"
                                            class="form-control">
                                        <option value="">{{_('Välj vapengrupp')}}</option>
                                    </select>
                                </td>
                                <td>
                                    <div class="input-group">
                                        <input type="tel"
                                               ng-model="competitions.newWeaponclass.registration_fee"
                                               class="form-control text-right"
                                               placeholder="{{_('Anmälningsavgift')}}"
                                               ng-enter="competitions.createWeaponclass();"
                                               aria-describedby="basic-addon2"
                                        >
                                        <span class="input-group-addon">{{_('kr')}}</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-primary btn-block" ng-click="competitions.createWeaponclass();">{{_('Lägg till')}}</button>
                                </td>
                            </tr>
                        </tfood>
                    </table>
                </div>
            </div>

            <div class="panel-body hide" ng-class="{'show': competitions.wizard.current_step == 8}">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        {{_('Du kommer att skapa följande tävling. Kommer en mängd felmeddelanden upp kan Ort/stad vara felstavat.      Gå i så fall tillbaka och ändra. Kommer tävlingen inte upp på kartan, stäng tävlingen och gör om på nytt.')}}
                    </div>
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td width="40%">{{_('Namn')}}</td>
                                <td><% competitions.competition.name %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Ort/stad')}}+ ', Sweden' </td>
                                <td><% competitions.competition.contact_city %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Beskrivning')}}</td>
                                <td><% competitions.competition.desription %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Webbplats')}}</td>
                                <td><% competitions.competition.website %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Tävlingsgrupp')}}</td>
                                <td><% competitions.competition.championship.name %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Tävlingstyp')}}</td>
                                <td><% competitions.competition.competitiontype.name %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Resultatberäkning')}}</td>
                                <td><% competitions.competition.results_type.name %></td>
                            </tr>
                            <tr>
                                <td width="40%"><% competitions.competition.translations.patrols_size | ucfirst %></td>
                                <td><% competitions.competition.patrol_size %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Max antalet deltagare')}}</td>
                                <td><% competitions.competition.max_competitors %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Åtgångstid')}}</td>
                                <td><% competitions.competition.patrol_time %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Rast')}}</td>
                                <td><% competitions.competition.patrol_time_rest %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Tid mellan %s', '<% competitions.competition.translations.patrols_name_plural %>')}}</td>
                                <td><% competitions.competition.patrol_time_interval %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Datum')}}</td>
                                <td><% competitions.competition.date_human %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Anmälan öppnar')}}</td>
                                <td><% competitions.competition.signups_opening_date_human %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Sista anmälningsdatum')}}</td>
                                <td><% competitions.competition.signups_closing_date_human %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Start tid')}}</td>
                                <td><% competitions.competition.start_time_human %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Final tid')}}</td>
                                <td><% competitions.competition.final_time_human %></td>
                            </tr>
                            <tr>
                                <td width="40%">{{_('Vapengrupper')}}</td>
                                <td>
                                    <span ng-repeat="weaponclass in competitions.competition.weaponclasses" class="label label-default margin-right-5 inline-block"><% weaponclass.classname %></span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="panel-body text-center">
                    <button ng-click="competitions.save()" ng-show="competitions.wizard.current_step == competitions.wizard.max_steps" class="btn btn-primary text-uppercase">{{_('')}}</button>
                </div>
            </div>

            <div class="panel-footer">
                <div class="row">
                    <div class="col-xs-6">
                        <button ng-click="competitions.wizardStepBackward()" ng-show="competitions.wizard.current_step > 1" class="btn btn-default">{{_('Tillbaka')}}</button>
                    </div>
                    <div class="col-xs-6 text-right">
                        <button ng-click="competitions.wizardStepForward()" ng-show="competitions.wizard.current_step < competitions.wizard.max_steps" class="btn btn-primary">{{_('Nästa steg')}}</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel panel-primary" ng-if="competitions.competition && competitions.competition.id">
            <div class="panel-heading">{{_('Din tävling har skapats!')}}</div>
            <div class="panel-body text-center">
                <button ng-click="competitions.create();" class="btn btn-primary margin-top-30 margin-bottom-30">{{_('Skapa ny tävling')}}</button>
                <p><a ui-sref="competitions.admin.index({competitions_id: competitions.competition.id})">{{_('Administrera tävlingen')}}</a></p>
            </div>
        </div>
    </div>
</div>

<div class="row" ng-if="competitions.adminerror">
    <div class="col-sm-6 col-sm-offset-3">
        <div class="panel panel-primary">
            <div class="panel-heading">{{_('Skapa ny tävling')}}</div>
            <div class="panel-body">
                <% competitions.adminerror %>
            </div>
            <div class="panel-footer text-right">
                <button ui-sref="club.admins" class="btn btn-primary">{{_('Visa administratörer för din förening')}}</button>
            </div>
        </div>
    </div>
</div>

<script type="text/ng-template" id="CreateChampionshipModal.html">

    <div class="modal-header">
        <h3 class="modal-title">{{_('Skapa mästerskap')}}</h3>
    </div>

    <div class="modal-body">
        <input type="text" ng-model="modalcontroller.championship.name" class="form-control" placeholder="{{_('Mästerskapets namn')}}">
    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.save()">{{_('Skapa mästerskap')}}</button>
            </div>
        </div>
    </div>
</script>
