<div class="row">
	<div class="col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
		<div class="panel panel-primary">
			<div class="panel-heading">
				{{_('Återställ ditt lösenord')}}
			</div>
			<div class="panel-body">
				<div ng-class="{'hide': passwordRequested}">
					<div class="form-group">
						<label for="email">{{_('E-postadress')}}</label>
						<input class="form-control" type="text" ng-model="reset.email" placeholder="{{_('E-postadress')}}" id="email" ng-enter="requestPasswordReset();">
					</div>

					<button class="btn btn-success btn-block" ng-class="{'disabled': requestingPasswordReset}" ng-click="requestPasswordReset();">
						{{_('Skicka lösenordsåterställning länk')}}
					</button>
					<div class="form-group margin-top-20">
						<div class="col-md-12 text-center">
							<a ui-sref="auth.login">{{_('Inloggningen')}} &raquo;</a>
						</div>
					</div>

				</div>
				<div class="hide text-center text-muted" ng-class="{show: passwordRequested}">
					<i class="fa fa-2x fa-check"></i>
					<h3>{{_('Återställningslänken är på väg.')}}</h3>
					<p>
						{{_('Vi har skickat ett återställningmail till din e-postadress')}}.<br>
						{{_('Använd länken i mailet för att återställa ditt lösenord.')}}
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