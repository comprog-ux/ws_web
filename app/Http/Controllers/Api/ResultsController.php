<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResultPlacement;
use Illuminate\Http\Request;

use App\Http\Requests;

class ResultsController extends Controller
{
    public function index()
    {
        $user = \Auth::user();
        $query = ResultPlacement::select('results_placements.*');
        $query->with([
            'Signup',
            'Signup.Competition',
            'Signup.Club',
            'Signup.Team'=>function($query){
                $query->withPivot('position');
            },
        ]);
        $query->join('competitions_signups', 'competitions_signups.id', '=','results_placements.signups_id');
        $query->where('competitions_signups.users_id', $user->id);
        $query->orderBy('competitions_signups.start_time','desc');
        $results = $query->get();
        return response()->json(['results'=>$results]);
    }
}
