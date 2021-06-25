<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Föreningar')}} | <% districts.district.name %>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-3">
                            <ul class="nav nav-pills nav-stacked">

                                <li>
                                    <a ui-sref="admin.districts.index">
                                        {{_('Alla kretsar')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute=='admin.districts.show'}">
                                    <a ui-sref="admin.districts.show({id: districts.district.id})">
                                        {{_('Information')}}
                                    </a>
                                </li>
                                <li ng-class="{'active': currentRoute=='admin.districts.show.clubs'}">
                                    <a ui-sref="admin.districts.show.clubs({id: districts.district.id})">
                                        <span class="badge pull-right"><% districts.district.clubs.length %></span>
                                        {{_('Föreningar')}}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div class="col-sm-9">
                            <div ui-view="main">
                                <table class="table table-bordered">
                                    <tbody>
                                    <tr>
                                        <td>{{_('Namn')}}</td>
                                        <td><% districts.district.name %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Nummer')}}</td>
                                        <td><% districts.district.districts_nr %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('E-postadress')}}</td>
                                        <td><% districts.district.email %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Telefon')}}</td>
                                        <td><% districts.district.phone %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Adress')}}</td>
                                        <td class="break-lines"><% districts.district.address_combined %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Swish')}}</td>
                                        <td><% districts.district.swish %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Bankgiro')}}</td>
                                        <td><% districts.district.bankgiro %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Postgiro')}}</td>
                                        <td><% districts.district.postgiro %></td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>