<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

class PremiumController extends Controller
{
    public function index()
    {
        $user = \Auth::user();
        $club = $user->clubs()->first();
        if ($club) $club->load('Admins','ClubPremium');
        return response()->json($club);
    }

    public function store()
    {
        $user = \Auth::user();
        $club = $user->clubs()->first();
        if ($club):
            $club->load('Admins','ClubPremium');
            if(!count($club->ClubPremium))
                $club->ClubPremium()->create(['users_id'=>$user->id]);
            $club->load('ClubPremium');
        endif;
        return response()->json($club);
    }
}
