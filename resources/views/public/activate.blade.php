<div class="row">
	<div class="col-sm-4 col-sm-offset-4">
		<div class="panel panel-primary">
			<div class="panel-heading">
				{{_('Aktivera ditt konto')}}
			</div>
			<div class="panel-body">
				<div ng-class="{'hide': activated}">
					<div class="form-group">
						<label for="email">{{_('Aktiverings kod')}}</label>
						<input class="form-control" type="text" ng-model="activate.token" placeholder="{{_('Kod')}}" id="token" ng-enter="verifyToken();">
					</div>

					<div class="form-group" ng-if="no_password">
						<label>{{_('Lösenord')}} *</label>
						<input type="password" class="form-control" name="password" ng-model="activate.password">
					</div>

					<div class="form-group" ng-if="no_password">
						<label>{{_('Bekräfta lösenord')}} *</label>
							<input type="password" class="form-control" name="password_confirmation" ng-model="activate.password_confirmation">
					</div>


					<button class="btn btn-success btn-block" ng-class="{'disabled': !activate.token}" ng-click="verifyToken();">
						{{_('Aktivera nu')}}
					</button>
				</div>

				<div class="hide" ng-class="{'show': activated}">
					<h3>{{_('Ditt konto är nu aktivt.')}}</h3>
					<p>
						{{_('Du kan nu logga in med hjälp av din e-postadress och tidigare valt lösenord.')}}.<br>
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