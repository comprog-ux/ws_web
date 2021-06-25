<?php

namespace App\Http\Controllers\Api;

use App\Jobs\SendActivationEmail;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserInvite;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

use App\Http\Requests;
use Illuminate\Http\Request;

class AuthenticateController extends Controller
{
    /**
     * @param Request $request
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function authenticate(Request $request)
    {
        $credentials = $request->only('email', 'password');

        try {
            // verify the credentials and create a token for the user
            if (! $token = \JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials', 'message' => _('Vänligen kontrollera ditt användarnamn och/eller lösenord.')], 401);
            } elseif (JWTAuth::toUser($token)->activation_code && JWTAuth::toUser($token)->created_at < date('Y-m-d H:i:s', strtotime('-2 weeks'))) {
                return response()->json(['error' => 'user_inactive', 'message' => _('Din e-postadress har inte aktiverats ännu. Du bör ha ett e-postmeddelande innehållande en aktiveringslänk.')], 401);
            } elseif (JWTAuth::toUser($token)->deleted_at) {
                return response()->json(['error' => 'user_deleted', 'message' => _('Ditt konto har inaktiverats. Ta kontakt med vår kundsupport om du vill återaktivera ditt konto.')], 401);
            }
        } catch (JWTException $e) {
            // something went wrong
            return response()->json(['error' => 'could_not_create_token', 'message' => _('Någonting verkar ha gått ha fel. Prova gärna igen.')], 500);
        }
        $user = \Auth::user();
        // if no errors are encountered we can return a JWT
        return response()->json(compact('token','user'));
    }

    public function updatePassword(Requests\PasswordRequest $request)
    {
        $user = \Auth::user();
        if(\Hash::check($request->get('password'), $user->password)):
            return response()->json(['message'=>_('Nuvarande lösenord verkar inte stämma.')], 401);
        else:
            $user->update(['password'=>bcrypt($request->get('password'))]);
            return response()->json(['message'=>_('Ditt lösenord har ändrats')]);
        endif;
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuthenticatedUser(){
        $user = \Auth::user();

        $user->makeVisible([
            'email',
            'no_shooting_card_number',
            'shooting_card_number',
            'birthday',
            'phone',
            'mobile',
            'gender',
            'grade_trackshooting',
            'grade_field'
        ]);
        // the token is valid and we have found the user via the sub claim
        return response()->json(compact('user'));
    }

    public function updateAuthenticatedUser(\App\Http\Requests\UserRequest $request){
        try {

            $user = \Auth::user();
            $data = $request->all();
            if($request->has('set_no_shooting_card_number')) $data['no_shooting_card_number'] = date('Y-m-d H:i:s');
            if($request->has('shooting_card_number')) $data['no_shooting_card_number'] = null;
            $user->update($data);
            $user->makeVisible([
                'email',
                'no_shooting_card_number',
                'shooting_card_number',
                'birthday',
                'phone',
                'mobile',
                'gender',
                'grade_trackshooting',
                'grade_field'
            ]);
            return response()->json(compact('user'));

        } catch (JWTException $e) {
            if ($e instanceof TokenExpiredException) {
                return response()->json(['token_expired'], $e->getStatusCode());
            } else if ($e instanceof TokenBlacklistedException) {
                return response()->json(['token_blacklisted'], $e->getStatusCode());
            } else if ($e instanceof TokenInvalidException) {
                return response()->json(['token_invalid'], $e->getStatusCode());
            } else if ($e instanceof PayloadException) {
                return response()->json(['token_expired'], $e->getStatusCode());
            } else if ($e instanceof JWTException) {
                return response()->json(['token_invalid'], $e->getStatusCode());
            }
        }

    }

    /**
     * @param Request $request
     *
     * @return static
     */
    public function register(\App\Http\Requests\RegistrationRequest $request){

        try {
            $data = $request->all();
            $data['activation_code'] = md5($data['email'].time());
            $data['password'] = bcrypt($request->get('password'));
            $data['language'] = \App\Models\Languages::defaultLanguage();

            $user = User::create($data);

            /**
             * Get userinvite based on email address and update the invite with a timestamp.
             * If the request has an invite_token check if the token is present as an id.
             */
            $inviteQuery = Userinvite::where('email', $request->get('email'));
            if($request->has('invite_token')):
                $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
                $inviteId = $optimus->decode($request->get('invite_token'));
                $inviteQuery->orWhere('id', $inviteId);
            endif;
            if($invite = $inviteQuery->first()):
                $invite->update(['registered_at'=>$user->created_at]);
            endif;

            /**
             * Send activation e-mail
             */
            #if(env('APP_ENV') == 'production'):
                $this->dispatch(new SendActivationEmail($user));
            #endif;
            return response()->json('success');
        } catch (JWTException $e) {
            // something went wrong
            return response()->json(['error' => 'Fel vid registrering', 'message' => _('Någonting gick fel, vänligen försök igen.')], 500);
        }

    }

