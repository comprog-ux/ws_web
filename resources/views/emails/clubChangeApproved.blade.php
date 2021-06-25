@include('emails.templates.header')
<table class="container">
	<tr>
		<td>
			<table class="body twelve columns">
				<tr>
					<td class="panel" valign="top">
						<h3 style="font-weight: 200; margin-bottom: 20px;">{{_('Hej')}}!</h3>
						<p>Ditt föreningsbyte har blivit godkänt och du är nu medlem i {{$clubChange->ToClub->name}}.</p>

						<table class="button" style="margin-top: 20px;">
							<tr>
								<td>
									<a href="{{url('/')}}">
										{{_('Logga in på Webshooter')}}
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