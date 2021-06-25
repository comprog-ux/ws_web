<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Jobs\SendActivationEmail;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserClubChange;

class ClubUsersController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(\App\Http\Requests\UserRequest $request)
    {
        $user = \Auth::user();

        if($user->clubs->first()->user_has_role != 'admin') return response()->json(['message'=>_('Du saknad administrationsbehörighet för din förening')], 403);

        $data = $request->all();
        if($request->has('set_no_shooting_card_number')) $data['no_shooting_card_number'] = date('Y-m-d H:i:s');
        if($request->has('shooting_card_number')) $data['no_shooting_card_number'] = null;
        if($request->has('set_no_email_address')) $data['no_email_address'] = date('Y-m-d H:i:s');
        if($request->has('email')) $data['no_email_address'] = null;

        if($request->has('email')) $data['activation_code'] = md5($data['email'].time());
        if($request->has('password')) $data['password'] = bcrypt($request->get('password'));
        $data['language'] = \App\Models\Languages::defaultLanguage();

        $item = User::create($data);
        $item->Clubs()->attach($user->clubs_id);
        if(env('APP_ENV') == 'production' && $request->has('email')):
            $this->dispatch(new SendActivationEmail($item));
        endif;
        return response()->json(_('Användaren har skapats'));
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $user = \Auth::user();

        if($user->clubs->first()->user_has_role != 'admin') return response()->json(['message'=>_('Du saknad administrationsbehörighet för din förening')], 403);

        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId = $optimus->decode($id);
        $item = User::whereHas('Clubs', function($query) use ($user){
                $query->where('clubs.id', $user->clubs_id);
            })
            ->find($userId);

        if($item):
        $item->makeVisible([
            'email',
            'no_shooting_card_number',
            'shooting_card_number',
            'no_email_address',
            'birthday',
            'phone',
            'mobile',
            'gender',
            'grade_trackshooting',
            'grade_field'
            ]);
        endif;
        return response()->json($item);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(\App\Http\Requests\UserRequest $request, $id)
    {
        $user = \Auth::user();

        if($user->clubs->first()->user_has_role != 'admin') return response()->json(['message'=>_('Du saknad administrationsbehörighet för din förening')], 403);

        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId = $optimus->decode($id);
        $item = User::whereHas('Clubs', function($query) use ($user){
                $query->where('clubs.id', $user->clubs_id);
            })
            ->find($userId);

        if($item):
            $data = $request->all();
            if($request->has('set_no_shooting_card_number')) $data['no_shooting_card_number'] = date('Y-m-d H:i:s');
            if($request->has('shooting_card_number')) $data['no_shooting_card_number'] = null;
            if($request->has('set_no_email_address')) $data['no_email_address'] = date('Y-m-d H:i:s');


            if($request->has('email')):
                $data['no_email_address'] = null;
                if($data['email'] != $item->email):
                    $data['activation_code'] = md5($data['email'].time());
                    if(env('APP_ENV') == 'production'):
                        $this->dispatch(new SendActivationEmail($item));
                    endif;
                endif;
            else:
                $data['active'] = 0;
            endif;

            $item->update($data);

            return response()->json(_('Användaren har uppdaterats'));
        endif;
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
    
}
