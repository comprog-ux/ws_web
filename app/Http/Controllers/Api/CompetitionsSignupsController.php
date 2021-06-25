<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Signup;
use Illuminate\Http\Request;

use App\Http\Requests;

class CompetitionsSignupsController extends Controller
{
    public function index($competitionId)
    {
        $searchstring = \Request::get('search');
        $status = \Request::get('status');

        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $query = Signup::with('Weaponclass','User','Club');
        if($competitionId) $query->where('competitions_id', $competitionId);
        if($searchstring) $query->search($searchstring);
        if($status) $query->filterByApprovalStatus($status);
        $query->orderBy('competitions_signups.created_at', 'desc');
        $signups = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($signups->currentPage() > $signups->lastPage()):
            \Request::replace(['page'=>$signups->lastPage()]);
            $signups = $query->paginate($perPage);
        endif;

        $signups = $signups->toArray();
        $signups['search'] = $searchstring;
        $signups['status'] = $status;

        return response()->json([
            'signups'=> $signups
        ]);
    }
}
