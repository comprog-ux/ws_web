<script src="https://www.google.com/recaptcha/api.js?onload=vcRecaptchaApiLoaded&render=explicit" async defer></script>
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2 col-lg-6 col-lg-offset-3">
            <div class="panel panel-primary">
                <div class="panel-heading">{{_('Registrera dig')}}</div>
                <div class="panel-body">
                    <div class="alert alert-danger hide" ng-class="{'show': error}">
                        {{_('Ett eller flera obligatoriska fält har inte fyllts i korrekt. Vänligen kontrollera att allt är korrekt ifyllt med information i alla fält.')}}
                    </div>
                    <div ng-class="{'hide': registerState}">

                        <div class="form-horizontal">
                            <div class="form-group">
                                <label class="col-md-5 control-label">{{_('Förnamn')}} *</label>

                                <div class="col-md-7">
                                    <input type="text" class="form-control" name="name" ng-model="auth.name">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-md-5 control-label">{{_('Efternamn')}} *</label>

                                <div class="col-md-7">
                                    <input type="text" class="form-control" name="lastname" ng-model="auth.lastname">
                                </div>
                            </div>
                            <hr>
                            <div class="form-group">
                                <label class="col-md-5 control-label">{{_('E-postadress')}} *</label>

                                <div class="col-md-7">
                                    <input type="email" class="form-control" name="email" ng-model="auth.email">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-md-5 control-label">{{_('Bekräfta e-postadress')}} *</label>

                                <div class="col-md-7">
                                    <input type="email" class="form-control" name="email_confirmation" ng-model="auth.email_confirmation">
                                </div>
                            </div>
                            <hr>
                            <div class="form-group">
                                <label class="col-md-5 control-label">{{_('Lösenord')}} *</label>

                                <div class="col-md-7">
                                    <input type="password" class="form-control" name="password" ng-model="auth.password">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-md-5 control-label">{{_('Bekräfta lösenord')}} *</label>

                                <div class="col-md-7">
                                    <input type="password" class="form-control" name="password_confirmation" ng-model="auth.password_confirmation">
                                </div>
                            </div>

                            <hr>

                            <div class="row form-group has-feedback">
                                <div class="col-md-12 text-center">
                                    <label for="terms">
                                        <input type="checkbox" required ng-model="auth.terms" id="terms"> {{_('Jag godkänner')}} <a href="" ng-click="termsModalOpen()">{{_('användarvillkoren')}}</a> <span class="text-muted">*</span>
                                    </label>
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="col-sm-12">
                                    <div style="margin: 0 auto; width: 304px;">
                                        <div ng-model="auth.recaptcharesponse" vc-recaptcha key="'{{_(env('RECAPTCHA_PUBLIC_KEY'))}}'"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="col-md-12 text-center">
                                    <button type="submit" class="btn btn-primary" ng-click="register();">
                                        <i class="fa fa-btn fa-user margin-right-5"></i>{{_('Gå med')}}
                                    </button>
                                </div>
                            </div>
                            <div class="form-group margin-top-20">
                                <div class="col-md-12 text-center">
                                    <a ui-sref="auth.login">{{_('Redan medlem? Logga in istället')}} &raquo;</a>
                                </div>
                            </div>
                            <div class="row form-group">
                                <div class="col-sm-8 col-sm-offset-2 text-muted text-center">
                                    <small>{{_('Som registrerad användare på Webshooter.se är du föremål för de användningsvillkoren som bland annat förbjuder kommersiell användning av denna webbplats.')}}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="hide text-center text-muted" ng-class="{show: registerState == 'registering'}">
                        <i class="fa fa-2x fa-spinner fa-spin"></i>
                        <p>{{_('Registrerar dig som användare')}}</p>
                    </div>

                    <div class="hide text-center text-muted" ng-class="{show: registerState == 'done'}">
                        <i class="fa fa-2x fa-check"></i>
                        <h3>{{_('Tack för din registrering.')}}</h3>
                            <p>
                                {{_('Vi har skickat ett aktiveringsmail till din e-postadress')}}.<br>
                                {{_('Använd länken i mailet för att slutföra din registrering.')}}<br>
                            </p>
                            <p class="text-muted">
                                {{_('Beroende på diverse inställningar kan mailet hamna i din skräpkorg. Om inget mail dyker upp alls inom några minuter skicka gärna ett meddelande till support@webshooter.se.')}}
                            </p>
                            <p>
                                <a ui-sref="auth.login" class="btn btn-primary">{{_('Gå till inloggningen')}}</a>
                            </p>
                    </div>

                </div>
            </div>
        </div>
    </div>
</div>
