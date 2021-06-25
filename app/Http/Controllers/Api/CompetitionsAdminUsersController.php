<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Club;
use App\Http\Requests;
use App\Jobs\SendActivationEmail;


class CompetitionsAdminUsersController extends Controller
{
    public function __construct()
    {
        $this->middleware('checkUserCompetitionRole:signups');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($competitionsId)
    {
        $searchstring = \Request::get('search');

        $query = \App\Models\User::with('Clubs');
        if($searchstring) $query->search($searchstring);

        $query->orderBy('lastname', 'asc');
        $query->orderBy('name', 'asc');
        $users = $query->paginate(50);
        $users = $users->toArray();

        return response()->json(['users'=>$users]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(\App\Http\Requests\UserRequest $request, $competitionsId)
    {
        $data = $request->all();

        /**
         * Clubs_id is required to find an existing club.
         * Or the create_club and club_name are required to create a new club.
         */
        if((!$request->has('create_club') || !$request->has('club_name')) && !$request->has('clubs_id')) return response()->json([_('Fyll i formuläret')], 422);


        if($request->has('set_no_shooting_card_number')) $data['no_shooting_card_number'] = date('Y-m-d H:i:s');
        if($request->has('shooting_card_number')) $data['no_shooting_card_number'] = null;
        if($request->has('set_no_email_address')) $data['no_email_address'] = date('Y-m-d H:i:s');
        if($request->has('email')) $data['no_email_address'] = null;

        if($request->has('email')) $data['activation_code'] = md5($data['email'].time());
        if($request->has('password')) $data['password'] = bcrypt($request->get('password'));
        $data['language'] = \App\Models\Languages::defaultLanguage();

        $user = User::create($data);

        if($data['create_club'] && $data['club_name']):
            $club = Club::create(['name' => $request->get('club_name'), 'clubs_nr' => $request->get('clubs_nr')]);
            $user->Clubs()->attach($club->id);
        elseif($data['clubs_id']):
            $club = Club::find($data['clubs_id']);
            $user->Clubs()->attach($club->id);
        endif;


        if(env('APP_ENV') == 'production' && $request->has('email')):
            $this->dispatch(new SendActivationEmail($user));
        endif;

        return response()->json(['user'=>$user]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $competitionsId
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function show($competitionsId, $userId)
    {
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId = $optimus->decode($userId);

        $query = User::with([
            'signups'=>function($query) use ($competitionsId){
                $query->where('competitions_id', $competitionsId);
            }
        ]);
        $user = $query->find($userId);
        $user->makeVisible([
            'email',
            'birthday'
        ]);

        return response()->json(['user'=>$user]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $competitionsId
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $competitionsId, $userId)
    {
        //
    }

}
