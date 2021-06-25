<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Sammanslå förening')}}
            </div>
            <div class="panel-body">
                {{_('Nedan kan du se vilka föreningar du kommer att sammanslå. OBS! Detta går ej att ångra!')}}.
            </div>

            <div class="row margin-bottom-10">
                <div class="col-sm-6 col-sm-offset-6">
                    <script type="text/ng-template" id="customTemplate.html">
                        <a ng-class="{'line-through disabled': match.model.alreadySelected == true}">
                            <% match.model.clubs_nr %> <% match.model.name %>
                        </a>
                    </script>
                    <input type="text"
                           class="form-control"
                           ng-model="clubs.searchQuery"
                           placeholder="{{_('Sök efter en förening...')}}"
                           ng-model-options="{debounce: 300}"
                           uib-typeahead="searchclub for searchclubs in clubs.searchForClubs($viewValue, clubs.selectedclub);"
                           typeahead-loading="loadingClubs"
                           typeahead-no-results="noMatchingClubs"
                           typeahead-template-url="customTemplate.html"
                           typeahead-on-select="clubs.selectClub($item);">
                    </div>
                </div>

            <div class="row">
                <div class="col-sm-6">

                    <table class="table table-striped">
                        <tr>
                            <td>{{_('Föreningsnamn')}}</td>
                            <td><% clubs.club.name %></td>
                        </tr>
                        <tr>
                            <td>{{_('Id')}}</td>
                            <td><% clubs.club.id %></td>
                        </tr>
                        <tr>
                            <td>{{_('Skapades')}}</td>
                            <td><% clubs.club.created_at %></td>
                        </tr>
                        <tr>
                            <td>{{_('Föreningsnummer')}}</td>
                            <td><% clubs.club.clubs_nr %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal användare')}}</td>
                            <td><% clubs.club.users_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal administratörer')}}</td>
                            <td><% clubs.club.admins_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal tävlingar')}}</td>
                            <td><% clubs.club.competitions_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal anmälningar')}}</td>
                            <td><% clubs.club.signups_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Adress')}}</td>
                            <td class="break-lines"><% clubs.club.address_combined %></td>
                        </tr>
                    </table>
                </div>

                <div class="col-sm-6">
                    <div class="alert alert-danger hide" ng-class="{'show': clubs.selectedclub.id == clubs.club.id}">
                        {{_('Detta är samma klubb som du visar just nu')}}
                    </div>
                    <table class="table table-striped" ng-if="!(clubs.selectedclub | isEmpty)">
                        <tr>
                            <td>{{_('Föreningsnamn')}}</td>
                            <td><% clubs.selectedclub.name %></td>
                        </tr>
                        <tr>
                            <td>{{_('Id')}}</td>
                            <td><% clubs.selectedclub.id %></td>
                        </tr>
                        <tr>
                            <td>{{_('Skapades')}}</td>
                            <td><% clubs.selectedclub.created_at %></td>
                        </tr>
                        <tr>
                            <td>{{_('Föreningsnummer')}}</td>
                            <td><% clubs.selectedclub.clubs_nr %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal användare')}}</td>
                            <td><% clubs.selectedclub.users_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal administratörer')}}</td>
                            <td><% clubs.selectedclub.admins_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal tävlingar')}}</td>
                            <td><% clubs.selectedclub.competitions_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Antal anmälningar')}}</td>
                            <td><% clubs.selectedclub.signups_count %></td>
                        </tr>
                        <tr>
                            <td>{{_('Adress')}}</td>
                            <td class="break-lines"><% clubs.selectedclub.address_combined %></td>
                        </tr>
                    </table>
                    <div class="alert alert-info" ng-if="clubs.selectedclub | isEmpty">{{_('Sök efter förening att sammanslå till')}}</div>
                </div>
            </div>
            <div class="panel-body hide" ng-class="{'show': clubs.selectedclub.id != clubs.club.id}"">
                <div class="row">
                    <div class="col-sm-6 text-left">
                        <button class="btn btn-danger" ng-if="!(clubs.selectedclub | isEmpty)" ng-click="clubs.mergeClubs(clubs.selectedclub.id, clubs.club.id)">{{_('Sammanfoga till denna')}}</button>
                    </div>
                    <div class="col-sm-6 text-right">
                        <button class="btn btn-danger" ng-if="!(clubs.selectedclub | isEmpty)" ng-click="clubs.mergeClubs(clubs.club.id, clubs.selectedclub.id)">{{_('Sammanfoga till denna')}}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>