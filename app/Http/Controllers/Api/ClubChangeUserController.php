<?php

namespace App\Http\Controllers\Api;

use App\Mail\ClubChangeInitiated;
use App\Models\User;
use App\Models\UserClubChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ClubChangeUserController extends \App\Http\Controllers\Controller
{

    public function index()
    {

    }

    public function store(Request $request, $id)
    {
        $this->validate($request, ['to_clubs_id' => 'required|exists:clubs,id']);

        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId  = $optimus->decode($id);

        $user        = User::find($userId);
        $currentClub = $user->Clubs->first();

        $change = UserClubChange::create([
            'users_id'      => $user->id,
            'from_clubs_id' => ($currentClub) ? $currentClub->id : null,
            'to_clubs_id'   => $request->get('to_clubs_id'),
            'created_by'    => auth()->id(),
            'status'        => 'pending',
        ]);

        Mail::send(new ClubChangeInitiated($change));

        return response()->json(['message' => _('Bytet har initierats och måste godkännas av administratörer för vald förening.')]);
    }

}
