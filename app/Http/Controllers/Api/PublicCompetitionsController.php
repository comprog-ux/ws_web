<?php

namespace App\Http\Controllers\Api;

use App\Models\Competition;
use Illuminate\Database\Eloquent\Collection;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class PublicCompetitionsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $competitions = Competition::with([
            'Championship',
            'Competitiontype',
            'Weaponclasses',
            ])
            ->orderBy('date', 'desc')
            ->where('is_public', '1')
            ->get();

        foreach($competitions as $competition):
            $competition->weapongroups = $competition->weaponclasses->unique('weapongroups_id')->map(function($weaponclass, $key){
                return $weaponclass->weapongroup;
            });
        endforeach;

        return response()->json(['competitions' => $competitions]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {

        $query = Competition::
            with([
                'Championship',
                'Signups'=>function($query){
                    $query->where(function($query){
                        $query->where('requires_approval', 0);
                        $query->orWhere('is_approved_by', '!=', 0);
                    });
                },
                'Signups.User',
                'Signups.Club',
                'Signups.Weaponclass',
                'Teams',
                'Teams.Signups',
                'Teams.Club',
                'Teams.Weapongroup',
                'Teams.Signups.User',
                'Weaponclasses',
                'Weaponclasses.Weapongroup',
                'Club',
                'Club.District'
            ]);
        $query->where('is_public', '1');
        $competitions = $query->findOrFail($id);

        if($competitions->patrols_is_public || count($competitions->UserRoles)):
            $competitions->load([
                'Patrols' => function($query){
                    return $query->orderBy('sortorder');
                },
                'Patrols.Signups',
                'Patrols.Signups.Club',
                'Patrols.Signups.User',
                'Patrols.Signups.Weaponclass',
                'Patrols.Weaponclass'
            ]);
        endif;

        if($competitions->results_is_public || count($competitions->UserRoles)):
            $resultsFilePath = '/competitions/'.$id.'/results/webshooter-resultat-'.$id.'.json';
            if(Storage::exists($resultsFilePath)):
                $results = Storage::get($resultsFilePath);
                $competitions->result_placements = json_decode($results);
            else:
                $competitions->load([
                    'ResultPlacements',
                    'ResultPlacements.Signup',
                    'ResultPlacements.Signup.User',
                    'ResultPlacements.Signup.Club',
                    'ResultPlacements.Weaponclass',
                    'ResultPlacements.Results',
                    'ResultPlacements.ResultsDistinguish',
                    'ResultPlacements.ResultsFinals'
                ]);
                $results = $competitions->ResultPlacements;
                Storage::put($resultsFilePath, $results);
            endif;
        endif;

        $competitions->weapongroups = $competitions->weaponclasses->unique('weapongroups_id')->map(function($weaponclass, $key){
            return $weaponclass->weapongroup;
        });

        return response()->json(['competitions'=>$competitions]);
    }
}
