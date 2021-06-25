<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Team;

class CompetitionsTeamsController extends Controller
{
    public function index($competitionId)
    {
        $competition = Competition::findOrFail($competitionId);

        $query = Team::where('competitions_id', $competition->id);
        $query->orderBy('weapongroups_id');
        $query->orderBy('name');
        $query->with([
            'Signups',
            'Club',
            'Weapongroup',
            'Signups.User'
        ]);
        $teams = $query->get();

        return response()->json([
            'teams'=> $teams
        ]);
    }
}
