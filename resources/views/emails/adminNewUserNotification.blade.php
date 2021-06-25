@include('emails.templates.header')

<table class="container">
	<tr>
		<td>
			<table class="body twelve columns">
				<tr>
					<td class="panel" valign="top">

						<h3 style="font-weight: 200;">{{_("En ny användare har registrerat sig med följande uppgifter")}}!</h3>
						{{_('Id')}}: {{$user->id}}<br>
						{{_('Förnamn')}}: {{$user->name}}<br>
						{{_('Efternamn')}}: {{$user->lastname}}<br>
						{{_('E-post')}}: {{$user->email}}<br>
						{{_('Registreringsdatum')}}: {{$user->created_at}}<br>
						{{_('Blev aktiv')}}: {{date('Y-m-d H:i:s')}}<br>
					</td>
					<td class="expander"></td>
				</tr>
			</table>
		</td>
	</tr>
</table>

@include('emails.templates.footer')