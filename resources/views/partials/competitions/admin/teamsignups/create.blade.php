<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12">{{_('Skapa ett nytt lag')}}</div>
        </div>
    </div>

    <div class="panel-body">
        <div class="row">
            <div class="col-sm-8">
                <div class="row">
                    <div class="col-sm-12">
                        <label>{{_('Förening')}}</label>
                        <script type="text/ng-template" id="customTemplate.html">
                            <a><% match.model.clubs_nr %> <% match.model.name %></a>
                        </script>
                        <input type="text"
                               class="form-control"
                               ng-model="signups.searchQuery"
                               placeholder="{{_('Sök efter förening...')}}"
                               ng-model-options="{debounce: 300}"
                               uib-typeahead="searchclub for searchclubs in signups.searchForClubs($viewValue);"
                               typeahead-template-url="customTemplate.html"
                               typeahead-on-select="signups.selectClub($item);">
                    </div>
                </div>
                <div ng-if="signups.selectedClub">
                    <p class="margin-top-10">Vald förening: <% signups.selectedClub.name %></p>
                    <hr>
                    <div class="row form-group">
                        <div class="col-sm-12">
                            <label>{{_('Lagets namn')}}</label>
                            <input type="text" ng-model="signups.addTeam.name" class="form-control">
                        </div>
                    </div>
                    <div class="row form-group">
                        <div class="col-sm-4">
                            <label>{{_('Vapengrupp')}}</label>
                        </div>
                        <div class="col-sm-8">
                            <select ng-model="signups.addTeam.weapongroups_id" ng-options="weapongroup.id as weapongroup.name for weapongroup in signups.competitions.weapongroups" class="form-control">
                                <option value="">{{_('Välj vapengrupp')}}</option>
                            </select>
                        </div>
                    </div>
                    <hr>
                    <div class="row form-group">
                        <div class="col-sm-4">
                            <label>{{_('Första skytt')}}</label>
                        </div>
                        <div class="col-sm-8">
                            <select
                                    ng-model="signups.addTeam.teams_signups_first"
                                    ng-options="
                                        signup.id as ('('+signup.weaponclass.classname+') '+signup.user.fullname)
                                        for signup in signups.signups_ordinary_available
                                         | filterByWeapongroupsId:signups.addTeam.weapongroups_id:(competitions.competitions.championships_id)
                                         | excludeByIds:[
                                            signups.addTeam.teams_signups_second,
                                            signups.addTeam.teams_signups_third,
                                            signups.addTeam.teams_signups_fourth,
                                            signups.addTeam.teams_signups_fifth]
                                         | orderBy:user.fullname:true
                                     " class="form-control">
                                <option value="">{{_('Välj användare')}}</option>
                            </select>
                        </div>
                    </div>

                    <div class="row form-group">
                        <div class="col-sm-4">
                            <label>{{_('Andra skytt')}}</label>
                        </div>
                        <div class="col-sm-8">
                            <select
                                    ng-model="signups.addTeam.teams_signups_second"
                                    ng-options="
                                        signup.id as ('('+signup.weaponclass.classname+') '+signup.user.fullname)
                                        for signup in signups.signups_ordinary_available
                                         | filterByWeapongroupsId:signups.addTeam.weapongroups_id:(competitions.competitions.championships_id)
                                         | excludeByIds:[
                                            signups.addTeam.teams_signups_first,
                                            signups.addTeam.teams_signups_third,
                                            signups.addTeam.teams_signups_fourth,
                                            signups.addTeam.teams_signups_fifth]
                                         | orderBy:user.fullname:true
                                     " class="form-control">
                                <option value="">{{_('Välj användare')}}</option>
                            </select>
                        </div>
                    </div>

                    <div class="row form-group" ng-if="
                        signups.addTeam.weapongroups_id != 4
                        && signups.addTeam.weapongroups_id != 5
                        && signups.addTeam.weapongroups_id != 6">
                        <div class="col-sm-4">
                            <label>{{_('Tredje skytt')}}</label>
                        </div>
                        <div class="col-sm-8">
                            <select
                                    ng-model="signups.addTeam.teams_signups_third"
                                    ng-options="
                                        signup.id as ('('+signup.weaponclass.classname+') '+signup.user.fullname)
                                        for signup in signups.signups_ordinary_available
                                         | filterByWeapongroupsId:signups.addTeam.weapongroups_id:(competitions.competitions.championships_id)
                                         | excludeByIds: [
                                            signups.addTeam.teams_signups_first,
                                            signups.addTeam.teams_signups_second,
                                            signups.addTeam.teams_signups_fourth,
                                            signups.addTeam.teams_signups_fifth]
                                         | orderBy:user.fullname:true
                                     " class="form-control">
                                <option value="">{{_('Välj användare')}}</option>
                            </select>
                        </div>
                    </div>

                    <div class="row form-group">
                        <div class="col-sm-4">
                            <label>{{_('Första reserv')}}</label>
                        </div>
                        <div class="col-sm-8">
                            <select
                                    ng-model="signups.addTeam.teams_signups_fourth"
                                    ng-options="
                                        signup.id as ('('+signup.weaponclass.classname+') '+signup.user.fullname)
                                        for signup in signups.signups_reserve_available
                                         | filterByWeapongroupsId:signups.addTeam.weapongroups_id:(competitions.competitions.championships_id)
                                         | excludeByIds:[
                                            signups.addTeam.teams_signups_first,
                                            signups.addTeam.teams_signups_second,
                                            signups.addTeam.teams_signups_third,
                                            signups.addTeam.teams_signups_fifth
                                            ]
                                         | orderBy:user.fullname:true
                                     " class="form-control">
                                <option value="">{{_('Välj användare')}}</option>
                            </select>
                        </div>
                    </div>

                    <div class="row form-group">
                        <div class="col-sm-4">
                            <label>{{_('Andra reserv')}}</label>
                        </div>
                        <div class="col-sm-8">
                            <select
                                    ng-model="signups.addTeam.teams_signups_fifth"
                                    ng-options="
                                        signup.id as ('('+signup.weaponclass.classname+') '+signup.user.fullname)
                                        for signup in signups.signups_reserve_available
                                         | filterByWeapongroupsId:signups.addTeam.weapongroups_id:(competitions.competitions.championships_id)
                                         | excludeByIds:[
                                            signups.addTeam.teams_signups_first,
                                            signups.addTeam.teams_signups_second,
                                            signups.addTeam.teams_signups_third,
                                            signups.addTeam.teams_signups_fourth
                                            ]
                                         | orderBy:user.fullname:true
                                     " class="form-control">
                                <option value="">{{_('Välj användare')}}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <hr ng-if="signups.selectedClub">
        <div class="row" ng-if="signups.selectedClub">
            <div class="col-sm-6">
                <button ng-click="signups.cancelTeam()" class="btn btn-default">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button ng-click="signups.createTeam()" class="btn btn-primary">{{_('Skapa laget')}}</button>
            </div>
        </div>
    </div>
</div>

