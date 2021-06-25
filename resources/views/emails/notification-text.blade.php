@include('emails.templates.text-header')

{{_('Hej').' '.$user->name}}!

{{$notification->content}}

{{url($notification->link)}}

@include('emails.templates.text-footer')