<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Anmälan')}}
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-12">
                            <div ui-view="main">
                                <div class="panel panel-default">
                                    <div class="panel-heading">
                                        {{_('Information')}}
                                    </div>
                                    <div class="table-responsive" ng-hide="signup.signup | isEmpty">
                                        <table class="table table-bordered">
                                            <tbody>
                                            <tr>
                                                <td>{{_('Tävling')}}</td>
                                                <td><% signup.signup.competition.name %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Användare')}}</td>
                                                <td><% signup.signup.user.fullname %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Förening')}}</td>
                                                <td><% signup.signup.club.name %></td>
                                            </tr>
                                            <tr>
                                                <td>{{_('Vapenklass')}}</td>
                                                <td><span class="label label-default margin-right-5"><% signup.signup.weaponclass.classname %></span></td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="panel-body" ng-show="signup.signup | isEmpty">
                                        {{_('Anmälan verkar inte finnas i systemet.')}}
                                    </div>

                                    <hr>
                                    <div class="panel-body">
                                        <div class="row">
                                            <div class="col-sm-6" ng-hide="signup.signup | isEmpty">
                                                <button class="btn btn-primary" ui-sref="admin.signups.show.edit({signup_id:signup.signup.id})">{{_('Ändra')}}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</ui-view>

