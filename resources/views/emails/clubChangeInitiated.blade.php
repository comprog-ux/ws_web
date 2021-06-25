@include('emails.templates.header')
<table class="container">
	<tr>
		<td>
			<table class="body twelve columns">
				<tr>
					<td class="panel" valign="top">
						<h3 style="font-weight: 200; margin-bottom: 20px;">{{_('Hej')}}!</h3>
						<p>{{$clubChange->User->fullname}} {{_('har begärt att byta till er förening.')}}</p>

						<p>{{_('Du kan godkänna eller avslå begäran via länken nedan.')}}</p>

						<table class="button" style="margin-top: 20px;">
							<tr>
								<td>
									<a href="{{url('/app/club/users/clubChanges')}}">
										{{_('Granska begäran')}}
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