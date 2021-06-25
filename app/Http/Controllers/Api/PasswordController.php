<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\ResetsPasswords;
use Illuminate\Support\Facades\Password;
use Illuminate\Mail\Message;

class PasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Password Reset Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password reset requests
    | and uses a simple trait to include this behavior. You're free to
    | explore this trait and override any methods you wish to tweak.
    |
    */

    use ResetsPasswords;

    /**
     * Create a new password controller instance.
     *
     * @return void
     */
    public function __construct()
    {
    }

    /**
     * Send a reset link to the given user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function postEmail(\Illuminate\Http\Request $request)
    {
        $this->validate($request, ['email' => 'required|email']);

        $response = Password::sendResetLink($request->only('email'), function (Message $message) {
            $message->from(env('MAIL_USERNAME'), env('MAIL_FROMNAME'));
        });

        switch ($response):
            case Password::RESET_LINK_SENT:
                return response()->json(['status' => 'success', 'message' => _("Vi har skickat en lösenordsåterställning länk till din e-postadress!")]);

            case Password::INVALID_USER:
                return response()->json(['status' => 'failure', 'email' => trans($response)], 422);
        endswitch;
    }

    /**
     * Reset the given user's password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function postReset(\Illuminate\Http\Request $request)
    {
        $this->validate($request, [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:6',
        ]);

        $credentials = $request->only(
            'email', 'password', 'password_confirmation', 'token'
        );

        $response = Password::reset($credentials, function ($user, $password) {
            $this->resetPassword($user, $password);
        });

        switch ($response):
            case Password::PASSWORD_RESET:
                return response()->json(['status' => 'success', 'message' => _("Ditt lösenord har uppdaterats. Du kan nu använda ditt nya lösenord för att logga in.")]);
            default:
                return response()->json(['status' => 'failure', 'email' => trans($response)], 422);
        endswitch;
    }
}
