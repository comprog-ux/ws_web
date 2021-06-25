<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-danger">
            <div class="panel-heading">
                {{_('Inaktivera ditt konto')}}
            </div>

            <div class="panel-body">
                <div class="row">
                    <div class="col-sm-12 text-center">
                        {{_('Du kommer nu att inaktivera ditt konto.')}}<br>
                        {{_('Är du säker att du vill fortsätta?')}}<br>
                        <button class="btn btn-danger margin-top-30 margin-bottom-30" ng-click="settings.cancelaccount()">{{_('Inaktivera ditt konto')}}</button>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-sm-6">
                        <button class="btn btn-default" ui-sref="settings.user">{{_('Avbryt')}}</button>
                    </div>
                    <div class="col-sm-6 text-right">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

