<div class="panel panel-default hide" ng-class="{'show': !(club.club | isEmpty)}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Uppdatera Förenings information')}}</div>
        </div>
    </div>

    <div class="panel-body">
        <form role="form" name="settingsForm" novalidate="">
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Namn')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.name" ng-enter="club.updateClub()" placeholder="{{_('Namn')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Nummer')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.clubs_nr" ng-enter="club.updateClub()" placeholder="{{_('Nummer')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Krets')}}</div>
                <div class="col-sm-8">
                    <select ng-model="club.club.districts_id" ng-options="district.id as district.name for district in club.districts" class="form-control"></select>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('E-postadress')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.email" ng-enter="club.updateClub()" placeholder="{{_('E-postadress')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Telefon')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.phone" ng-enter="club.updateClub()" placeholder="{{_('Telefonnummer')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Adress')}}</div>
                <div class="col-sm-8">
                    <div class="row">
                        <div class="col-sm-12">
                            <input type="text" class="form-control" ng-model="club.club.address_street" ng-enter="club.updateClub()" placeholder="{{_('Adress')}}">
                        </div>
                    </div>
                    <div class="row margin-top-10">
                        <div class="col-sm-12">
                            <input type="text" class="form-control" ng-model="club.club.address_street_2" ng-enter="club.updateClub()" placeholder="{{_('c/o')}}">
                        </div>
                    </div>

                    <div data-ng-show="settingsForm.address_zipcode.$error.pattern" class="alert alert-danger alert-dismissible margin-top-10" role="alert">
                        <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                        {{_('Ditt postnummer verkar ha fel format')}}
                    </div>

                    <div class="row margin-top-10">
                        <div class="col-sm-4">
                            <input type="text" class="form-control" id="address_zipcode" name="address_zipcode" ng-enter="club.updateClub()" ng-model="club.club.address_zipcode" ng-pattern="/^(\d{5}-\d{4}|\d{5})$/" required="" placeholder="{{_('Postnr')}}">
                        </div>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" ng-model="club.club.address_city" ng-enter="club.updateClub()" placeholder="{{_('Postort')}}">
                        </div>
                    </div>
                    {{--
                    <div class="row margin-top-10">
                        <div class="col-sm-12">
                            <input type="text" class="form-control" ng-model="club.club.address_country" ng-enter="club.updateClub()" placeholder="{{_('Land')}}">
                        </div>
                    </div>
                    --}}
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Swish')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.swish" ng-enter="club.updateClub()" placeholder="{{_('Swish')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Bankgiro')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.bankgiro" ng-enter="club.updateClub()" placeholder="{{_('Bankgiro')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Postgiro')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="club.club.postgiro" ng-enter="club.updateClub()" placeholder="{{_('Postgiro')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Medlemmar får skapa personliga fakturor')}}</div>
                <div class="col-sm-8">
                    <input type="checkbox" class="checkbox" name="disable_personal_invoices" ng-model="club.club.disable_personal_invoices" ng-true-value="0" ng-false-value="1"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Logotyp')}}</div>
                <div class="col-sm-8">
                    <input type="file" id="club-logo">

                    <img ng-src="<% club.club.logo_url %>" ng-if="club.club.logo_url" class="img-responsive margin-top-20">
                </div>
            </div>
        </form>

        <hr>

        <div class="row">
            <div class="col-sm-6">
                <a href="" ui-sref="club.information" class="btn btn-default">{{_('Avbryt')}}</a>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" ng-click="club.updateClub();">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</div>