    public function cancelAccount()
    {
        $user = \Auth::user();
        // Remove related signups which are not invoices.
        \App\Models\Signup::whereNull('invoices_id')->where('users_id', $user->id)->delete();
        $user->deleted_at = date("Y-m-d H:i:s");
        $user->active = 0;
        $user->save();
        return response()->json(['message'=>_('Ditt konto har nu inaktiverats')]);
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh(Request $request)
    {
        try {

			$current_token = $request->get('token');
	        $current_token = JWTAuth::getToken();
	        if(!$current_token) return response()->json(null);

	        $token = JWTAuth::refresh($current_token);
	        return response()->json(compact('token'));

        } catch (JWTException $e) {
	        if ($e instanceof TokenExpiredException) {
	            return response()->json(['token_expired'], $e->getStatusCode());
	        } else if ($e instanceof TokenBlacklistedException) {
	            return response()->json(['token_blacklisted'], $e->getStatusCode());
	        } else if ($e instanceof TokenInvalidException) {
	            return response()->json(['token_invalid'], $e->getStatusCode());
	        } else if ($e instanceof PayloadException) {
	            return response()->json(['token_expired'], $e->getStatusCode());
	        } else if ($e instanceof JWTException) {
	            return response()->json(['token_invalid'], $e->getStatusCode());
			}
		}
    }

    /**
     * Confirm the user by token.
     *
     * @param  string  $token
     * @return Response
     */
    protected function activate(Request $request)
    {
        $token = $request->get('token');
        if(!$token) return response()->json(_('Tyvärr kunde vi inte utläsa din aktiveringskod.'), 400);

        if($user = User::where('activation_code', $token)->where('password','!=', '')->first()):
            $user->active = 1;
            $user->activation_code = '';
            $user->save();
            User::sendAdminNotification($user);
            return response()->json(compact('user'));
        elseif($user = User::where('activation_code', $token)->where('password', '')->first()):
            $validator = \Validator::make($request->all(), [
                'password' => 'required|min:6|confirmed',
                'token' => 'required'
            ]);
            if ($validator->fails()):
                return response()->json(['error'=>'no_password', 'message'=>_('Du behöver ange ett lösenord för ditt konto')], 400);
            else:
                $user->active = 1;
                $user->password = bcrypt($request->get('password'));
                $user->language = \App\Models\Languages::defaultLanguage();
                $user->activation_code = '';
                $user->save();
                User::sendAdminNotification($user);
                return response()->json(compact('user'));
            endif;
        else:
            return response()->json(['error'=>'invalid_code','message'=>_('Det verkar som att aktiveringskoden inte är korrekt, eller så är ditt konto redan aktivt.')], 400);
        endif;
    }

    public function getInvite()
    {
        $invites = UserInvite::where('users_id', \Auth::id())->get();
        return response()->json(['invites'=>$invites]);
    }

    public function sendInvite(\App\Http\Requests\UserInviteRequest $request)
    {
        $invite = new UserInvite;
        $invite->users_id = \Auth::user()->id;
        $invite->name = \Request::get('name');
        $invite->lastname = \Request::get('lastname');
        $invite->email = \Request::get('email');
        $invite->message = \Request::get('message');
        if($invite->save()):
            UserInvite::sendInviteEmail($invite);

            return response()->json([
                'status' 	=> 'success',
                'invites'	=> UserInvite::get()->toArray(),
                'message' 	=> _('Inbjudan har skickats')
            ]);
        endif;
    }
}