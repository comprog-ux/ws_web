<?php
namespace App\Repositories;

use Illuminate\Support\Facades\App;
use Illuminate\Http\Request;
use App\Models\Station;
use App\Models\Competition;

class StationRepository
{
    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function getCompetitionStations($competitionsId)
    {
        $competition = Competition::with(['Stations'=>function($query){
            $query->orderBy('distinguish');
            $query->orderby('sortorder', 'asc');
        }])->find($competitionsId);
        return $competition->Stations;
    }

    public function updateStation($competitionsId, $id)
    {
        $station = Station::where('competitions_id', $competitionsId)->find($id);
        $station->update($this->request->all());
        return $this->updateStationsSortorder($competitionsId);
    }

    public function storeStation($competitionsId)
    {
        $competition = Competition::find($competitionsId);
        $stations = $this->updateStationsSortorder($competitionsId);
        $lastStation = $stations->last(function($station, $key){
            return $station->distinguish == 0;
        });
        $station_nr = ($lastStation) ? $lastStation->station_nr++ : 1;
        $sortorder = ($lastStation) ? $lastStation->sortorder++ : 1;
        $station = new Station();
        $station->fill($this->request->all());
        $station->competitions_id = $competitionsId;
        $station->sortorder = $sortorder;
        $station->station_nr = $station_nr;
        $station->figures = 1;
        $station->points = ($competition->results_type == 'field') ? 0 : 1;
        $station->shots = ($competition->results_type == 'field' || $competition->results_type == 'pointfield' || $competition->results_type == 'magnum') ? 6 : 5;
        $station->save();

        return $this->updateStationsSortorder($competitionsId);
    }

    public function deleteStation($competitionsId, $id)
    {
        $station = Station::find($id);
        if($station) $station->delete();
        return $this->updateStationsSortorder($competitionsId);
    }

    public function updateStationsSortorder($competitionsId)
    {
        $competition = Competition::with('Stations')->find($competitionsId);

        $sortorder = 1;
        $station_nr = 1;
        foreach($competition->Stations->where('distinguish', 0) as $station):
            $station->update([
                'sortorder' => $sortorder,
                'station_nr' => $station_nr
            ]);
            $sortorder++;
            $station_nr++;
        endforeach;

        $sortorder = 1;
        $station_nr = 1;
        foreach($competition->Stations->where('distinguish', 1) as $station):
            $station->update([
                'sortorder' => $sortorder,
                'station_nr' => $station_nr
            ]);
            $sortorder++;
            $station_nr++;
        endforeach;
        return $competition->Stations;
    }
}