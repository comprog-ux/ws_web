<?php
namespace App\Repositories;

use App\Models\Competition;
use App\Models\ResultPlacement;
use Illuminate\Support\Facades\App;
use Illuminate\Http\Request;
use App\Models\Patrol;
use App\Models\PatrolDistinguish;
use App\Models\PatrolFinals;
use App\Models\Result;
use App\Models\Signup;
use Illuminate\Support\Facades\Storage;
use App\Contracts\ExcelInterface;

class ResultsRepository
{
    public function __construct(Request $request, StandardMedalRepository $medals, ExcelInterface $excel)
    {
        $this->request = $request;
        $this->medals = $medals;
        $this->excel = $excel;
    }

    /**
     * Fetch all results for the requested patrols and lanes.
     * Seperate the query depending on patrol_type.
     * Possible patrol_type: null, finals, distinguish.
     *
     * Create a result if a signup does not have the requested results.
     *
     * Return an array containing the signups for requested patrol including results.
     */
    public function getResultsForRegistration($competitionsId)
    {
        $signups = [];

        if(!$this->request->has('patrol_type')):
            $patrol = Patrol::where('competitions_id', $competitionsId)->where('sortorder', $this->request->patrol)->first();
            if($patrol):
                for($lane=$this->request->lane_start; $lane<=$this->request->lane_end; $lane++):

                    $query = Signup::where('lane', $lane);
                    $query->where('patrols_id', $patrol->id);
                    $query->with(['User', 'Club', 'Weaponclass']);
                    $signup = $query->first();

                    if($signup):
                        for($station=$this->request->station_start;$station<=$this->request->station_end; $station++):
                            $result = Result::where('signups_id', $signup->id)->where('finals', 0)->where('distinguish', 0)->where('stations_id', $station)->first();
                            if(!$result):
                                $result = new Result();
                                $result->figure_hits = "0";
                                $result->hits = "0";
                                $result->points = "0";
                                $result->stations_id = $station;
                                $result->signups_id = $signup->id;
                                $result->station_figure_hits = [0,0,0,0,0,0];
                                $result->save();
                            endif;
                        endfor;
                        $signup->load(['Results'=>function($query){
                            $query->where('finals', 0);
                            $query->where('distinguish', 0);
                        }]);
                        $signups[$lane] = $signup->toArray();
                    else:
                        $signups[$lane] = [];
                    endif;
                endfor;
            endif;
        elseif($this->request->get('patrol_type') == 'finals'):
            $patrol = PatrolFinals::where('competitions_id', $competitionsId)->where('sortorder', $this->request->patrol)->first();
            if($patrol):
                for($lane=$this->request->lane_start; $lane<=$this->request->lane_end; $lane++):

                    $query = Signup::where('lane_finals', $lane);
                    $query->where('patrols_finals_id', $patrol->id);
                    $query->with(['User', 'Club', 'Weaponclass']);
                    $signup = $query->first();

                    if($signup):
                        for($station=$this->request->station_start;$station<=$this->request->station_end; $station++):
                            $result = Result::where('signups_id', $signup->id)->where('finals', 1)->where('distinguish', 0)->where('stations_id', $station)->first();
                            if(!$result):
                                $result = new Result();
                                $result->figure_hits = "0";
                                $result->hits = "0";
                                $result->points = "0";
                                $result->stations_id = $station;
                                $result->signups_id = $signup->id;
                                $result->finals = 1;
                                $result->station_figure_hits = [0,0,0,0,0,0];
                                $result->save();
                            endif;
                        endfor;
                        $signup->load(['Results'=>function($query){
                            $query->where('finals', 1);
                        }]);
                        $signups[$lane] = $signup->toArray();
                    else:
                        $signups[$lane] = [];
                    endif;
                endfor;
            endif;
        elseif($this->request->get('patrol_type') == 'distinguish'):
            $patrol = PatrolDistinguish::where('competitions_id', $competitionsId)->where('sortorder', $this->request->patrol)->first();
            if($patrol):
                for($lane=$this->request->lane_start; $lane<=$this->request->lane_end; $lane++):

                    $query = Signup::where('lane_distinguish', $lane);
                    $query->where('patrols_distinguish_id', $patrol->id);
                    $query->with(['User', 'Club', 'Weaponclass']);
                    $signup = $query->first();

                    if($signup):
                        for($station=$this->request->station_start;$station<=$this->request->station_end; $station++):
                            $result = Result::where('signups_id', $signup->id)->where('finals', 0)->where('distinguish', 1)->where('stations_id', $station)->first();
                            if(!$result):
                                $result = new Result();
                                $result->figure_hits = "0";
                                $result->hits = "0";
                                $result->points = "0";
                                $result->stations_id = $station;
                                $result->signups_id = $signup->id;
                                $result->distinguish = 1;
                                $result->station_figure_hits = [0,0,0,0,0,0];
                                $result->save();
                            endif;
                        endfor;
                        $signup->load(['Results'=>function($query){
                            $query->where('distinguish', 1);
                        }]);
                        $signups[$lane] = $signup->toArray();
                    else:
                        $signups[$lane] = [];
                    endif;
                endfor;
            endif;
        endif;

        return $signups;
    }

