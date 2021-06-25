<?php

namespace App\Http\Controllers\Api;

use App\Repositories\StationRepository;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

use App\Http\Requests;

class CompetitionsStationsController extends Controller
{
    public function __construct(StationRepository $stations)
    {
        $this->middleware('checkUserCompetitionRole:stations');
        $this->stations = $stations;
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($competitionsId)
    {
        $stations = $this->stations->getCompetitionStations($competitionsId);
        return response()->json(['stations'=>$stations]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $competitionsId)
    {
        $stations = $this->stations->storeStation($competitionsId);
        return response()->json(['stations'=>$stations]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $competitionsId, $id)
    {
        $stations = $this->stations->updateStation($competitionsId, $id);
        return response()->json(['stations'=>$stations]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($competitionsId, $id)
    {
        $this->stations->deleteStation($competitionsId, $id);
        $stations = $this->stations->getCompetitionStations($competitionsId);
        return response()->json(['stations'=>$stations]);
    }
}
