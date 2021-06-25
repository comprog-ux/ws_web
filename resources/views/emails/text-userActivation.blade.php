@include('emails.templates.text-header')

{{_('Välkommen').' '.$user->name}}

{{_('Kom igång med ditt konto genom att använda länken nedan.')}}

{{_('Aktivera ditt konto')}}: [{{url('/auth/activate/'.$user->activation_code)}}]

@include('emails.templates.text-footer')