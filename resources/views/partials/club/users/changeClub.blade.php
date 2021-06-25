<div class="row" ng-if="user.user">
    <div class="col-sm-6">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Välj förening att byta till')}}
            </div>
        </div>
        <div class="panel-body">

            <div class="row">
                <div class="col-sm-12"><label>{{_('Namn på föreningen')}}</label></div>
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
                           ng-model="user.searchQuery"
                           placeholder="{{_('Sök efter din förening...')}}"
                           ng-model-options="{debounce: 300}"
                           uib-typeahead="searchclub for searchclubs in user.searchForClubs($viewValue, user.currentClub);"
                           typeahead-loading="loadingClubs"
                           typeahead-no-results="noMatchingClubs"
                           typeahead-template-url="customTemplate.html"
                           typeahead-on-select="user.selectClub($item);">
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

            <div class="row hide" ng-class="{'show': !noMatchingClubs && user.new_club}">
                <div class="col-sm-12">
                    <h3>{{_('Vill du initiera ett byte till följande klubb?')}}</h3>
                    <p class="text-danger">{{_('Administratörerna för föreningen måste godkänna föreningsbytet.')}}</p>
                    <table class="table">
                        <tr>
                            <td width="25%">{{_('Föreningsnamn')}}:</td>
                            <td><b><% user.new_club.name %></b></td>
                        </tr>
                        <tr>
                            <td>{{_('Föreningsnummer')}}:</td>
                            <td><b><% user.new_club.clubs_nr %></b></td>
                        </tr>
                    </table>
                    <button ng-click="user.changeClub(user.new_club);" class="btn btn-primary">{{_('Ja, initiera byte')}}</button>
                </div>
            </div>

            <hr>
            <div class="row">
                <div class="col-sm-6">
                    <button class="btn btn-default" ui-sref="club.users.index">{{_('Avbryt')}}</button>
                </div>
            </div>

        </div>
    </div>
</div>