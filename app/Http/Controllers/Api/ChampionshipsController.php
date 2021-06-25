<?php

namespace App\Http\Controllers\Api;

use App\Models\Championship;
use App\Models\Signup;
use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\View;

class ChampionshipsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $searchstring = \Request::get('search');
        $clubs_id = \Request::get('clubs_id');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        if($clubs_id):
            $club = \Auth::user()->clubs()->first();
            $query = Championship::where('clubs_id', $club->id);
            if($club->user_has_role != 'admin'):
                $query = Championship::whereHas('Competitions', function(){});
            endif;
        else:
            $query = Championship::whereHas('Competitions', function($query){
                $query->where('is_public', 1);
            });
        endif;
        if($searchstring) $query->search($searchstring);
        $championships = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($championships->currentPage() > $championships->lastPage()):
            \Request::replace(['page'=>$championships->lastPage()]);
            $championships = $query->paginate($perPage);
        endif;

        $championships= $championships->toArray();
        $championships['search'] = $searchstring;
        $championships['clubs_id'] = $clubs_id;
        return response()->json(['championships' => $championships]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return response()->json(new championship());
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $club = \Auth::user()->clubs()->first();
        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att skapa ett mästerskap'), 403);

        $championship = new Championship();
        $championship->name = $request->get('name');
        $championship->clubs_id = $club->id;
        $championship->save();
        return response()->json(['championship'=>$championship]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $championship = Championship::with([
            'Competitions',
            'Competitions.Competitiontype',
            'Competitions.Weaponclasses',
            'Signups'
        ])->findOrFail($id);

        foreach($championship->competitions as $competition):
            $competition->weapongroups = $competition->weaponclasses->unique('weapongroups_id')->map(function($weaponclass, $key){
                return $weaponclass->weapongroup;
            });
        endforeach;


        return response()->json(['championship'=>$championship]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function getSignups($championshipsId){
        $searchstring = \Request::get('search');
        $competitions_id = (int)\Request::get('competitions_id');

        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $query = Signup::with('Competition', 'Weaponclass','User','Club','Invoice');
        if($competitions_id) $query->where('competitions_id', $competitions_id);
        if($searchstring) $query->search($searchstring);
        $query->whereHas('Competition', function($query) use ($championshipsId){
            $query->where('championships_id', '=', $championshipsId);
        });
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
            'signups'=> $signups
        ]);
    }
}
