<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-12">{{_('Uppdatera ett lag')}}</div>
        </div>
    </div>

    <div class="panel-body">
        <div class="row">
            <div class="col-sm-8">
                <div class="row form-group">
                    <div class="col-sm-12">
                        <label>{{_('Lagets namn')}}</label>
                        <input type="text" ng-model="teamsignups.teams.name" class="form-control">
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-4">
                        <label>{{_('Vapengrupp')}}</label>
                    </div>
                    <div class="col-sm-8">
                        <select ng-model="teamsignups.teams.weapongroups_id" ng-options="weapongroup.id as weapongroup.name for weapongroup in competitions.competitions.weapongroups" class="form-control">
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
                                ng-model="teamsignups.teams.teams_signups_first"
                                ng-options="
                                    signup.id as signup.user.fullname
                                    for signup in teamsignups.signups_ordinary_available
                                     | filterByWeapongroupsId:teamsignups.teams.weapongroups_id:(competitions.competitions.championships_id)
                                     | excludeByIds:[
                                        teamsignups.teams.teams_signups_second,
                                        teamsignups.teams.teams_signups_third,
                                        teamsignups.teams.teams_signups_fourth,
                                        teamsignups.teams.teams_signups_fifth]
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
                                ng-model="teamsignups.teams.teams_signups_second"
                                ng-options="
                                    signup.id as signup.user.fullname
                                    for signup in teamsignups.signups_ordinary_available
                                     | filterByWeapongroupsId:teamsignups.teams.weapongroups_id:(competitions.competitions.championships_id)
                                     | excludeByIds:[
                                        teamsignups.teams.teams_signups_first,
                                        teamsignups.teams.teams_signups_third,
                                        teamsignups.teams.teams_signups_fourth,
                                        teamsignups.teams.teams_signups_fifth]
                                     | orderBy:user.fullname:true
                                 " class="form-control">
                            <option value="">{{_('Välj användare')}}</option>
                        </select>
                    </div>
                </div>

                <div class="row form-group" ng-if="
                    teamsignups.teams.weaponclasses_id != 4
                    && teamsignups.teams.weaponclasses_id != 5
                    && teamsignups.teams.weaponclasses_id != 6">
                    <div class="col-sm-4">
                        <label>{{_('Tredje skytt')}}</label>
                    </div>
                    <div class="col-sm-8">
                        <select
                                ng-model="teamsignups.teams.teams_signups_third"
                                ng-options="
                                    signup.id as signup.user.fullname
                                    for signup in teamsignups.signups_ordinary_available
                                     | filterByWeapongroupsId:teamsignups.teams.weapongroups_id:(competitions.competitions.championships_id)
                                     | excludeByIds:[
                                        teamsignups.teams.teams_signups_first,
                                        teamsignups.teams.teams_signups_second,
                                        teamsignups.teams.teams_signups_fourth,
                                        teamsignups.teams.teams_signups_fifth]
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
                                ng-model="teamsignups.teams.teams_signups_fourth"
                                ng-options="
                                    signup.id as signup.user.fullname
                                    for signup in teamsignups.signups_reserve_available
                                     | filterByWeapongroupsId:teamsignups.teams.weapongroups_id:(competitions.competitions.championships_id)
                                     | excludeByIds:[
                                        teamsignups.teams.teams_signups_first,
                                        teamsignups.teams.teams_signups_second,
                                        teamsignups.teams.teams_signups_third,
                                        teamsignups.teams.teams_signups_fifth]
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
                                ng-model="teamsignups.teams.teams_signups_fifth"
                                ng-options="
                                    signup.id as signup.user.fullname
                                    for signup in teamsignups.signups_reserve_available
                                     | filterByWeapongroupsId:teamsignups.teams.weapongroups_id:(competitions.competitions.championships_id)
                                     | excludeByIds:[
                                        teamsignups.teams.teams_signups_first,
                                        teamsignups.teams.teams_signups_second,
                                        teamsignups.teams.teams_signups_third,
                                        teamsignups.teams.teams_signups_fourth]
                                     | orderBy:user.fullname:true
                                 " class="form-control">
                            <option value="">{{_('Välj användare')}}</option>
                        </select>
                    </div>
                </div>

            </div>
        </div>

        <hr>
        <div class="row">
            <div class="col-sm-6">
                <button ng-click="teamsignups.cancelTeam()" class="btn btn-default">{{_('Avbryt')}}</button>
            </div>
            <div class="col-sm-6 text-right">
                <button ng-click="teamsignups.updateTeam(teamsignups.teams)" class="btn btn-primary">{{_('Spara laget')}}</button>
            </div>
        </div>
    </div>
</div>

