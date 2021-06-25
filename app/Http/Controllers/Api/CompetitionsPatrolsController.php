<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Patrol;

class CompetitionsPatrolsController extends Controller
{
    public function index($competitionId)
    {
        $competition = Competition::findOrFail($competitionId);

        if($competition->patrols_is_public || count($competition->UserRoles)):
            $query = Patrol::where('competitions_id', $competition->id);
            $query->orderBy('sortorder');
            $query->with([
                'Signups'=>function($query){
                    $query->orderBy('lane');
                },
                'Signups.Club',
                'Signups.User',
                'Signups.Weaponclass'
            ]);
            $patrols = $query->get();
        else:
            $patrols = [];
        endif;

        return response()->json([
            'patrols'=> $patrols
        ]);
    }
}
