<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Inställningar')}}
            </div>
            <div class="panel-body">

                <div class="row">
                    <div class="col-sm-3">
                        <ul class="nav nav-pills nav-stacked">

                            <li ng-class="{'active': (currentRoute == 'settings.user' || currentRoute == 'settings.editprofile')}">
                                <a ui-sref="settings.user">
                                    {{_('Personlig information')}}
                                </a>
                            </li>

                            <li ng-class="{'active': (currentRoute == 'settings.userpasswrod')}">
                                <a ui-sref="settings.password">
                                    {{_('Ditt lösenord')}}
                                </a>
                            </li>

                            <li ng-class="{'active': currentRoute == 'settings.invite'}">
                            <a ui-sref="settings.invite">
                                    {{_('Bjud in någon till Webshooter')}}
                                </a>
                            </li>

                        </ul>
                    </div>
                    <div class="col-sm-9">
                        <div ui-view="setting"></div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>
