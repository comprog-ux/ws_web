<form role="form" name="settingsForm" novalidate="">
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('För- och efternamn')}}</div>
        <div class="col-sm-8">
            <div class="row">
                <div class="col-sm-6">
                    <input type="text" class="form-control" ng-model="userprofile.userprofile.name" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Förnamn')}}">
                </div>
                <div class="col-sm-6">
                    <input type="text" class="form-control" ng-model="userprofile.userprofile.lastname" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Efternamn')}}">
                </div>
            </div>
        </div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('E-postadress')}}</div>
        <div class="col-sm-8"><input type="text" class="form-control" ng-model="userprofile.userprofile.email" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('E-postadress')}}"></div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Mobiltelefon')}}</div>
        <div class="col-sm-8"><input type="text" class="form-control" ng-model="userprofile.userprofile.mobile" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Mobiltelefon')}}"></div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Hemtelefon')}}</div>
        <div class="col-sm-8"><input type="text" class="form-control" ng-model="userprofile.userprofile.phone" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Hemtelefon')}}"></div>
    </div>
    <hr>
    {{--
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Adress')}}</div>
        <div class="col-sm-8">
            <div class="row">
                <div class="col-sm-12">
                    <input type="text" class="form-control" ng-model="userprofile.userprofile.address_street" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Adress')}}">
                </div>
            </div>
            <div class="row margin-top-10">
                <div class="col-sm-12">
                    <input type="text" class="form-control" ng-model="userprofile.userprofile.address_street_2" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('c/o')}}">
                </div>
            </div>

            <div data-ng-show="settingsForm.address_zipcode.$error.pattern" class="alert alert-danger alert-dismissible margin-top-10" role="alert">
                <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <strong>{{_('Ditt postnummer verkar ha fel format')}}</strong>
            </div>

            <div class="row margin-top-10">
                <div class="col-sm-4">
                    <input type="text" class="form-control" id="address_zipcode" name="address_zipcode" ng-enter="userprofile.saveUserprofile()" ng-model="userprofile.userprofile.address_zipcode" ng-pattern="/^(\d{5}-\d{4}|\d{5})$/" required="" placeholder="{{_('Postnr')}}">
                </div>
                <div class="col-sm-8">
                    <input type="text" class="form-control" ng-model="userprofile.userprofile.address_city" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Postort')}}">
                </div>
            </div>
            <div class="row margin-top-10">
                <div class="col-sm-12">
                    <input type="text" class="form-control" ng-model="userprofile.userprofile.address_country" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Land')}}">
                </div>
            </div>
        </div>
    </div>
    <hr>
    --}}
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Kön')}}</div>
        <div class="col-sm-8">
            <select class="form-control" ng-model="userprofile.userprofile.gender">
                <option value="" ng-if="!userprofile.userprofile.gender">{{_('Välj kön')}}</option>
                <option value="male">{{_('Man')}}</option>
                <option value="female">{{_('Kvinna')}}</option>
            </select>
        </div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Födelseår')}}</div>
        <div class="col-sm-8">
            <select ng-model="userprofile.userprofile.birthday" ng-options="n for n in [] | range:{{date('Y')}}:{{date('Y', strtotime('-110 years'))}}" class="form-control">
                <option value="">{{_('Välj födelseår')}}</option>
            </select>
        </div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Pistolskyttekortsnummer')}}</div>
        <div class="col-sm-8">
            <input type="text" class="form-control" ng-model="userprofile.userprofile.shooting_card_number" ng-enter="userprofile.saveUserprofile()" placeholder="{{_('Pistolskyttekortsnummer')}}">
            <div class="margin-top-10" ng-if="!userprofile.userprofile.shooting_card_number">
            <label for="no_shooting_card_number" ng-if="!userprofile.userprofile.no_shooting_card_number">
                <input type="checkbox" ng-model="userprofile.userprofile.set_no_shooting_card_number" id="no_shooting_card_number" ng-true-value="1", ng-false-value=""> {{_('Jag har inte fått mitt pistolskyttekortsnummer ännu')}}
            </label>
                <span ng-if="userprofile.userprofile.no_shooting_card_number">{{_('Du har angett att du inte har fått pistolskyttekortsnummer sedan')}} <% userprofile.userprofile.no_shooting_card_number | dateToISO | date : 'yyyy-MM-dd' %></span>
            </div>
        </div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Klass banskjutning')}}</div>
        <div class="col-sm-8">
            <select ng-model="userprofile.userprofile.grade_trackshooting" class="form-control">
                <option value="" ng-if="!userprofile.userprofile.grade_trackshooting">{{_('Välj klass')}}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
            </select>
        </div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-4 padding-top-5">{{_('Klass fält')}}</div>
        <div class="col-sm-8">
            <select ng-model="userprofile.userprofile.grade_field" class="form-control">
                <option value="" ng-if="!userprofile.userprofile.grade_field">{{_('Välj klass')}}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
            </select>
        </div>
    </div>
    <hr>
    <div class="row">
        <div class="col-sm-6">
            <button class="btn btn-default" ng-click="userprofile.cancelUserprofile()">{{_('Avbryt')}}</button>
        </div>
        <div class="col-sm-6 text-right">
            <button class="btn btn-primary" ng-click="userprofile.saveUserprofile()">{{_('Spara')}}</button>
        </div>
    </div>
</form>