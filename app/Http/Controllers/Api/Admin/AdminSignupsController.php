<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;
use App\Models\Signup;
use App\Models\Competition;
use App\Models\Weaponclass;
use App\Http\Controllers\Controller;
use App\Http\Requests;

class AdminSignupsController extends Controller
{

    public function index()
    {
        $searchstring = \Request::get('search');
        $competitions_id = (int)\Request::get('competitions_id');

        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $competitions = Competition::orderBy('date','desc')->get();

        $query = Signup::with('Competition', 'Weaponclass','User','Club','Invoice');
        if($competitions_id) $query->where('competitions_id', $competitions_id);
        if($searchstring) $query->search($searchstring);
        $query->orderBy('competitions_signups.created_at', 'desc');
        $signups = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($signups->currentPage() > $signups->lastPage()):
            \Request::replace(['page'=>$signups->lastPage()]);
            $signups = $query->paginate($perPage);
        endif;

        $signups->each(function($signup, $key){
            $signup->user->makeVisible('shooting_card_number');
        });
        $signups = $signups->toArray();
        $signups['search'] = $searchstring;
        $signups['competitions_id'] = $competitions_id;

        return response()->json([
            'signups'=> $signups,
            'competitions' => $competitions
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show(Signup $signup)
    {
        $signup->load(['User', 'Club', 'Weaponclass', 'Competition']);

        return response()->json(['signup' => $signup, 'weaponclasses' => Weaponclass::all()]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Signup $signup)
    {
        $signup->update($request->only(['clubs_id', 'weaponclasses_id']));
        $signup->load(['User', 'Club', 'Weaponclass', 'Competition']);

        return response()->json(['message' => _('Anmälan har uppdaterats'), 'signup' => $signup]);
    }
}
