<div class="row">
    <div class="col-sm-8">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Användare')}}
            </div>
            <div class="panel-body">
                <div ng-if="club.club.user_has_role != 'admin'">
                    {{_('Du kan tyvärr inte skapa någon användare då du inte har administratörsbehörighet för din förening.')}}
                </div>
                <form role="form" name="settingsForm" novalidate="" ng-if="club.club.user_has_role =='admin'">

                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Förnamn')}}</div>
                        <div class="col-sm-7">
                            <input type="text" class="form-control" ng-model="user.user.name" ng-enter="user.saveUserprofile()" placeholder="{{_('Förnamn')}}">
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Efternamn')}}</div>
                        <div class="col-sm-7">
                            <input type="text" class="form-control" ng-model="user.user.lastname" ng-enter="user.saveUserprofile()" placeholder="{{_('Efternamn')}}">
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('E-postadress')}}</div>
                        <div class="col-sm-7">
                            <input type="text" class="form-control" ng-model="user.user.email" ng-enter="user.saveUserprofile()" placeholder="{{_('E-postadress')}}">
                            <div class="margin-top-10" ng-if="!user.user.email">
                                <label for="no_email_address" ng-if="!user.user.no_email_address">
                                    <input type="checkbox" ng-model="user.user.set_no_email_address" id="no_email_address" ng-true-value="1", ng-false-value=""> {{_('Användaren saknar e-postadress')}}
                                </label>
                                <span ng-if="user.user.no_email_address">{{_('Användaren har registrerats utan e-postadress')}}: <% user.user.no_email_address | dateToISO | date : 'yyyy-MM-dd' %></span>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Mobiltelefon')}}</div>
                        <div class="col-sm-7"><input type="text" class="form-control" ng-model="user.user.mobile" ng-enter="user.saveUserprofile()" placeholder="{{_('Mobiltelefon')}}"></div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Hemtelefon')}}</div>
                        <div class="col-sm-7"><input type="text" class="form-control" ng-model="user.user.phone" ng-enter="user.saveUserprofile()" placeholder="{{_('Hemtelefon')}}"></div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Kön')}}</div>
                        <div class="col-sm-7">
                            <select class="form-control" ng-model="user.user.gender">
                                <option value="" ng-if="!user.user.gender">{{_('Välj kön')}}</option>
                                <option value="male">{{_('Man')}}</option>
                                <option value="female">{{_('Kvinna')}}</option>
                            </select>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Födelseår')}}</div>
                        <div class="col-sm-7">
                            <select ng-model="user.user.birthday" ng-options="n for n in [] | range:{{date('Y')}}:{{date('Y', strtotime('-110 years'))}}" class="form-control">
                                <option value="">{{_('Välj födelseår')}}</option>
                            </select>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Pistolskyttekortsnummer')}}</div>
                        <div class="col-sm-7">
                            <input type="text" class="form-control" ng-model="user.user.shooting_card_number" ng-enter="user.saveUserprofile()" placeholder="{{_('Pistolskyttekortsnummer')}}">
                            <div class="margin-top-10" ng-if="!user.user.shooting_card_number">
                                <label for="no_shooting_card_number" ng-if="!user.user.no_shooting_card_number">
                                    <input type="checkbox" ng-model="user.user.set_no_shooting_card_number" id="no_shooting_card_number" ng-true-value="1", ng-false-value=""> {{_('Användaren har inte fått sitt pistolskyttekortsnummer ännu')}}
                                </label>
                                <span ng-if="user.user.no_shooting_card_number">{{_('Användaren har registrerats utan pistolskyttekortsnummer')}} <% user.user.no_shooting_card_number | dateToISO | date : 'yyyy-MM-dd' %></span>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Klass banskjutning')}}</div>
                        <div class="col-sm-7">
                            <select ng-model="user.user.grade_trackshooting" class="form-control">
                                <option value="" ng-if="!user.user.grade_trackshooting">{{_('Välj klass')}}</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Klass fält')}}</div>
                        <div class="col-sm-7">
                            <select ng-model="user.user.grade_field" class="form-control">
                                <option value="" ng-if="!user.user.grade_field">{{_('Välj klass')}}</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-6">
                            <button class="btn btn-default" ui-sref="club.users.index">{{_('Avbryt')}}</button>
                        </div>
                        <div class="col-sm-6 text-right">
                            <button class="btn btn-primary" ng-click="user.createUser(user.user)">{{_('Spara')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Instruktion')}}
            </div>
            <div class="panel-body">
                <b>{{_('E-postadress')}}</b><br>
                <p>{{_('Vi skickar ett aktiveringsmail till e-postadressen som anges. Mailet innehåller en aktiveringslänk som gör det möjlighet för användaren att aktivera sitt konto.')}}</p>
                <b>{{_('Saknas e-postadress?')}}</b><br>
                <p>{{_('I förekommande fall finns det behov att registrera användare utan e-postadress. Användaren har då inte möjlighet att logga in. Genom att redigera användare finns det möjlighet att komplettera användaren med en e-postadress.')}}</p>
            </div>
        </div>
    </div>
</div>