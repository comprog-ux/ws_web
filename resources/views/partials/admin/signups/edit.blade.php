<div class="row" ng-if="signup.signup">
    <div class="col-sm-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Anmälan')}}
            </div>
            <div class="panel-body">
                <div ng-if="signup.signup | isEmpty">
                    {{_('Anmälan verkar inte finnas tillgänglig eller så har du inte administratörsbehörighet.')}}
                </div>
               <form role="form" novalidate="">
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Förening')}}</div>
                        <div class="col-sm-7">
                            <div ng-if="signup.signup.club" style="margin-bottom: 10px;">
                                Vald klubb: <% signup.signup.club.name %> <a ng-click="signup.removeClubAssociation(signup.signup)" href="javascript:void(0)">(Ta bort koppling)</a>
                            </div>
                            <script type="text/ng-template" id="customTemplate.html">
                                <a ng-class="{'line-through disabled': match.model.alreadySelected == true}">
                                    <% match.model.clubs_nr %> <% match.model.name %>
                                </a>
                            </script>
                            <input type="text"
                                   class="form-control"
                                   ng-model="signup.searchQuery"
                                   placeholder="{{_('Sök efter förening för att ändra...')}}"
                                   ng-model-options="{debounce: 300}"
                                   uib-typeahead="searchclub for searchclubs in signup.searchForClubs($viewValue);"
                                   typeahead-template-url="customTemplate.html"
                                   typeahead-on-select="signup.selectClub($item);">
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-5 padding-top-5">{{_('Vapenklass')}}</div>
                        <div class="col-sm-7">
                            <select ng-model="signup.signup.weaponclasses_id" class="form-control"
                            ng-options="class.id as class.classname for class in signup.weaponclasses"></select>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-sm-6">
                            <button class="btn btn-default" ui-sref="admin.signups.show({signup_id: signup.signup.id})">{{_('Avbryt')}}</button>
                        </div>
                        <div class="col-sm-6 text-right">
                            <button class="btn btn-primary" ng-click="signup.saveSignup(signup.signup)">{{_('Spara')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

</div>