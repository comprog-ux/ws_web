
<div class="row">
    <div class="col-sm-12">
        <div class="row">
            <div class="col-sm-6">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        {{_('Koppla dig till en förening')}}
                    </div>

                    <div class="panel-body">

                        <div class="row">
                            <div class="col-sm-12"><label>{{_('Namn på din förening')}}</label></div>
                        </div>
                        <div class="row">
                            <script type="text/ng-template" id="customTemplate.html">
                                <a ng-class="{'line-through disabled': match.model.alreadySelected == true}">
                                    <% match.model.clubs_nr %> <% match.model.name %>
                                </a>
                            </script>
                            <div class="col-sm-12">
                                <input type="text"
                                       class="form-control"
                                       ng-model="club.searchQuery"
                                       placeholder="{{_('Sök efter din förening...')}}"
                                       ng-model-options="{debounce: 300}"
                                       uib-typeahead="searchclub for searchclubs in club.searchForClubs($viewValue, club.club);"
                                       typeahead-loading="loadingClubs"
                                       typeahead-no-results="noMatchingClubs"
                                       typeahead-template-url="customTemplate.html"
                                       typeahead-on-select="club.selectClub($item);">
                            </div>
                            <div class="col-sm-12 text-muted padding-top-5">
                                <div class="row hide" ng-class="{'show': loadingClubs}">
                                    <div class="col-sm-12">
                                        <p>
                                            {{_('Söker efter din förening')}}...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row hide" ng-class="{'show': noMatchingClubs && club.searchQuery}">
                            <div class="col-sm-12">
                                <h3>{{_('Föreningen finns inte.')}}</h3>
                                <p class="text-danger">{{_('Var noga med att koppla dig till rätt förening då du endast kan byta förening genom att ta kontakt med oss. Finns inte föreningen eller om du vill skapa en ny, ta kontakt med oss.')}}</p>
                                
                            </div>
                        </div>

                        <div class="row hide" ng-class="{'show': !noMatchingClubs && club.new_club}">
                            <div class="col-sm-12">
                                <h3>{{_('Vill du koppla dig till följande förening?')}}</h3>
                                <p class="text-danger">{{_('Var noga med att koppla dig till rätt förening då du endast kan byta förening genom att ta kontakt med oss.')}}</p>
                                <table class="table">
                                    <tr>
                                        <td width="25%">{{_('Föreningsnamn')}}:</td>
                                        <td><b><% club.new_club.name %></b></td>
                                    </tr>
                                    <tr>
                                        <td>{{_('Föreningsnummer')}}:</td>
                                        <td><b><% club.new_club.clubs_nr %></b></td>
                                    </tr>
                                </table>
                                <button ng-click="club.addUserToClubs(club.new_club);" class="btn btn-primary">{{_('Ja, koppla mig!')}}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        {{_('Instruktion')}}
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-sm-12">
                                <p>{{_('Fyll i namnet på din förening för att söka bland befintliga föreningar. Du kan med fördel söka på delar av namnet för att sedan välja en förening ur resultatlistan.')}}</p>
                                <p>{{_('De flesta föreningar finns representerade i söklistan. Skulle din förening mot all förmodan inte hittas ta kontakt med oss.')}}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
