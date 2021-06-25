<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\UserClubChange;

class AdminClubChangesController extends \App\Http\Controllers\Controller
{
    public function index()
    {
        $clubChanges = UserClubChange::with(['User', 'FromClub', 'ToClub', 'Creator'])
            ->where('status', 'pending')
            ->get();

        return response()->json($clubChanges);
    }

    public function approve($id)
    {
        $change = UserClubChange::with('User')->where('status', 'pending')->findOrFail($id);
        $change->approve();

        return response()->json(['message' => _('Användarens förening har ändrats.')]);
    }

    public function cancel($id)
    {
        $change = UserClubChange::with('User')->where('status', 'pending')->findOrFail($id);
        $change->cancel();

        return response()->json(['message' => _('Föreningsbytet har avslagits.')]);
    }

}
