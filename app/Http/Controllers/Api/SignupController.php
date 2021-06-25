<?php

namespace App\Http\Controllers\Api;

use App\Jobs\SendSignupApprovalEmail;
use App\Models\Competition;
use Illuminate\Http\Request;

use App\Models\Signup;
use App\Http\Requests;
use App\Http\Controllers\Controller;

class SignupController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $user = \Auth::user();
        $status = \Request::get('status');

        $query = Signup::with([
            'Club',
            'Competition',
            'Weaponclass',
            'Patrol',
            'Team'=>function($query){
                $query->withPivot('position');
            },
            'ResultsPlacements'
        ]);
        $query->where('users_id', $user->id);
        if($status) $query->filterByStatus($status);

        $query->select('competitions_signups.*');
        $query->join('competitions', 'competitions.id', '=', 'competitions_signups.competitions_id');
        $query->orderBy('competitions.date', 'desc');

        $signups = $query->get();

        $query = Signup::where('users_id', $user->id);
        $query->whereNull('invoices_id');
        $invoices_generate = $query->get();

        return response()->json([
            'signups'=> $signups,
            'invoices_generate'=>$invoices_generate
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
    }

    /**
     * Create a signup.
     * Check if the Competitions status is open.
     * If the competition status after_signups_closing_date, the signup get additional price.
     * If signups after closing date needs approval we dispatch an email to all admins for the given competition.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $data = $request->all();
        $user = \Auth::user()->load('Clubs');
        if($request->has('users_id')):
            $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
            $userId = $optimus->decode($request->get('users_id'));
            $data['users_id'] = $userId;
        else:
            $data['users_id'] = $user->id;
        endif;
        if(!$user->Clubs->first()) return response()->json(_('Du behöver vara ansluten till en förening innan du kan anmäla dig till en tävling. Du kan koppla dig under din förening'), 404);
        $data['clubs_id'] = $user->Clubs->first()->id;

        //Check if the signup for choosen user already exists.
        $currentSignup = Signup::where(function($query) use ($request, $data) {
            $query->where('competitions_id', $request->get('competitions_id'));
            $query->where('weaponclasses_id', $request->get('weaponclasses_id'));
            $query->where('users_id', $data['users_id']);
        })->count();
        if($currentSignup):
            return response()->json(_('Du har redan anmält dig till denna vapengrupp.'), 404);
        endif;

        $competition = Competition::find($data['competitions_id']);
        if($competition):

            $registrationFee = \DB::table('competitions_weaponclasses')
                ->select('registration_fee')
                ->where('competitions_id', $data['competitions_id'])
                ->where('weaponclasses_id', $data['weaponclasses_id'])
                ->value('registration_fee');

            $data['created_by'] = \Auth::id();

            $data['registration_fee'] = $registrationFee;
            $signup = Signup::create($data);

            /**
             * Set registration price depending of the signup is before the signup closing date.
             */
            if($competition->status == 'after_signups_closing_date'):
                $signup->registration_fee = $signup->registration_fee + $competition->price_signups_after_closing_date;
            endif;

            /**
             * If the signup is after closing date and need to be approved.
             * Set the signup requires_approval.
             */
            if($competition->status == 'after_signups_closing_date' && $competition->approval_signups_after_closing_date):
                $signup->requires_approval = true;
            endif;

            $signup->save();

            /**
             * Send an e-mail notification to all competitions admins with role admin and signups
             */
            if(env('APP_ENV') == 'production' && $signup->requires_approval):
                $this->dispatch(new SendSignupApprovalEmail($signup));
            endif;

            $signup = Signup::with('User')->find($signup->id);

            return response()->json($signup);
        endif;
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
        $club = $user->Clubs->first();

        $query = Signup::with([
            'Competition',
            'Competition.Championship',
            'Competition.Weaponclasses',
            'Weaponclass',
            'User'
        ]);

        $query->where(function($query) use ($user, $club){
            $query->where('users_id', $user->id);
            if($club->user_has_role == 'admin'):
                $query->orWhere('clubs_id', $club->id);
            endif;
        });

        $signups = $query->findOrFail($id);
        return response()->json(['signups'=> $signups]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $data = $request->all();

        $user = \Auth::user();
        $club = $user->clubs()->first();
        if(!$club) return response()->json(_('Du behöver vara ansluten till en förening innan du kan anmäla dig till en tävling. Du kan koppla dig under din förening'), 404);

        $query = Signup::where(function($query) use ($user, $club){
            $query->where('users_id', $user->id);
            if($club->user_has_role == 'admin'):
                $query->orWhere('clubs_id', $club->id);
            endif;
        });
        $signup = $query->find($id);
        
        if($signup):
            $signup->update($data);
            $signup->load('User');
            return response()->json(['signups'=>$signup, 'message'=>_('Din anmälan har uppdaterats')]);
        endif;

    }

    /**
     * Remove the specified resource from storage.
     * Only allow delete on object which belongs to the user.
     * Or which allow to the user whos administrator for the connected club.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $user = \Auth::user();
        $club = $user->clubs()->first();
        if(!$club) return response()->json(_('Du behöver vara ansluten till en förening innan du kan anmäla dig till en tävling. Du kan koppla dig under din förening'), 404);

        $query = Signup::where(function($query) use ($user, $club){
                $query->where('users_id', $user->id);
                if($club->user_has_role == 'admin'):
                    $query->orWhere('clubs_id', $club->id);
                endif;
            });
        $signup = $query->find($id);
        if(!$signup) return response()->json(_('Anmälan verkar inte finnas.'), 404);
        if($signup->patrols_id) return response()->json(_('Anmälan är kopplad till en start tid. Vänligen kontakta tävlingsledningen för avanmälan.'), 404);
        if($signup->invoices_id) return response()->json(_('Anmälan är kopplad till en faktura. Vänligen kontakta tävlingsledningen för avanmälan.'), 404);

        if(!$signup) return response()->json(_('Anmälan du försöker ta bort verkar inte finnas.'), 404);
        $signup->delete();

        return response()->json('success');
    }
    
}