    public function getPatrols($competitionsId)
    {
        if(!$this->request->has('patrol_type')):
            $patrols = Patrol::where('competitions_id', $competitionsId)->orderBy('sortorder')->get();
        elseif($this->request->get('patrol_type') == 'finals'):
            $patrols = PatrolFinals::where('competitions_id', $competitionsId)->orderBy('sortorder')->get();
        elseif($this->request->get('patrol_type') == 'distinguish'):
            $patrols = PatrolDistinguish::where('competitions_id', $competitionsId)->orderBy('sortorder')->get();
        endif;

        return $patrols;
    }

    public function storeResults($competitionsId)
    {
        if($this->request->has('results')):
            foreach($this->request->get('results') as $input):
                if($input):
                    $result = Result::find($input['id']);
                    // Cast all station hits to integers before sending to the database.
                    if($input['station_figure_hits']):
                        $station_figure_hits = [];
                        foreach($input['station_figure_hits'] as $hit):
                            $station_figure_hits[] = (int)$hit;
                        endforeach;
                        $input['station_figure_hits'] = $station_figure_hits;
                    endif;
                    if($result) $result->update($input);
                endif;
            endforeach;
        endif;
    }

    public function calculateResults($competitionsId)
    {
        $competition = Competition::find($competitionsId);

        if ($competition->results_type == 'precision'):
            $this->calculateResultsPrecision($competition);
        elseif ($competition->results_type == 'military'):
            $this->calculateResultsMilitary($competition);
        elseif ($competition->results_type == 'field'):
            $this->calculateResultsField($competition);
        elseif ($competition->results_type == 'magnum'):
            $this->calculateResultsMagnum($competition);
        elseif ($competition->results_type == 'pointfield'):
            $this->calculateResultsPointfield($competition);
        endif;

        $this->medals->calculateStdMedals($competition);

        $resultsFilePath = '/competitions/'.$competitionsId.'/results/webshooter-resultat-'.$competitionsId.'.json';
        $competition = Competition::with([
            'ResultPlacements',
            'ResultPlacements.Signup',
            'ResultPlacements.Signup.User',
            'ResultPlacements.Signup.Club',
            'ResultPlacements.Weaponclass',
            'ResultPlacements.Results',
            'ResultPlacements.ResultsDistinguish',
            'ResultPlacements.ResultsFinals'
        ])->find($competitionsId);
        $results = $competition->ResultPlacements;
        Storage::put($resultsFilePath, $results);
    }

