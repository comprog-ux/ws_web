@include('emails.templates.header')

<table class="container">
    <tr>
        <td>
            <table class="body twelve columns">
                <tr>
                    <td class="panel wrapper" valign="top">
                        <h3 style="font-weight: 200;">{{_('Hej').' '.$user->name}}!</h3>
                        <p style="margin-top:20px"><?php echo nl2br($notification->content); ?></p>

                        <table class="block-grid three-up">
                            <tr>
                                <td class="four offset-by-four sub-columns last">
                                    <table class="button" style="margin-top: 20px;">
                                        <tr>
                                            <td>
                                                <a href="{{url($notification->link)}}">
                                                    {{_('Logga in')}}
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td class="expander"></td>
                            </tr>
                        </table>

                        <p style="margin-top: 30px;">
                            {{_("Om du inte kan klicka på knappen ovan, kopiera och klistra in den här länken i din webbläsare")}}:
                            <br>
                            <br>
                            <strong>{{ url($notification->link) }}</strong>
                        </p>
                    </td>
                    <td class="expander"></td>
                </tr>
            </table>
        </td>
    </tr>
</table>


@include('emails.templates.footer')