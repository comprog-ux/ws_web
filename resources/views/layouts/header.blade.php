<!DOCTYPE html>
<html lang="sv" ng-app="app">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Webshooter.se är ett webbaserat system som tillgodoser behoven av medlem- och resultathantering för föreningar, medlemmar och eventuella överliggande förbund.">
	<title>Webshooter.se</title>

	<link rel="apple-touch-icon" sizes="57x57" href="/img/icon/apple-icon-57x57.png">
	<link rel="apple-touch-icon" sizes="60x60" href="/img/icon/apple-icon-60x60.png">
	<link rel="apple-touch-icon" sizes="72x72" href="/img/icon/apple-icon-72x72.png">
	<link rel="apple-touch-icon" sizes="76x76" href="/img/icon/apple-icon-76x76.png">
	<link rel="apple-touch-icon" sizes="114x114" href="/img/icon/apple-icon-114x114.png">
	<link rel="apple-touch-icon" sizes="120x120" href="/img/icon/apple-icon-120x120.png">
	<link rel="apple-touch-icon" sizes="144x144" href="/img/icon/apple-icon-144x144.png">
	<link rel="apple-touch-icon" sizes="152x152" href="/img/icon/apple-icon-152x152.png">
	<link rel="apple-touch-icon" sizes="180x180" href="/img/icon/apple-icon-180x180.png">
	<link rel="icon" type="image/png" sizes="192x192"  href="/img/icon/android-icon-192x192.png">
	<link rel="icon" type="image/png" sizes="32x32" href="/img/icon/favicon-32x32.png">
	<link rel="icon" type="image/png" sizes="96x96" href="/img/icon/favicon-96x96.png">
	<link rel="icon" type="image/png" sizes="16x16" href="/img/icon/favicon-16x16.png">
	<link rel="manifest" href="/img/icon/manifest.json">
	<meta name="msapplication-TileColor" content="#ffffff">
	<meta name="msapplication-TileImage" content="/img/icon/ms-icon-144x144.png">
	<meta name="theme-color" content="#ffffff">

	
	@if(env('APP_ENV') != 'local' && env('APP_REPORT_ERROR'))
	<script>Raven.config('{{env('RAVEN_DSN')}}', {release: '{{env('API_VERSION')}}'}).addPlugin(Raven.Plugins.Angular).setTagsContext({environment: "{{env('APP_ENV')}}"}).install();</script>
	@endif


	<script>app.value('ApiEndpointUrl', '{{url('/api/v')}}{{env('API_VERSION')}}/');</script>
	<script>app.value('xcsrftoken', '{{ csrf_token() }}');</script>
	<script>app.value('oauthClientSecret', '{{ env('API_CLIENT_SECRET') }}');</script>
	{{-- FONTS --}}
	<link href='https://fonts.googleapis.com/css?family=Lato:300,400,700' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Montserrat:300,400,700' rel='stylesheet' type='text/css'>

	<!--[if lt IE 9]>
		<script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
		<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
	<![endif]-->
</head>
<body>
@if(env('APP_ENV') != 'production')
	<div class="alert alert-danger margin-0 text-center">
		Denna version av Webshooter är avsedd för test och demo. Använd <a href="https://webshooter.se">webshooter.se</a> för riktiga tävlingar och anmälningar.
	</div>
@endif
