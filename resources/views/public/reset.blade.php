<div class="row">
	<div class="col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
		<div class="panel panel-primary">
			<div class="panel-heading">
				{{_('Återställning av ditt lösenord')}}
			</div>
			<div class="panel-body">
				<div ng-class="{'hide': passwordRequested}">
					<div class="form-group">
						<label for="email">{{_('E-postadress')}}</label>
						<input class="form-control" type="email" ng-model="reset.email" placeholder="{{_('E-postadress')}}" id="email" ng-enter="resetPassword();">
					</div>

					<div class="form-group">
						<label for="password">{{_('Nytt lösenord')}}</label>
						<input class="form-control" type="password" ng-model="reset.password" placeholder="{{_('Lösenord')}}" id="password" ng-enter="resetPassword();">
					</div>

					<div class="form-group">
						<label for="password_confirmation">{{_('Bekräfta ditt nya lösenord')}}</label>
						<input class="form-control" type="password" ng-model="reset.password_confirmation" placeholder="{{_('Bekräfta ditt lösenord')}}" id="password_confirmation" ng-enter="resetPassword();">
					</div>

					<div class="margin-top-10">
						<button class="btn btn-success btn-block" ng-class="{'disabled': resettingPassword}" ng-click="resetPassword();">
							{{_('Skapa ett nytt lösenord')}}
						</button>
					</div>
				</div>
				<div class="hide text-center text-muted" ng-class="{show: passwordRequested}">
					<i class="fa fa-2x fa-check"></i>
					<h3>{{_('Ditt lösenord har sparats.')}}</h3>
					<p>
						{{_('Återgå till inloggning för att komma åt ditt konto')}}.
					</p>
					<p>
						<a ui-sref="auth.login">{{_('Gå till inloggningen')}}</a>
					</p>
				</div>
			</div>
		</div>

	</div>
</div>

<script>$('#email').focus();</script>