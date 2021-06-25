<?php

namespace App\Http\Controllers\Api;

use App\Models\Competition;
use App\Models\CompetitionAdmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CompetitionsAdminAdminsController extends Controller
{
    public function __construct()
    {
        $this->middleware('checkUserCompetitionRole:admin');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($competitionsId)
    {
        // Competitions Roles
        $competition = Competition::with(['CompetitionAdmins','CompetitionAdmins.User'])->find($competitionsId);
        // Available Roles
        $roles = CompetitionAdmin::getRoles();
        // Available Users
        $club = \Auth::user()->clubs()->first();
        $club->load('Users');

        $competition->CompetitionAdmins->each(function($admin, $index){
            $admin->User->makeVisible('email');
        });
        return response()->json(['admins'=>$competition->CompetitionAdmins, 'roles'=>$roles, 'users'=>$club->Users]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $competitionsId)
    {
        $input = $request->all();
        if($request->has('users_id') && $request->has('role')){
            $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
            $usersId = $optimus->decode($request->get('users_id'));

            CompetitionAdmin::create([
                'users_id' => $usersId,
                'role' => $request->get('role'),
                'competitions_id' => $competitionsId
            ]);
            $competition = Competition::find($competitionsId);
            $competition->load(['CompetitionAdmins','CompetitionAdmins.User']);
            $competition->CompetitionAdmins->each(function($admin, $index){
                $admin->User->makeVisible('email');
            });
            return response()->json(['admins'=>$competition->CompetitionAdmins]);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($competitionsId, $id)
    {
        CompetitionAdmin::find($id)->delete();
        $competition = Competition::with(['CompetitionAdmins','CompetitionAdmins.User'])->find($competitionsId);
        $competition->CompetitionAdmins->each(function($admin, $index){
            $admin->User->makeVisible('email');
        });
        return response()->json(['admins'=>$competition->CompetitionAdmins]);
    }
}
