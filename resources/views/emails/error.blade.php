@include('emails.templates.header')

<table class="container">
	<tr>
		<td>
		<h1>{{_('Error')}} - {{$section}}</h1>
		
		<h3>{{ _('User') }}</h3>
		<strong>ID:</strong> {{$user->id}}<br>
		<strong>{{ _('E-mail') }}:</strong> {{$user->email}}<br>
		<strong>{{ _('Name') }}:</strong> {{$user->name}} {{$user->lastname}}<br>
		<strong>{{ _('Admin') }}:</strong> {{($user->is_admin) ? _('Yes') : _('No')}}<br>		

		<h3>{{ _('Request data') }}</h3>
		<strong>{{ _('Date') }}: </strong>{{ date('Y-m-d H:i:s') }}<br>
		<strong>{{ _('IP') }}: </strong>{{$ip}}<br>
		<strong>{{ _('Server') }}: </strong>{{$server}}<br>
		
		@if($section === 'backend')
			<strong>{{ _('Url') }}: </strong>{{$url}}

			<h3>{{ _('Exception data') }}</h3>
			<strong>{{_('Exception type')}}: </strong>{{$exceptionType}}<br><br>
			<strong>{{_('Stack trace')}}: </strong>{{$exception}}
		@else

			<h3>{{_('Error data')}}</h3>
			<strong>{{_('Error message')}}: </strong>{{$error}}<br>
			<strong>{{_('Cause')}}: </strong>{{$cause}}
			
		@endif
		</td>
	</tr>
</table>

@include('emails.templates.footer')