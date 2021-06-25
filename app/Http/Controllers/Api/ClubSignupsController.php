<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

use App\Http\Requests;

class ClubSignupsController extends Controller
{
    public function index($competitions_id)
    {
        $user = \Auth::user();
        $club = $user->clubs()->first();
        if(!$club) return response()->json(_('Du behöver vara ansluten till en förening innan du kan anmäla dig till en tävling. Du kan koppla dig under din förening'), 404);
        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        $club->load('Users');
        $club->Users->makeVisible(['email', 'shooting_card_number', 'active']);
        $competition = \App\Models\Competition::with([
            'Signups'=>function($query) use ($club){
                $query->where('competitions_signups.clubs_id', $club->id);
            },
            'Signups.User',
            'Signups.Club',
            'Weaponclasses'])
            ->find($competitions_id);
        return response()->json(['club'=>$club, 'competition'=>$competition]);

    }
    
}
