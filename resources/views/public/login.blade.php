<div class="row">
	<div class="col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
		
		<div class="panel panel-primary">
			<div class="panel-heading">
				{{_('Logga in')}}
			</div>
			<div class="panel-body">
				<div ng-class="{'hide': loggingIn}">
					<div class="form-group">
						<input type="text" name="email" ng-model="auth.email" id="email" class="form-control" placeholder="{{_('E-postadress')}}" ng-enter="login();" autofocus>
					</div>
					<div class="form-group">
						<input type="password" name="password" ng-model="auth.password" class="form-control" placeholder="{{_('Lösenord')}}" ng-enter="login();">
					</div>

					<a class="btn btn-success btn-block" ng-click="login();" ng-class="{'disabled': loggingIn}">{{_('Logga in')}}</a>
					<div class="row margin-top-20">
						<div class="col-sm-12 text-center">
							<a ui-sref="auth.password">{{_('Glömt ditt lösenord?')}}</a>
						</div>
					</div>
					<div class="row margin-top-20">
						<div class="col-sm-12 text-center">
							<a ui-sref="auth.register">{{_('Inget konto? Registrera dig')}} &raquo;</a>
						</div>
					</div>

				</div>
				<div class="hide text-center text-muted" ng-class="{show: loggingIn}">
					<i class="fa fa-2x fa-spinner fa-spin"></i>
					<p>{{_('Loggar in')}}</p>
				</div>
			</div>
		</div>
		
	</div>
</div>

<script>$('#email').focus();</script>
