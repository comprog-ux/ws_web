<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{_('Ändra ditt lösenord')}}
            </div>

            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <label for="password">{{_('Ditt nuvarande lösenord')}}</label>
                            <input class="form-control" type="password" ng-model="password.reset.current_password" placeholder="{{_('Aktuellt lösenord')}}" id="password" ng-enter="password.updatePassword();">
                        </div>

                        <div class="form-group">
                            <label for="password">{{_('Nytt lösenord')}}</label>
                            <input class="form-control" type="password" ng-model="password.reset.password" placeholder="{{_('Lösenord')}}" id="password" ng-enter="password.updatePassword();">
                        </div>

                        <div class="form-group">
                            <label for="password_confirmation">{{_('Bekräfta ditt nya lösenord')}}</label>
                            <input class="form-control" type="password" ng-model="password.reset.password_confirmation" placeholder="{{_('Bekräfta ditt lösenord')}}" id="password_confirmation" ng-enter="password.updatePassword();">
                        </div>

                        <div class="margin-top-10">
                            <button class="btn btn-success" ng-click="password.updatePassword();">
                                {{_('Uppdatera ditt lösenord')}}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>