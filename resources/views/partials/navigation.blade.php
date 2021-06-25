@if(\Auth::user()->activation_code)
	<div class="alert alert-warning margin-0 text-center">
		Din e-postadress är ej verifierad ännu och ditt konto riskeras att bli nedstängt om du inte verifierar inom kort.
	</div>
@endif

<nav class="navbar navbar-default margin-bottom-10">
	<div class="container-fluid">
		<div class="row">
			<div class="col-sm-12">
				
				<div class="navbar-header">
					<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
						<span class="sr-only">{{_('Toggle navigation')}}</span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
					</button>
					<a class="navbar-brand" ui-sref="dashboard"><img src="{{url('img/webshooter-logo.png')}}" class="logo"></a>
				</div>
		
				<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
					<ul class="nav navbar-nav navbar-right" ng-if="!authenticated">
						<li><a ui-sref="auth.register">{{_('Registrera')}}</a></li>
						<li><a ui-sref="auth.login">{{_('Logga in')}}</a></li>
					</ul>
					<ul class="nav navbar-nav navbar-right" ng-if="authenticated">
						<li>
							<a href="http://support.webshooter.se" target="_self">
								<i class="fa fa-question-circle"></i> {{_('Support')}}
							</a>
						</li>
						@if(\Auth::user()->is_admin)
						<li class="dropdown">
							<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
								<i class="fa fa-gears"></i> {{_('Administration')}} <span class="caret"></span>
							</a>
							<ul class="dropdown-menu">
								<li>
									<a ui-sref="admin.dashboard">{{_('Översikt')}}</a>
								</li>
								<li>
									<a ui-sref="admin.users.index">{{_('Användare')}}</a>
								</li>
								<li>
									<a ui-sref="admin.signups.index">{{_('Anmälningar')}}</a>
								</li>
								<li>
									<a ui-sref="admin.districts.index">{{_('Kretsar')}}</a>
								</li>
								</li>
						 <li ng-class="{'primary'}">
 						<a style="cursor:pointer;" <button type="button" onclick="window.location='{{ url('/skapa') }}'">Skapa förening</button> </a>
 						</li>
								<li>
									<a ui-sref="admin.clubs.index">{{_('Föreningar')}}</a>
								</li>
								
								<li>
									<a ui-sref="admin.invoices.index">{{_('Fakturor')}}</a>
								</li>
							</ul>
						</li>
						@endif
						
						<li class="dropdown">
							<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
								<i class="fa fa-user"></i> {{_('Ditt konto')}} <span class="caret"></span>
							</a>
							<ul class="dropdown-menu">
								<li class="dropdown-header">
									{{\Auth::user()->fullname}}<br>{{\Auth::user()->email}}
								</li>
								<li class="divider"></li>
								<li>
									<a ui-sref="settings.index">{{_('Inställningar')}}</a>
								</li>
								<li>
									<a ui-sref="club.information">{{_('Din förening')}}</a>
								</li>
								@if(count(\Auth::user()->DistrictsAdmin))
								<li>
									<a ui-sref="districts.index">{{_('Dina kretsar')}}</a>
								</li>
								@endif
								<li>
									<a ui-sref="signups">{{_('Dina anmälningar')}}</a>
								</li>
								<li>
									<a ui-sref="invoices.index">{{_('Dina personliga fakturor')}}</a>
								</li>
								<li class="divider"></li>
								<li ng-class="{'active': (currentRoute=='dashboard')}">
									<a ui-sref="dashboard">{{_('Om Webshooter')}}</a>
								</li>
								<li class="divider"></li>
								<li>
									<a ui-sref="auth.logout">
										<img src="/img/loader-blue.gif" class="img-responsive pull-left margin-top-2 margin-right-4 hide" ng-class="{'show': loadingState == 'auth.logout'}" width="17" height="17">
										<i class="fa fa-power-off" ng-class="{'hide': loadingState == 'auth.logout'}"></i> {{_('Logga ut')}}
									</a>
								</li>
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>

	<hr class="margin-0">

	<div class="navbar-sub" ng-if="authenticated">
		<div class="container-fluid">
			<div class="row">
				<div class="col-sm-12">
					<ul class="nav navbar-nav">
						<li class="secondary"><a ui-sref="competitions.create">{{_('')}}</a></li>
					</ul>
					<ul class="nav navbar-nav navbar-right margin-right-0">
						<li ng-class="{'active': (currentRoute=='competitions' || currentRoute=='competition.show')}">
							<a ui-sref="competitions">{{_('Tävlingar')}}</a>
						</li>
						<li ng-class="{'primary'}">
 						<a style="cursor:pointer;" <button type="button" onclick="window.location='{{ url('/map') }}'">Karta över tävlingar</button> </a>
 						</li>
						<li ng-class="{'active': (currentRoute=='championships')}">
							<a ui-sref="championships.index">{{_('Mästerskap')}}</a>
						</li>
						<li ng-class="{'active': (currentRoute=='signups' || currentRoute=='signup' || currentRoute=='signup.edit')}">
							<a ui-sref="signups">{{_('Dina anmälningar')}}</a>
						</li>
						<li ng-class="{'active': (currentRoute=='club' || currentRoute=='club.information')}">
							<a ui-sref="club.information">{{_('Din förening')}}</a>
						</li>
				</ul>
				</div>
			</div>
		</div>
	</div>
</nav>
