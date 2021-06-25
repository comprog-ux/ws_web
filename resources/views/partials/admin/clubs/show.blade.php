<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Föreningar')}} | <% clubs.club.name %>
                </div>
                <div class="panel-body">
                    <div class="alert alert-danger hide" ng-class="{'show': clubs.club.deleted_at}">
                        {{_('Denna förening är markerad som raderad')}}
                    </div>

                    <div class="row">
                        <div class="col-sm-3">
                            <ul class="nav nav-pills nav-stacked">

                                <li>
                                    <a ui-sref="admin.clubs.index">
                                        {{_('Alla föreningar')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute=='admin.clubs.show'}">
                                    <a ui-sref="admin.clubs.show({id: clubs.club.id})">
                                        {{_('Information')}}
                                    </a>
                                </li>
                                <li ng-class="{'active': currentRoute=='admin.clubs.show.users'}">
                                    <a ui-sref="admin.clubs.show.users({id: clubs.club.id})">
                                        <span class="badge pull-right"><% clubs.club.users.length %></span>
                                        {{_('Användare')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute=='admin.clubs.show.admins'}">
                                    <a ui-sref="admin.clubs.show.admins({id: clubs.club.id})">
                                        <span class="badge pull-right"><% clubs.club.admins.length %></span>
                                        {{_('Administratörsroller')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute=='admin.clubs.show.signups'}">
                                    <a ui-sref="admin.clubs.show.signups({id: clubs.club.id})">
                                        <span class="badge pull-right"><% clubs.club.signups.length %></span>
                                        {{_('Anmälningar')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute=='admin.clubs.show.teams'}">
                                    <a ui-sref="admin.clubs.show.teams({id: clubs.club.id})">
                                        <span class="badge pull-right"><% clubs.club.teams.length %></span>
                                        {{_('Lag')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': (currentRoute=='admin.clubs.show.invoices'||currentRoute=='admin.clubs.show.invoices.incoming'||currentRoute=='admin.clubs.show.invoices.outgoing')}">
                                    <a ui-sref="admin.clubs.show.invoices({id: clubs.club.id})">
                                        <span class="badge pull-right"><% clubs.club.invoices_incoming.length + clubs.club.invoices_outgoing.length %></span>
                                        {{_('Fakturaöversikt')}}
                                    </a>
                                </li>

                                <li ng-class="{'active': currentRoute=='admin.clubs.show.merge'}">
                                    <a ui-sref="admin.clubs.show.merge({id: clubs.club.id})">
                                        {{_('Sammanslå med annan förening')}}
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
                                        <td><% clubs.club.name %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Nummer')}}</td>
                                        <td><% clubs.club.clubs_nr %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Krets')}}</td>
                                        <td><% clubs.club.district.districts_nr+' '+clubs.club.district.name %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('E-postadress')}}</td>
                                        <td><% clubs.club.email %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Telefon')}}</td>
                                        <td><% clubs.club.phone %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Adress')}}</td>
                                        <td class="break-lines"><% clubs.club.address_combined %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Swish')}}</td>
                                        <td><% clubs.club.swish %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Bankgiro')}}</td>
                                        <td><% clubs.club.bankgiro %></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Postgiro')}}</td>
                                        <td><% clubs.club.postgiro %></td>
                                    </tr>
                                    </tbody>
                                </table>
                                <a ui-sref="admin.clubs.show.edit({id: clubs.club.id})" class="btn btn-primary">{{_('Redigera')}}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>