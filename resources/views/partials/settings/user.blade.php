<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                    {{_('Personlig information')}}
            </div>

        <div class="panel-body">
                <div class="row">
                    <div class="col-sm-4">{{_('För- och efternamn')}}</div>
                    <div class="col-sm-8"><% userprofile.userprofile.name %> <% userprofile.userprofile.lastname %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('E-postadress')}}</div>
                    <div class="col-sm-8"><% userprofile.userprofile.email %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('Mobiltelefon')}}</div>
                    <div class="col-sm-8"><% userprofile.userprofile.mobile %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('Hemtelefon')}}</div>
                    <div class="col-sm-8"><% userprofile.userprofile.phone %></div>
                </div>
                <hr>
                {{--
                <div class="row">
                    <div class="col-sm-4">{{_('Adress')}}</div>
                    <div class="col-sm-8 break-lines"><% userprofile.userprofile.address_combined %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('Kön')}}</div>
                    <div class="col-sm-8">
                        <div class="hide" ng-class="{'show': !userprofile.userprofile.gender}">
                            -
                        </div>
                        <div class="hide" ng-class="{'show': userprofile.userprofile.gender}">
                            <% (userprofile.userprofile.gender == 'male') ? '{{_('Man')}}' : '{{_('Kvinna')}}' %>
                        </div>
                    </div>
                </div>
                <hr>
                --}}
                <div class="row">
                    <div class="col-sm-4">{{_('Födelseår')}}</div>
                    <div class="col-sm-8"><% (userprofile.userprofile.birthday) ? userprofile.userprofile.birthday : '-' %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('Pistolskyttekortsnummer')}}</div>
                    <div class="col-sm-8"><% (userprofile.userprofile.shooting_card_number) ? userprofile.userprofile.shooting_card_number : '-' %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('Klass banskjutning')}}</div>
                    <div class="col-sm-8"><% (userprofile.userprofile.grade_trackshooting) ? userprofile.userprofile.grade_trackshooting : '-' %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-4">{{_('Klass fält')}}</div>
                    <div class="col-sm-8"><% (userprofile.userprofile.grade_field) ? userprofile.userprofile.grade_field : '-' %></div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-6">
                        <a ui-sref="settings.editprofile" class="btn btn-primary">{{_('Ändra din information')}}</a>
                    </div>
                    <div class="col-sm-6 text-right">
                        <a href="" ui-sref="settings.cancelaccount" class="text-danger">{{_('Inaktivera ditt konto')}}</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>