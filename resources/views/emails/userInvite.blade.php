@include('emails.templates.header')
<table class="container">
	<tr>
		<td>
			<table class="body twelve columns">
				<tr>
					<td class="panel" valign="top">
						<h3 style="font-weight: 200;">{{_('Välkommen').' '.$invite->name}}!</h3>
						{{$invite->user->name}} {{_('är användare hos Webshooter och vill gärna bjuda in dig.')}}

						@if($invite->message)
							<p>
								******<br>
							<?php echo nl2br($invite->message); ?>
								<br>******
							</p>
						@endif

						{{_('Kom igång och registrera ditt konto genom att använda knappen nedan.')}}

						<table class="button" style="margin-top: 20px;">
							<tr>
								<td>
									<a href="{{url('/auth/register/'.$invite->invite_token)}}">
										{{_('Registrera ditt konto')}}
									</a>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>

@include('emails.templates.footer')