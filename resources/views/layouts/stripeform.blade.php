@include('layouts.header')
	<div class="container-fluid">
		<div class="row">
			<div class="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
				@include('alerts.partials._flashdata')
				@include('alerts.partials._angulardata')
				
				<div class="row margin-top-30">
					<div class="col-sm-8 col-sm-offset-2">
						<h1 class="text-light margin-0">{{_('Betalning')}}</h1>
						<div class="alert alert-info margin-top-20">
							{{_('Det är dags att förnya ert abonnemang genom en inbetalning. ')}}
						</div>
						
						<div class="well well-white">
							<h3 class="text-light margin-top-0">{{$user->venue->name}}</h3>
							<span class="text-muted">
							{{$user->venue->street}}<br>
							{{$user->venue->street_co}}<br>
							{{$user->venue->zip_code}} {{$user->venue->city}}
							</span>
							<table class="table table-condensed margin-0 margin-top-20">
								<tfoot>
									<tr>
										<td><h3 class="margin-0 text-light">Totalt</h3></td>
										<td class="text-right"><h3 class="margin-0 text-light">900 kr</h3></td>
									</tr>
								</tfoot>
								<tbody>
									<tr>
										<td colspan="2">{{_('Förlängning av konto hos Bokabygdegard.se')}}</td>
									</tr>
									<tr>
										<td>Pris</td>
										<td class="text-right">12 mån á 60 kr</td>
									</tr>
									<tr>
										<td>Summa</td>
										<td class="text-right">720 kr</td>
									</tr>
									<tr>
										<td>Moms (25%)</td>
										<td class="text-right">180 kr</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div class="well well-white">
							<script type="text/javascript" src="https://js.stripe.com/v2/"></script>
							<script type="text/javascript">
							Stripe.setPublishableKey('{{$stripe_pk}}');
							var stripeResponseHandler = function(status, response) {
								var $form = $('#payment-form');
								if (response.error) {
									// Show the errors on the form
									$form.find('.payment-errors').text(response.error.message);
									$form.find('button').prop('disabled', false);
								} else {
									// token contains id, last4, and card type
									var token = response.id;
									// Insert the token into the form so it gets submitted to the server
									$form.append($('<input type="hidden" name="stripeToken" />').val(token));
									// and re-submit
									$form.get(0).submit();
								}
							};
							jQuery(function($) {
								$('#payment-form').submit(function(e) {
									var $form = $(this);
									// Disable the submit button to prevent repeated clicks
									$form.find('button').prop('disabled', true);
									Stripe.card.createToken($form, stripeResponseHandler);
									// Prevent the form from submitting with the default action
									return false;
								});
							});
							</script>
							
							<form method="POST" action="{{route('payment.update')}}" class="form" id="payment-form">
								<input type="hidden" name="_token" value="{{ csrf_token() }}">
								<span class="payment-errors"></span>
								<div class="row form-group">
									<div class="col-sm-12">
										<label>{{_('Namn')}}</label>
										<input type="text" class="form-control input-lg" data-stripe="name"/>
									</div>
								</div>
								<div class="row form-group">
									<div class="col-sm-12">
										<label>{{_('Kortnummer')}}</label>
										<input type="text" class="form-control input-lg" size="20" data-stripe="number"/>
									</div>
								</div>
								<div class="row form-group">
									<div class="col-sm-4">
										<label>{{_('CVC')}}</label>
										<input type="text" class="form-control input-lg" size="4" data-stripe="cvc"/>
									</div>
									<div class="col-sm-4">
										<label>{{_('Månad')}}</label>
										<select class="form-control input-lg" name="exp-month" data-stripe='exp-month'>
											@foreach($months as $index=>$month)
												<option value="{{$index}}">{{$month}}</option>
											@endforeach
										</select>
									</div>
									<div class="col-sm-4">
										<label>{{_('År')}}</label>
										<select class="form-control input-lg" name="exp-year" data-stripe='exp-year'>
											@foreach($years as $index=>$year)
												<option value="{{$index}}">{{$year}}</option>
											@endforeach
										</select>
									</div>
								</div>
								<div class="row">
									<div class="col-sm-12">
										Du kommer att debiteras 900 kr per år tills du avbryter din prenumeration. Tidigare avgifter återbetalas inte när du avbryter om det inte krävs enligt lag. Dina betalningsuppgifter är krypterade och säkra. Alla belopp visas i SEK och moms ingår med 180 kr.
									</div>
								</div>
								<div class="row margin-top-20">
									<div class="col-sm-12">
										<button type="submit" class="btn btn-lg btn-primary">{{_('Betala nu')}}</button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
@include('layouts.footer')