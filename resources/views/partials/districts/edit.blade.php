<div class="panel panel-default hide" ng-class="{'show': !(district.district | isEmpty)}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Uppdatera Förenings information')}}</div>
        </div>
    </div>

    <div class="panel-body">
        <form role="form" name="settingsForm" novalidate="">
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Namn')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.name" ng-enter="district.updateClub()" placeholder="{{_('Namn')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Nummer')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.districts_nr" ng-enter="district.updateClub()" placeholder="{{_('Nummer')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('E-postadress')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.email" ng-enter="district.updateClub()" placeholder="{{_('E-postadress')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Telefon')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.phone" ng-enter="district.updateClub()" placeholder="{{_('Telefonnummer')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Adress')}}</div>
                <div class="col-sm-8">
                    <div class="row">
                        <div class="col-sm-12">
                            <input type="text" class="form-control" ng-model="district.district.address_street" ng-enter="district.updateClub()" placeholder="{{_('Adress')}}">
                        </div>
                    </div>
                    <div class="row margin-top-10">
                        <div class="col-sm-12">
                            <input type="text" class="form-control" ng-model="district.district.address_street_2" ng-enter="district.updateClub()" placeholder="{{_('c/o')}}">
                        </div>
                    </div>

                    <div data-ng-show="settingsForm.address_zipcode.$error.pattern" class="alert alert-danger alert-dismissible margin-top-10" role="alert">
                        <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                        {{_('Ditt postnummer verkar ha fel format')}}
                    </div>

                    <div class="row margin-top-10">
                        <div class="col-sm-4">
                            <input type="text" class="form-control" id="address_zipcode" name="address_zipcode" ng-enter="district.updateClub()" ng-model="district.district.address_zipcode" ng-pattern="/^(\d{5}-\d{4}|\d{5})$/" required="" placeholder="{{_('Postnr')}}">
                        </div>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" ng-model="district.district.address_city" ng-enter="district.updateClub()" placeholder="{{_('Postort')}}">
                        </div>
                    </div>
                    {{--
                    <div class="row margin-top-10">
                        <div class="col-sm-12">
                            <input type="text" class="form-control" ng-model="district.district.address_country" ng-enter="district.updateClub()" placeholder="{{_('Land')}}">
                        </div>
                    </div>
                    --}}
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Swish')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.swish" ng-enter="district.updateClub()" placeholder="{{_('Swish')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Bankgiro')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.bankgiro" ng-enter="district.updateClub()" placeholder="{{_('Bankgiro')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Postgiro')}}</div>
                <div class="col-sm-8"><input type="text" class="form-control" ng-model="district.district.postgiro" ng-enter="district.updateClub()" placeholder="{{_('Postgiro')}}"></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-sm-4 padding-top-5">{{_('Logotyp')}}</div>
                <div class="col-sm-8">
                    <input type="file" id="district-logo">

                    <img ng-src="<% district.district.logo_url %>" ng-if="district.district.logo_url" class="img-responsive margin-top-20">
                </div>
            </div>
        </form>

        <hr>

        <div class="row">
            <div class="col-sm-6">
                <a href="" ui-sref="districts.show" class="btn btn-default">{{_('Avbryt')}}</a>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" ng-click="district.update();">{{_('Spara')}}</button>
            </div>
        </div>
    </div>
</div>
