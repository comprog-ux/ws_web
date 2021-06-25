@include('emails.templates.header')

<table class="container">
	<tr>
		<td>
			<table class="body twelve columns">
				<tr>
					<td class="panel" valign="top">
						<h3 style="font-weight: 200;">{{_('Välkommen').' '.$user->name}}!</h3>
						<p>{{_('Kom igång med ditt konto genom att använda knappen nedan.')}}</p>

						<table class="button" style="margin-top: 20px;">
							<tr>
								<td>
									<a href="{{url('/auth/activate/'.$user->activation_code)}}">
										{{_('Aktivera ditt konto')}}
									</a>
								</td>
							</tr>
						</table>

						<p style="margin-top: 30px;">
							{{_("Om du inte kan klicka på knappen ovan, kopiera och klistra in den här länken i din webbläsare")}}:
							<br>
							<br>
							<strong>{{ url('/auth/activate/'.$user->activation_code) }}</strong>
						</p>
					</td>
					<td class="expander"></td>
				</tr>
			</table>
		</td>
	</tr>
</table>


@include('emails.templates.footer')