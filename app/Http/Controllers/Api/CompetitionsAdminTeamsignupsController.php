<?php

namespace App\Http\Controllers\Api;

use App\Models\Competition;
use App\Models\Club;
use App\Models\Team;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests;

class CompetitionsAdminTeamsignupsController extends Controller
{
    public function index($competitions_id)
    {
        $competition = Competition::find($competitions_id);

        if($competition->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för tävlingen för att administrera laganmälningar här'), 403);

        $teams = Team::with(['Club', 'Signups', 'Signups.User', 'Weapongroup'])
            ->where('competitions_id', $competitions_id)
            ->get();

        return response()->json(['teams'=>$teams]);
    }

    public function create($competitions_id, Request $request)
    {
        $competition = Competition::find($competitions_id);

        if($competition->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för tävlingen för att administrera laganmälningar här'), 403);

        $clubId = $request->get('clubs_id');
        
        $signups_ordinary_available = \App\Models\Signup::with('Weaponclass', 'User')
            ->where('clubs_id', $clubId)
            ->where('competitions_id', $competitions_id)
            ->whereDoesntHave('TeamSignup',function($query){
                $query->where(function($query){
                    $query->where('position', 1);
                    $query->orWhere('position', 2);
                    $query->orWhere('position', 3);
                });
            })
            ->get();
        $signups_reserve_available = \App\Models\Signup::with('Weaponclass', 'User')
            ->where('clubs_id', $clubId)
            ->where('competitions_id', $competitions_id)
            ->get();

        return response()->json([
            'signups_ordinary_available'=>$signups_ordinary_available,
            'signups_reserve_available'=>$signups_reserve_available
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $competitions_id)
    {
        $competitions = Competition::find($competitions_id);

        if($competitions->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för tävlingen för att administrera laganmälningar här'), 403);

        $user = \Auth::user();

        $data = $request->all();
        $team = \App\Models\Team::create([
            'competitions_id' => $competitions_id,
            'registration_fee' => $competitions->teams_registration_fee,
            'clubs_id' => $data['clubs_id'],
            'created_by' => $user->id,
            'name'=> $data['name'],
            'weapongroups_id' => $data['weapongroups_id'],
        ]);

        // Check if any of the given ids are hooked to team.
        $checkSignupIds = [];
        if($request->has('teams_signups_first')) $checkSignupIds[] = $request->get('teams_signups_first');
        if($request->has('teams_signups_second')) $checkSignupIds[] = $request->get('teams_signups_second');
        if($request->has('teams_signups_third')) $checkSignupIds[] = $request->get('teams_signups_third');
        if($request->has('teams_signups_fourth')) $checkSignupIds[] = $request->get('teams_signups_fourth');
        if($request->has('teams_signups_fifth')) $checkSignupIds[] = $request->get('teams_signups_fifth');
        // Run the check in the database.
        /**
         * Temporairly disable check for duplicate hooks.
         */
        $signupIds = [];
        #$signupIds = \DB::table('teams_signups')
        #    ->where(function($query) use ($checkSignupIds) {
        #        foreach($checkSignupIds as $index=>$signups_id):
        #            $query->orWhere('signups_id', $signups_id);
        #        endforeach;
        #    })
        #    ->pluck('signups_id');

        #// Hook signups to the created team if the signup is not hooked to another team.
        if($request->has('teams_signups_first') && !in_array($request->get('teams_signups_first'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_first'), ['position'=>1]);
        if($request->has('teams_signups_second') && !in_array($request->get('teams_signups_second'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_second'), ['position'=>2]);
        if($request->has('teams_signups_third') && !in_array($request->get('teams_signups_third'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_third'), ['position'=>3]);
        if($request->has('teams_signups_fourth') && !in_array($request->get('teams_signups_fourth'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_fourth'), ['position'=>4]);
        if($request->has('teams_signups_fifth') && !in_array($request->get('teams_signups_fifth'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_fifth'), ['position'=>5]);
        // If any user already had a connection to another team return an error message including the team id.
        if(count($signupIds)) return response()->json(['message'=>'Ditt lag har skapats men en eller flera användare finns redan kopplade till ett annat lag.','redirect_to_edit'=>$team->id], 403);

        return response()->json('Ditt lag är nu anmält');
    }

    /**
     * Display the specified resource.
     *
     * @param int $competitions_id
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($competitions_id, $id)
    {
        $competition = Competition::find($competitions_id);

        if($competition->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för tävlingen för att administrera laganmälningar här'), 403);

        $team = \App\Models\Team::with('Signups')
            ->where('competitions_id', $competitions_id)
            ->findOrFail($id);

        $signups_ordinary_available = \App\Models\Signup::with('Weaponclass', 'User')
            ->where('clubs_id', $team->clubs_id)
            ->where('competitions_id', $competitions_id)
            ->whereDoesntHave('TeamSignup',function($query) use ($id){
                $query->where('teams_id','!=', $id);
                $query->where(function($query){
                    $query->where('position', 1);
                    $query->orWhere('position', 2);
                    $query->orWhere('position', 3);
                });
            })
            ->get();
        $signups_reserve_available = \App\Models\Signup::with('Weaponclass', 'User')
            ->where('clubs_id', $team->clubs_id)
            ->where('competitions_id', $competitions_id)
            ->get();

        return response()->json([
            'teams'=>$team,
            'signups_ordinary_available'=>$signups_ordinary_available,
            'signups_reserve_available'=>$signups_reserve_available
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $competitions_id, $id)
    {
        $competitions = Competition::find($competitions_id);

        if($competitions->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för tävlingen för att administrera laganmälningar här'), 403);

        info($competitions_id);

        $data = $request->all();
        $team = \App\Models\Team::with('Signups')
            ->where('competitions_id', $competitions_id)
            ->findOrFail($id);

        $team->update([
            'name'=>$request->get('name'), 
            'weapongroups_id'=>$request->get('weapongroups_id')
        ]);

        $team->Signups()->sync([]);
        $checkSignupIds = [];
        if($request->has('teams_signups_first')) $checkSignupIds[] = $request->get('teams_signups_first');
        if($request->has('teams_signups_second')) $checkSignupIds[] = $request->get('teams_signups_second');
        if($request->has('teams_signups_third')) $checkSignupIds[] = $request->get('teams_signups_third');
        if($request->has('teams_signups_fourth')) $checkSignupIds[] = $request->get('teams_signups_fourth');
        if($request->has('teams_signups_fifth')) $checkSignupIds[] = $request->get('teams_signups_fifth');
        // Run the check in the database.
        /**
         * Temporairly disable check for duplicate hooks.
         */
        $signupIds = [];
        #$signupIds = \DB::table('teams_signups')
        #    ->where('teams_id','!=', $team->id)
        #    ->where(function($query) use ($checkSignupIds) {
        #        foreach($checkSignupIds as $index=>$signups_id):
        #            $query->orWhere('signups_id', $signups_id);
        #        endforeach;
        #    })
        #    ->pluck('signups_id');

        // Hook signups to the created team if the signup is not hooked to another team.
        if($request->has('teams_signups_first') && !in_array($request->get('teams_signups_first'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_first'), ['position'=>1]);
        if($request->has('teams_signups_second') && !in_array($request->get('teams_signups_second'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_second'), ['position'=>2]);
        if($request->has('teams_signups_third') && !in_array($request->get('teams_signups_third'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_third'), ['position'=>3]);
        if($request->has('teams_signups_fourth') && !in_array($request->get('teams_signups_fourth'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_fourth'), ['position'=>4]);
        if($request->has('teams_signups_fifth') && !in_array($request->get('teams_signups_fifth'), $signupIds)) $team->Signups()->attach($request->get('teams_signups_fifth'), ['position'=>5]);
        // If any user already had a connection to another team return an error message including the team id.
        if(count($signupIds)) return response()->json(['message'=>'Ditt lag har uppdaterats men en eller flera användare finns redan kopplade till ett annat lag.','redirect_to_edit'=>$team->id], 403);

        return response()->json('Ditt lag är nu uppdaterat');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($competitions_id, $id)
    {
        $competitions = Competition::find($competitions_id);

        if($competitions->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för tävlingen för att administrera laganmälningar här'), 403);

        $team = \App\Models\Team::with('Signups')
            ->where('competitions_id', $competitions_id)
            ->whereNull('invoices_id')
            ->findOrFail($id);
        $team->Signups()->sync([]);
        $team->delete();

        return response()->json('Ditt lag är nu raderat');
    }
}