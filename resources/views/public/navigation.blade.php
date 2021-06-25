<nav class="navbar navbar-default margin-bottom-20">
	<div class="container">
		<div class="row">
			<div class="col-sm-12">
				
				<div class="navbar-header padding-top-20 padding-bottom-20">
					<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
						<span class="sr-only">{{_('Toggle navigation')}}</span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
					</button>
					<a class="navbar-brand" ui-sref="public.information"><img src="{{url('img/webshooter-logo.png')}}" class="logo"></a>
				</div>
		
				<div class="collapse navbar-collapse padding-top-20 padding-bottom-10" id="bs-example-navbar-collapse-1">
					<ul class="nav navbar-nav navbar-right">
						<li><a ui-sref="public.information">{{_('Information')}}</a></li>
						<li><a ui-sref="public.competitions">{{_('Tävlingar')}}</a></li>
						<li ng-class="{'primary'}">
 						<a style="cursor:pointer;" <button type="button" onclick="window.location='{{ url('/map') }}'">Karta över tävlingar</button> </a>
 						</li>
						<li><a href="http://support.webshooter.se" target="_self">{{_('Support')}}</a></li>
						<li ng-if="!authenticated"><a ui-sref="auth.register">{{_('Registrera')}}</a></li>
						<li ng-if="!authenticated"><a ui-sref="auth.login">{{_('Logga in')}}</a></li>
						<li ng-if="authenticated"><a ui-sref="dashboard">{{_('Logga in')}}</a></li>
					</ul>
				</div>
			</div>
		</div>
	</div>

	<hr class="margin-0">

</nav>
