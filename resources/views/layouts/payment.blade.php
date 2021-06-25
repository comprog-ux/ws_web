@extends('app')
@section('content')

	<div class="row">
		<div class="col-sm-12">
			<h1 class="text-light margin-0">{{_('Betalning')}}</h1>
		</div>
	</div>

	<div class="well well-white margin-top-20">
		<h3 class="text-light margin-top-0">{{_('Tack! Ditt konto är betald')}}</h3>
		{{_('En betalning har genomförts och ditt konto är aktivt fram till följande datum:')}}
		<h4 class="text-light margin-bottom-0">{{$user->venue->paid_until}}</h4>
	</div>

@stop