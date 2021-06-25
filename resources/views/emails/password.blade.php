@include('emails.templates.header')

<table class="container">
	<tr>
		<td>
			<table class="body twelve columns">
				<tr>
					<td class="center panel" align="center" valign="top">
						<center>
							<h4>{{_('Återställ ditt lösenord')}}</h4>

							<table class="button" style="margin-top: 20px;">
								<tr>
									<td>
										<a href="{{ url('/auth/reset/'.$token) }}">
											{{_('Klicka här för att skapa nytt lösenord')}}
										</a>
									</td>
								</tr>
							</table>

							<p style="margin-top: 30px;">
								{{_("Om du inte kan klicka på knappen ovan, kopiera och klistra in den här länken i din webbläsare")}}:
								<br>
								<br>
								<strong>{{ url('/auth/reset/'.$token) }}</strong>
							</p>
						</center>
					</td>
					<td class="expander"></td>
				</tr>
			</table>
		</td>
	</tr>
</table>

@include('emails.templates.footer')