    public function calculateResultsMilitary($competition)
    {
        \DB::table('competitions_signups')->where('competitions_id', $competition->id);

        $query = Signup::groupBy('weaponclasses_id');
        $query->where('competitions_id', $competition->id);
        $weaponclasses = $query->pluck('weaponclasses_id');

        foreach($weaponclasses as $weaponclass):
            $query = Result::where('finals', 0)->select([
                '*',
                \DB::raw('SUM(IF(finals=0 and distinguish=0, points, 0)) as points'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, hits, 0)) as hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 11, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 12, points, 0)) as last_shots_11_12'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 10, points, 0)) as last_shots_9_10'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 8, points, 0)) as last_shots_7_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)) as last_shots_5_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 3, points, 0)) as last_shots_3_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)) as last_shots_1_2'),
                \DB::raw('SUM(IF(distinguish = 1, points, 0)) as distinguish_points'),
                \DB::raw('CONCAT(
                LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0), 
                LPAD(SUM(IF(distinguish = 1, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 11, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 12, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 9, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 10, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 8, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 4, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0) + IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)), 3, 0)
                ) as ranking')
            ]);
            $query->with('Signup');
            $query->with('Signup.ResultsPlacements');
            $query->with('Signup.Weaponclass');
            $query->leftJoin('competitions_signups', 'competitions_signups.id', '=', 'results.signups_id');
            $query->where('competitions_signups.weaponclasses_id', $weaponclass);
            $query->where('competitions_signups.competitions_id', $competition->id);
            $query->orderBy('ranking', 'desc');
            $query->groupBy('signups_id');
            $results = $query->get();


            $current_ranking = 0;
            foreach($results as $index => $result):

                if($result->ranking == 0):
                    $results_placement = 0;
                else:
                    if($current_ranking != $result->ranking):
                        $results_placement = $index+1;
                    endif;
                endif;

                if($result->Signup->ResultsPlacements):
                    $result->Signup->ResultsPlacements->placement = $results_placement;
                    $result->Signup->ResultsPlacements->hits = $result->hits;
                    $result->Signup->ResultsPlacements->figure_hits = $result->figure_hits;
                    $result->Signup->ResultsPlacements->points = $result->points;
                    $result->Signup->ResultsPlacements->weaponclasses_id = $weaponclass;
                    $result->Signup->ResultsPlacements->save();
                else:
                    $result->Signup->ResultsPlacements()->create([
                        'competitions_id'=>$competition->id,
                        'placement'=>$results_placement,
                        'hits'=> $result->hits,
                        'figure_hits'=>$result->figure_hits,
                        'points'=>$result->points,
                        'weaponclasses_id'=>$weaponclass
                    ]);
                endif;

                $current_ranking = $result->ranking;

            endforeach;
        endforeach;
    }
    public function calculateResultsPrecision($competition)
    {
        \DB::table('competitions_signups')->where('competitions_id', $competition->id);

        $number_of_distinguish_columns = (!$competition->championships_id) ? 39 : 9;
        $query = Signup::groupBy('weaponclasses_id');
        $query->where('competitions_id', $competition->id);
        $weaponclasses = $query->pluck('weaponclasses_id');

        foreach($weaponclasses as $weaponclass):
            $query = Result::select([
                '*',
                \DB::raw('SUM(IF(distinguish=0, points, 0)) as points'),
                #\DB::raw('SUM(IF(finals=0 and distinguish=0, points, 0)) as normal_points'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0)) as station_figure_points_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)) as station_figure_points_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0)) as station_figure_points_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, points, 0)) as station_figure_points_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0)) as station_figure_points_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)) as station_figure_points_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0)) as station_figure_points_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, points, 0)) as station_figure_points_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, points, 0)) as station_figure_points_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, points, 0)) as station_figure_points_10'),
                \DB::raw('SUM(IF(finals = 1, points, 0)) as finals_points'),
                \DB::raw('CONCAT(
                LPAD(SUM(IF(distinguish=0, points, 0)), 3, 0),
                LPAD(SUM(IF(distinguish = 1, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=1 and distinguish=0 and stations_id = 3, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=1 and distinguish=0 and stations_id = 2, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=1 and distinguish=0 and stations_id = 1, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 4, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0)), 3, 0)
                ) as ranking')
            ]);
            $query->with('Signup');
            $query->with('Signup.ResultsPlacements');
            $query->leftJoin('competitions_signups', 'competitions_signups.id', '=', 'results.signups_id');
            $query->where('competitions_signups.weaponclasses_id', $weaponclass);
            $query->where('competitions_signups.competitions_id', $competition->id);
            $query->orderBy('ranking', 'desc');
            $query->groupBy('signups_id');
            $results = $query->get();

            $results_placement = 0;
            $result_ranking = 0;
            foreach($results as $index => $result):

                if($result->ranking == 0):
                    $results_placement = 0;
                else:
                    if($results_placement <= 3):
                        $result->ranking = substr($result->ranking, 0, $number_of_distinguish_columns);
                        $result_ranking = substr($result_ranking, 0, $number_of_distinguish_columns);
                        if($result->ranking != $result_ranking):
                            $results_placement++;
                            if(($results_placement==2 && $index>=3)):
                                $results_placement = $index+1;
                            elseif(($results_placement==3 && $index>=3)):
                                $results_placement = $index+1;
                            endif;
                        endif;
                    else:
                        $results_placement = $index+1;
                    endif;
                endif;


                if($result->Signup->ResultsPlacements):
                    $result->Signup->ResultsPlacements->placement = $results_placement;
                    $result->Signup->ResultsPlacements->hits = $result->hits;
                    $result->Signup->ResultsPlacements->figure_hits = $result->figure_hits;
                    $result->Signup->ResultsPlacements->points = $result->points;
                    $result->Signup->ResultsPlacements->weaponclasses_id = $weaponclass;
                    $result->Signup->ResultsPlacements->save();
                else:
                    $result->Signup->ResultsPlacements()->create([
                        'competitions_id'=>$competition->id,
                        'placement'=>$results_placement,
                        'hits'=> $result->hits,
                        'figure_hits'=>$result->figure_hits,
                        'points'=>$result->points+$result->finals_points,
                        'weaponclasses_id'=>$weaponclass
                    ]);
                endif;

                $result_ranking = $result->ranking;

            endforeach;
        endforeach;
    }
    public function calculateResultsField($competition)
    {
        \DB::table('competitions_signups')->where('competitions_id', $competition->id);

        $query = Signup::groupBy('weaponclasses_id');
        $query->where('competitions_id', $competition->id);
        $weaponclasses = $query->pluck('weaponclasses_id');
        $number_of_distinguish_columns = (!$competition->championships_id) ? 66 : 27;
        $ranking_sql = 'CONCAT(
                LPAD(SUM(IF(finals=0 and distinguish=0, hits, 0)), 3, 0),';
        if(!$competition->championships_id) $ranking_sql .= 'LPAD(SUM(IF(finals=0 and distinguish=0, figure_hits, 0)), 3, 0),';
        if(!$competition->championships_id) $ranking_sql .= 'LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),';
        $ranking_sql .= 'LPAD(SUM(IF(distinguish=1 and stations_id = 1, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 2, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 3, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 4, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 5, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 6, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, figure_hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 10, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 9, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 8, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 7, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 6, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 5, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 4, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 3, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 2, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 1, hits, 0)), 3, 0)
                ) as ranking';

        foreach($weaponclasses as $weaponclass):
            $query = Result::select([
                '*',
                \DB::raw('SUM(IF((finals=0 and distinguish=0), hits, 0)) as hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, figure_hits, 0)) as figure_hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, points, 0)) as points'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, hits, 0)) as station_hits_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, hits, 0)) as station_hits_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, hits, 0)) as station_hits_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, hits, 0)) as station_hits_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, hits, 0)) as station_hits_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, hits, 0)) as station_hits_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, hits, 0)) as station_hits_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, hits, 0)) as station_hits_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, hits, 0)) as station_hits_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, hits, 0)) as station_hits_10'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0)) as station_figure_points_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)) as station_figure_points_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0)) as station_figure_points_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, points, 0)) as station_figure_points_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0)) as station_figure_points_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)) as station_figure_points_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0)) as station_figure_points_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, points, 0)) as station_figure_points_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, points, 0)) as station_figure_points_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, points, 0)) as station_figure_points_10'),
                \DB::raw('SUM(IF(distinguish = 1, hits, 0)) as distinguish_hits'),
                \DB::raw('SUM(IF(distinguish = 1, points, 0)) as distinguish_points'),
                \DB::raw($ranking_sql)
            ]);
            $query->with('Signup');
            $query->with('Signup.ResultsPlacements');
            $query->leftJoin('competitions_signups', 'competitions_signups.id', '=', 'results.signups_id');
            $query->where('competitions_signups.weaponclasses_id', $weaponclass);
            $query->where('competitions_signups.competitions_id', $competition->id);
            $query->orderBy('ranking', 'desc');
            $query->groupBy('signups_id');
            $results = $query->get();

            $results_placement = 0;
            $result_ranking = 0;
            foreach($results as $index => $result):

                if($result->ranking == 0):
                    $results_placement = 0;
                else:
                    if($results_placement <= 3):
                        $result->ranking = substr($result->ranking, 0, $number_of_distinguish_columns);
                        $result_ranking = substr($result_ranking, 0, $number_of_distinguish_columns);
                        if($result->ranking != $result_ranking):
                            $results_placement++;
                            if(($results_placement==2 && $index>=3)):
                                $results_placement = $index+1;
                            elseif(($results_placement==3 && $index>=3)):
                                $results_placement = $index+1;
                            endif;
                        endif;
                    else:
                        $results_placement = $index+1;
                    endif;
                endif;

                if($result->Signup->ResultsPlacements):
                    $result->Signup->ResultsPlacements->placement = $results_placement;
                    $result->Signup->ResultsPlacements->hits = $result->hits;
                    $result->Signup->ResultsPlacements->figure_hits = $result->figure_hits;
                    $result->Signup->ResultsPlacements->points = $result->points;
                    $result->Signup->ResultsPlacements->weaponclasses_id = $weaponclass;
                    $result->Signup->ResultsPlacements->save();
                else:
                    $result->Signup->ResultsPlacements()->create([
                        'competitions_id'=>$competition->id,
                        'placement'=>$results_placement,
                        'hits'=> $result->hits,
                        'figure_hits'=>$result->figure_hits,
                        'points'=>$result->points,
                        'weaponclasses_id'=>$weaponclass
                    ]);
                endif;

                $result_ranking = $result->ranking;

            endforeach;
        endforeach;
    }
    public function calculateResultsPointfield($competition)
    {
        \DB::table('competitions_signups')->where('competitions_id', $competition->id);

        $query = Signup::groupBy('weaponclasses_id');
        $query->where('competitions_id', $competition->id);
        $weaponclasses = $query->pluck('weaponclasses_id');
        $number_of_distinguish_columns = (!$competition->championships_id) ? 54 : 24;
        $ranking_sql = 'CONCAT(
                LPAD((SUM(IF(finals=0 and distinguish=0, hits, 0))+SUM(IF(finals=0 and distinguish=0, figure_hits, 0))), 3, 0),';
        if(!$competition->championships_id) $ranking_sql .= 'LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),';
        $ranking_sql .= 'LPAD((SUM(IF(distinguish=1 and stations_id = 1, hits, 0))+SUM(IF(distinguish=1 and stations_id = 1, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(distinguish=1 and stations_id = 2, hits, 0))+SUM(IF(distinguish=1 and stations_id = 2, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(distinguish=1 and stations_id = 3, hits, 0))+SUM(IF(distinguish=1 and stations_id = 3, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(distinguish=1 and stations_id = 4, hits, 0))+SUM(IF(distinguish=1 and stations_id = 4, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(distinguish=1 and stations_id = 5, hits, 0))+SUM(IF(distinguish=1 and stations_id = 5, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(distinguish=1 and stations_id = 6, hits, 0))+SUM(IF(distinguish=1 and stations_id = 6, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 10, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 10, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 9, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 9, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 8, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 8, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 7, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 7, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 6, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 6, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 5, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 5, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 4, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 4, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 3, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 3, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 2, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 2, figure_hits, 0))), 3, 0),
                LPAD((SUM(IF(finals=0 and distinguish=0 and stations_id = 1, hits, 0))+SUM(IF(finals=0 and distinguish=0 and stations_id = 1, figure_hits, 0))), 3, 0)
                ) as ranking';

        foreach($weaponclasses as $weaponclass):
            $query = Result::select([
                '*',
                \DB::raw('SUM(IF((finals=0 and distinguish=0), hits, 0)) as hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, figure_hits, 0)) as figure_hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, points, 0)) as points'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, hits, 0)) as station_hits_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, hits, 0)) as station_hits_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, hits, 0)) as station_hits_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, hits, 0)) as station_hits_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, hits, 0)) as station_hits_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, hits, 0)) as station_hits_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, hits, 0)) as station_hits_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, hits, 0)) as station_hits_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, hits, 0)) as station_hits_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, hits, 0)) as station_hits_10'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0)) as station_figure_points_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)) as station_figure_points_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0)) as station_figure_points_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, points, 0)) as station_figure_points_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0)) as station_figure_points_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)) as station_figure_points_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0)) as station_figure_points_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, points, 0)) as station_figure_points_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, points, 0)) as station_figure_points_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, points, 0)) as station_figure_points_10'),
                \DB::raw('SUM(IF(distinguish = 1, hits, 0)) as distinguish_hits'),
                \DB::raw('SUM(IF(distinguish = 1, points, 0)) as distinguish_points'),
                \DB::raw($ranking_sql)
            ]);
            $query->with('Signup');
            $query->with('Signup.ResultsPlacements');
            $query->leftJoin('competitions_signups', 'competitions_signups.id', '=', 'results.signups_id');
            $query->where('competitions_signups.weaponclasses_id', $weaponclass);
            $query->where('competitions_signups.competitions_id', $competition->id);
            $query->orderBy('ranking', 'desc');
            $query->groupBy('signups_id');
            $results = $query->get();

            $results_placement = 0;
            $result_ranking = 0;
            foreach($results as $index => $result):

                if($result->ranking == 0):
                    $results_placement = 0;
                else:
                    if($results_placement <= 3):
                        $result->ranking = substr($result->ranking, 0, $number_of_distinguish_columns);
                        $result_ranking = substr($result_ranking, 0, $number_of_distinguish_columns);
                        if($result->ranking != $result_ranking):
                            $results_placement++;
                            if(($results_placement==2 && $index>=3)):
                                $results_placement = $index+1;
                            elseif(($results_placement==3 && $index>=3)):
                                $results_placement = $index+1;
                            endif;
                        endif;
                    else:
                        $results_placement = $index+1;
                    endif;
                endif;

                if($result->Signup->ResultsPlacements):
                    $result->Signup->ResultsPlacements->placement = $results_placement;
                    $result->Signup->ResultsPlacements->hits = $result->hits;
                    $result->Signup->ResultsPlacements->figure_hits = $result->figure_hits;
                    $result->Signup->ResultsPlacements->points = $result->points;
                    $result->Signup->ResultsPlacements->weaponclasses_id = $weaponclass;
                    $result->Signup->ResultsPlacements->save();
                else:
                    $result->Signup->ResultsPlacements()->create([
                        'competitions_id'=>$competition->id,
                        'placement'=>$results_placement,
                        'hits'=> $result->hits,
                        'figure_hits'=>$result->figure_hits,
                        'points'=>$result->points,
                        'weaponclasses_id'=>$weaponclass
                    ]);
                endif;

                $result_ranking = $result->ranking;

            endforeach;
        endforeach;
    }

    public function calculateResultsMagnum($competition)
    {
        \DB::table('competitions_signups')->where('competitions_id', $competition->id);

        $query = Signup::groupBy('weaponclasses_id');
        $query->where('competitions_id', $competition->id);
        $weaponclasses = $query->pluck('weaponclasses_id');
        $number_of_distinguish_columns = (!$competition->championships_id) ? 66 : 27;
        $ranking_sql = 'CONCAT(
                LPAD(SUM(IF(finals=0 and distinguish=0, hits, 0)), 3, 0),';
        $ranking_sql .= 'LPAD(SUM(IF(finals=0 and distinguish=0, figure_hits, 0)), 3, 0),';
        $ranking_sql .= 'LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),';
        $ranking_sql .= 'LPAD(SUM(IF(distinguish=1 and stations_id = 1, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 2, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 3, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 4, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 5, hits, 0)), 3, 0),
                LPAD(SUM(IF(distinguish=1 and stations_id = 6, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, figure_hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0, points, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 10, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 9, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 8, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 7, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 6, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 5, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 4, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 3, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 2, hits, 0)), 3, 0),
                LPAD(SUM(IF(finals=0 and distinguish=0 and stations_id = 1, hits, 0)), 3, 0)
                ) as ranking';

        foreach($weaponclasses as $weaponclass):
            $query = Result::select([
                '*',
                \DB::raw('SUM(IF((finals=0 and distinguish=0), hits, 0)) as hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, figure_hits, 0)) as figure_hits'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0, points, 0)) as points'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, hits, 0)) as station_hits_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, hits, 0)) as station_hits_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, hits, 0)) as station_hits_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, hits, 0)) as station_hits_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, hits, 0)) as station_hits_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, hits, 0)) as station_hits_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, hits, 0)) as station_hits_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, hits, 0)) as station_hits_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, hits, 0)) as station_hits_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, hits, 0)) as station_hits_10'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 1, points, 0)) as station_figure_points_1'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 2, points, 0)) as station_figure_points_2'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 3, points, 0)) as station_figure_points_3'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 4, points, 0)) as station_figure_points_4'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 5, points, 0)) as station_figure_points_5'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 6, points, 0)) as station_figure_points_6'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 7, points, 0)) as station_figure_points_7'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 8, points, 0)) as station_figure_points_8'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 9, points, 0)) as station_figure_points_9'),
                \DB::raw('SUM(IF(finals=0 and distinguish=0 and stations_id = 10, points, 0)) as station_figure_points_10'),
                \DB::raw('SUM(IF(distinguish = 1, hits, 0)) as distinguish_hits'),
                \DB::raw('SUM(IF(distinguish = 1, points, 0)) as distinguish_points'),
                \DB::raw($ranking_sql)
            ]);
            $query->with('Signup');
            $query->with('Signup.ResultsPlacements');
            $query->leftJoin('competitions_signups', 'competitions_signups.id', '=', 'results.signups_id');
            $query->where('competitions_signups.weaponclasses_id', $weaponclass);
            $query->where('competitions_signups.competitions_id', $competition->id);
            $query->orderBy('ranking', 'desc');
            $query->groupBy('signups_id');
            $results = $query->get();

            $results_placement = 0;
            $result_ranking = 0;
            foreach($results as $index => $result):

                if($result->ranking == 0):
                    $results_placement = 0;
                else:
                    if($results_placement <= 3):
                        $result->ranking = substr($result->ranking, 0, $number_of_distinguish_columns);
                        $result_ranking = substr($result_ranking, 0, $number_of_distinguish_columns);
                        if($result->ranking != $result_ranking):
                            $results_placement++;
                            if(($results_placement==2 && $index>=3)):
                                $results_placement = $index+1;
                            elseif(($results_placement==3 && $index>=3)):
                                $results_placement = $index+1;
                            endif;
                        endif;
                    else:
                        $results_placement = $index+1;
                    endif;
                endif;

                if($result->Signup->ResultsPlacements):
                    $result->Signup->ResultsPlacements->placement = $results_placement;
                    $result->Signup->ResultsPlacements->hits = $result->hits;
                    $result->Signup->ResultsPlacements->figure_hits = $result->figure_hits;
                    $result->Signup->ResultsPlacements->points = $result->points;
                    $result->Signup->ResultsPlacements->weaponclasses_id = $weaponclass;
                    $result->Signup->ResultsPlacements->save();
                else:
                    $result->Signup->ResultsPlacements()->create([
                        'competitions_id'=>$competition->id,
                        'placement'=>$results_placement,
                        'hits'=> $result->hits,
                        'figure_hits'=>$result->figure_hits,
                        'points'=>$result->points,
                        'weaponclasses_id'=>$weaponclass
                    ]);
                endif;

                $result_ranking = $result->ranking;

            endforeach;
        endforeach;
    }

    public function generatePdf($competitionsId, $download = true)
    {
        $pdf = new \App\Classes\pdfResults();
        $pdf->create($competitionsId, $this->request->all(), $download);
    }
    public function generateTeamsResultsPdf($competitionsId)
    {
        $pdf = new \App\Classes\pdfTeamsResults();
        $pdf->create($competitionsId, $this->request->all());
    }

    public function generateXlsx($competitionsId, $filter)
    {
        $competition = Competition::with([
            'Club',
            'Club.District',
            'Championship',
            'Sponsors',
            'Signups' => function ($query) {
                $query->select('competitions_signups.*')
                    ->join('results_placements', 'results_placements.signups_id', '=', 'competitions_signups.id')
                    ->orderBy(\DB::raw('results_placements.placement = 0, results_placements.placement'));
                $query->orderBy('weaponclasses_id');
            },
            'Signups.Club',
            'Signups.User',
            'Signups.Weaponclass',
            'Signups.Results'=> function ($query) {
                $query->where('finals', 0);
                $query->where('distinguish', 0);
                $query->orderBy('stations_id');
            },
            'Signups.ResultsPlacements',
            'Stations',
            'Competitiontype',
            'Weaponclasses',
        ])->find($competitionsId);

        if ($competition->results_type == 'military') {
            $results = $this->getMilitaryResults($competition, $filter);
        } else if($competition->results_type == 'precision') {
            $results = $this->getPrecisionResults($competition, $filter);
        } else if ($competition->results_type == 'field'){
            $results = $this->getFieldResults($competition, $filter);  
        } else if($competition->results_type == 'pointfield'){
            $results = $this->getPointfieldResults($competition, $filter);
        } else if($competition->results_type == 'magnum'){
            $results = $this->getMagnumResults($competition, $filter);
        }

        $results = collect($results)->reject(function($row){
            return $row === 'header';
        })->map(function($row) use ($results){
            return $row;
        });
        
        $file = $this->excel->create('webshooter-resultat-' . $competitionsId . '.xlsx', $results);
        $this->excel->download($file, 'xlsx');
    }

    public function getMilitaryResults($competition, $filter){
        $weaponclasses = $competition->Signups->groupBy('weaponclasses_id');
        $i = 0;
        $results = [];
        foreach($weaponclasses as $index => $weaponclass){
            foreach($weaponclass as $index => $signup){
                $row = [];
                $totals = [0, 0, 0];

                $row['Placering'] = $signup->ResultsPlacements->placement;
                $row['Namn'] = $signup->User->fullName;
                $row['Pistolskyttekortsnummer'] = $signup->User->shooting_card_number;
                $row['Förening'] = substr($signup->Club->name, 0, 33);
                $row['Vapengrupp'] = ($competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname; 

                for($i=1; $i<=4; $i++){
                    $points = $signup->Results->where('stations_id', $i)->pluck('points');
                    if(count($points)){
                        $totals[0] += $points[0];
                        $row[(string)$i] = $points[0];
                    } else {
                        $row[(string)$i] = 0;
                    }
                }

                for($i=5; $i<=8; $i++){
                    $points = $signup->Results->where('stations_id', $i)->pluck('points');

                    if (count($points)) {
                        $totals[1] += $points[0];
                        $row[(string)$i] = $points[0];
                    } else {
                        $row[(string)$i] = 0;
                    }
                }

                for($i=9; $i<=12; $i++){
                    $points = $signup->Results->where('stations_id', $i)->pluck('points');
                    if (count($points)) {
                        $totals[2] += $points[0];
                        $row[(string)$i] = $points[0];
                    } else {
                        $row[(string)$i] = 0;
                    }
                }

                $row['Tot'] = $totals[0]+$totals[1]+$totals[2];

                $hits = $signup->Results->sum(function($result){
                    return $result->hits;
                });
                $row['X'] = ($hits) ? $hits : '';

                $distinguish_points = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('points');
                $distinguish_points = ($distinguish_points) ? $distinguish_points : '';
                $row['SK'] = $distinguish_points;

                if ($filter['std_medals']) {
                    $row['M'] = $signup->ResultsPlacements->std_medal;
                }
                
                if ($competition->results_prices && $filter['prices']) {
                    $row['Pris'] = $signup->ResultsPlacements->price;
                }

                $results[] = $row;
            }

            $results[] = 'header';
        }

        return $results;
    }

    public function getPrecisionResults($competition, $filter){
        $weaponclasses = $competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        $results = [];

        foreach($weaponclasses as $index => $weaponclass){
            if($weaponclass){
                foreach ($weaponclass as $index => $signup) {
                    $row = [];

                    $totals = [0,0,0];

                    $row['Plats'] = $signup->ResultsPlacements->placement;
                    $row['Namn'] = $signup->User->fullName;
                    $row['Pistolskyttekortsnummer'] = $signup->User->shooting_card_number;
                    $row['Förening'] = substr($signup->Club->name, 0, 33);
                    $row['Vapengrupp'] = ($competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname; 

                    $normal_points = 0;
                    for($i=1; $i<=count($competition->Stations); $i++){
                        $points = $signup->Results->where('stations_id', $i)->pluck('points');
                        if (count($points)) {
                            $normal_points += $points[0];
                            $totals[0] += $points[0];
                            $row[(string) $i] = $points[0];
                        } else {
                            $row[(string) $i] = 0;
                        }
                    }

                    $row['Tot 1'] = $normal_points;

                    $row['8'] = Result::where('signups_id', $signup->id)->where('finals', 1)->where('stations_id', 1)->sum('points');
                    $row['9'] = Result::where('signups_id', $signup->id)->where('finals', 1)->where('stations_id', 2)->sum('points');
                    $row['10'] = Result::where('signups_id', $signup->id)->where('finals', 1)->where('stations_id', 3)->sum('points');

                    $row['Tot 2'] = $signup->ResultsPlacements->points;

                    $distinguish_points = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('points');
                    $distinguish_points = ($distinguish_points) ? $distinguish_points : '';
                    $row['SK'] = $distinguish_points;

                    if ($filter['std_medals']) {
                        $row['M'] = $signup->ResultsPlacements->std_medal;
                    }
                    
                    if ($competition->results_prices && $filter['prices']) {
                        $row['Pris'] = $signup->ResultsPlacements->price;
                    }

                    $results[] = $row;
                }

                $results[] = 'header';
            }
        }

        return $results;
    }

    public function getFieldResults($competition, $filter){
        $weaponclasses = $competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        $results = [];

        foreach($weaponclasses as $index => $weaponclass){
            if($weaponclass){
                foreach ($weaponclass as $index => $signup) {
                    $row = [];

                    $total_points = 0;
                    $total_hits = 0;
                    $total_figure_hits = 0;

                    $row['Plats'] = $signup->ResultsPlacements->placement;
                    $row['Namn'] = $signup->User->fullName;
                    $row['Pistolskyttekortsnummer'] = $signup->User->shooting_card_number;
                    $row['Förening'] = substr($signup->Club->name, 0, 33);
                    $row['Vapengrupp'] = ($competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname; 

                    for($i=1; $i<=count($competition->Stations); $i++){
                        $result = $signup->Results->where('stations_id', $i)->first();
                        if ($result) {
                            $total_points += $result->points;
                            $total_figure_hits += $result->figure_hits;
                            $total_hits += $result->hits;
                            $row[(string) $i] = $result->hits . '/' . $result->figure_hits;
                        } else {
                            $row[(string) $i] = '0/0';
                        }
                    }

                    $row['Tot'] = $total_hits.'/'.$total_figure_hits;
                    $row['P'] = $total_points;

                    $distinguish_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('hits');
                    $distinguish_hits = ($distinguish_hits) ? $distinguish_hits : '';
                    $row['SK'] = $distinguish_hits;

                    if ($filter['std_medals']) {
                        $row['M'] = $signup->ResultsPlacements->std_medal;
                    }
                    
                    if ($competition->results_prices && $filter['prices']) {
                        $row['Pris'] = $signup->ResultsPlacements->price;
                    }

                    $results[] = $row;
                }

                $results[] = 'header';
            }
        }

        return $results;
    }

    public function getPointfieldResults($competition, $filter){
        $weaponclasses = $competition->Signups->groupBy('weaponclasses_id');

        $i=0;
        $results = [];
        foreach($weaponclasses as $index => $weaponclass){
            if($weaponclass){ 
                foreach ($weaponclass as $index => $signup) {
                    $row = [];

                    $total_points      = 0;
                    $total_hits        = 0;
                    $total_figure_hits = 0;

                    $row['Plats'] = $signup->ResultsPlacements->placement;
                    $row['Namn'] = $signup->User->fullName;
                    $row['Pistolskyttekortsnummer'] = $signup->User->shooting_card_number;
                    $row['Förening'] = substr($signup->Club->name, 0, 33);
                    $row['Vapengrupp'] = ($competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname; 

                    for ($i=1; $i <= count($competition->Stations); $i++) {
                        $result = $signup->Results->where('stations_id', $i)->first();

                        if ($result) {
                            $total_points += $result->points;
                            $total_figure_hits += $result->figure_hits;
                            $total_hits += $result->hits;
                            $row[(string)$i] = $result->hits.'/'.$result->figure_hits;
                        } else {
                            $row[(string)$i] = '0/0'; 
                        }
                    }

                    $row['T/F'] = $total_hits.'/'.$total_figure_hits;
                    $row['Tot'] = $total_hits+$total_figure_hits;
                    $row['P'] = $total_points;

                    $distinguish_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('hits');
                    $distinguish_hits = ($distinguish_hits) ? $distinguish_hits : 0;
                    $distinguish_figure_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('figure_hits');
                    $distinguish_figure_hits = ($distinguish_figure_hits) ? $distinguish_figure_hits : 0;
                    $distinguish_total = 0;
                    $distinguish_total += ($distinguish_hits) ? $distinguish_hits : 0;
                    $distinguish_total += ($distinguish_figure_hits) ? $distinguish_figure_hits : 0;
                    $distinguish_total = ($distinguish_total) ? $distinguish_figure_hits : '';
                    $row['SK'] = $distinguish_total;
                    
                    if ($filter['std_medals']) {
                        $row['M'] = $signup->ResultsPlacements->std_medal;
                    }
                    
                    if ($competition->results_prices && $filter['prices']) {
                        $row['Pris'] = $signup->ResultsPlacements->price;
                    }

                    $results[] = $row;
                }

                $results[] = 'header';
            }
        }

        return $results;
    }

    public function getMagnumResults($competition, $filter){
        $weaponclasses = $competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        $results = [];

        foreach($weaponclasses as $index => $weaponclass){
            if($weaponclass){
                foreach ($weaponclass as $index => $signup) {
                    $row = [];
                    $total_points = 0;
                    $total_hits = 0;
                    $total_figure_hits = 0;

                    $row['Plats'] = $signup->ResultsPlacements->placement;
                    $row['Namn'] = $signup->User->fullName;
                    $row['Pistolskyttekortsnummer'] = $signup->User->shooting_card_number;
                    $row['Förening'] = substr($signup->Club->name, 0, 33);
                    $row['Vapengrupp'] = ($competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname; 

                    for($i=1; $i<=count($competition->Stations); $i++){
                        $result = $signup->Results->where('stations_id', $i)->first();
                        if($result){
                            $total_points += $result->points;
                            $total_figure_hits += $result->figure_hits;
                            $total_hits += $result->hits;
                            $row[(string) $i] = $result->hits.'/'.$result->figure_hits;
                        } else {
                            $row[(string) $i] = '0/0';
                        }
                    }

                    $row['Tot'] = $total_hits.'/'.$total_figure_hits;
                    $row['P'] = $total_points;

                    $distinguish_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('hits');
                    $distinguish_hits = ($distinguish_hits) ? $distinguish_hits : '';
                    $row['SK'] = $distinguish_hits;

                    if ($filter['std_medals']) {
                        $row['M'] = $signup->ResultsPlacements->std_medal;
                    }
                    
                    if ($competition->results_prices && $filter['prices']) {
                        $row['Pris'] = $signup->ResultsPlacements->price;
                    }

                    $results[] = $row;
                }

                $results[] = 'header';
            }
        }
            

        return $results;
    }
}
