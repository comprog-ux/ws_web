<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

class AdminDashboardController extends Controller
{
    public function dashboard()
    {
        $users_count = \App\Models\User::count();
        $signups_count = \App\Models\Signup::count();
        $competitions_count = \App\Models\Competition::count();
        $teams_count = \App\Models\Team::count();
        $admins_count = \App\Models\ClubAdmin::count();
        $clubs_count = \App\Models\Club::count();
        $clubs_premium_count = \App\Models\ClubPremium::count();
        $invoices_count = \App\Models\Invoice::count();
        return [
            'users_count'           => $users_count,
            'clubs_count'           => $clubs_count,
            'clubs_premium_count'   => $clubs_premium_count,
            'admins_count'          => $admins_count,
            'teams_count'           => $teams_count,
            'signups_count'         => $signups_count,
            'competitions_count'    => $competitions_count,
            'invoices_count'        => $invoices_count
        ];
    }
}
