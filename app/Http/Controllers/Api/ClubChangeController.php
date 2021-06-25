<?php

namespace App\Http\Controllers\Api;

use App\Models\Club;
use App\Models\User;
use App\Models\UserClubChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClubChangeInitiated;

class ClubChangeController extends \App\Http\Controllers\Controller
{

    public function index()
    {
        $club = auth()->user()->Clubs->first();

        if ($club->user_has_role != 'admin') {
            return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att visa föreningsbyten'), 403);
        }

        $clubChanges = UserClubChange::with(['User', 'FromClub', 'ToClub', 'Creator'])
            ->where('status', 'pending')
            ->where('to_clubs_id', $club->id)
            ->get();

        return response()->json($clubChanges);
    }

    public function store(Request $request)
    {
        $this->validate($request, ['to_clubs_id' => 'required|exists:clubs,id']);

        $user        = auth()->user();
        $currentClub = $user->Clubs->first();

        $change = UserClubChange::create([
            'users_id'      => $user->id,
            'from_clubs_id' => $currentClub->id,
            'to_clubs_id'   => $request->get('to_clubs_id'),
            'created_by'    => $user->id,
            'status'        => 'pending',
        ]);

        Mail::send(new ClubChangeInitiated($change));

        return response()->json(['message' => _('Bytet har initierats och måste godkännas av administratörer för vald förening.')]);
    }

    public function approve($id)
    {
        $change = UserClubChange::with('User')->where('status', 'pending')->findOrFail($id);
        $club   = Club::findOrFail($change->to_clubs_id);

        if ($club->user_has_role != 'admin') {
            return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att ändra föreningsbyten'), 403);
        }

        $change->approve();

        return response()->json(['message' => _('Användarens förening har ändrats.')]);
    }

    public function cancel($id)
    {
        $change = UserClubChange::with('User')->where('status', 'pending')->findOrFail($id);
        $club   = Club::findOrFail($change->to_clubs_id);

        if ($club->user_has_role != 'admin') {
            return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att ändra föreningsbyten'), 403);
        }

        $change->cancel();

        return response()->json(['message' => _('Föreningsbytet har avslagits.')]);
    }

}
