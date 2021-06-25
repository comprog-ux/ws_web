<?php
namespace App\Repositories;

use App\Models\ResultPlacement;

class StandardMedalRepository {

    public function calculateStdMedals($competition){
        if ($competition->results_type == 'precision'):
            $this->calculateStdMedalsPrecision($competition);
        elseif ($competition->results_type == 'military'):
            $this->calculateStdMedalsMilitary($competition);
        elseif ($competition->results_type == 'magnum'):
            $this->calculateStdMedalsMagnum($competition);
        elseif ($competition->results_type == 'field'):
            $this->calculateStdMedalsField($competition);
        elseif ($competition->results_type == 'pointfield'):
            $this->calculateStdMedalsPointfield($competition);
        endif;
    }

    /**
     * Update all ResultPlacement for a given competition with results type Precision.
     * Result type precision is only based on points from the regular series.
     * Finals and distinguish points should not be included in the calculation.
     */
    public function calculateStdMedalsPrecision($competition)
    {
        $query = ResultPlacement::select('*');
        $query->addSelect(\DB::raw('(select 
                sum(IF(results.finals=0 and results.distinguish=0, results.points, 0)) 
                from results 
                where results.signups_id = results_placements.signups_id
            ) as points'));
        $query->where('competitions_id', $competition->id);
        $competition->resultPlacements = $query->get();

        if(count($competition->resultPlacements)):

            if($competition->championships_id):
                $weaponclasses = $competition->resultPlacements->groupBy('weaponclasses_id');
                foreach($weaponclasses as $weaponclass_id=>$resultPlacements):
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'points', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'points', 'bronze');
                    if($lastStdMedalSilverPoints || $lastStdMedalBronzePoints):
                        $query = \DB::table('results_placements');
                        $query->join(\DB::raw('(select 
                                signups_id, 
                                sum(IF(results.finals=0 and results.distinguish=0, results.points, 0)) points 
                                from results group by signups_id) results'
                        ), function($join){
                            $join->on('results.signups_id', '=', 'results_placements.signups_id');
                        });
                        $query->where('competitions_id', $competition->id);
                        $query->where('weaponclasses_id', $weaponclass_id);
                        $query->update(['std_medal' => \DB::raw(
                            'case
                                when (placement = 0) then null
                                when (results.points >= '.$lastStdMedalSilverPoints.') then "S"
                                when (results.points >= '.$lastStdMedalBronzePoints.') then "B"
                                else null	
                            end'
                        )]);
                    endif;
                endforeach;
            else:
                foreach($this->getWeapongroupsClasses() as $weapongroupclasses):
                    $resultPlacements = $competition->resultPlacements->whereIn('weaponclasses_id', $weapongroupclasses);
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'points', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'points', 'bronze');
                    if($lastStdMedalSilverPoints || $lastStdMedalBronzePoints):
                        $query = \DB::table('results_placements');
                        $query->join(\DB::raw('(select 
                                    signups_id, 
                                    sum(IF(results.finals=0 and results.distinguish=0, results.points, 0)) points 
                                    from results group by signups_id) results'
                        ), function($join){
                            $join->on('results.signups_id', '=', 'results_placements.signups_id');
                        });
                        $query->whereIn('weaponclasses_id', $weapongroupclasses);
                        $query->where('competitions_id', $competition->id);
                        $query->update(['std_medal' => \DB::raw(
                            'case
                                when (placement = 0) then null
                                when (results.points >= '.$lastStdMedalSilverPoints.') then "S"
                                when (results.points >= '.$lastStdMedalBronzePoints.') then "B"
                                else null	
                            end'
                        )]);
                    endif;
                endforeach;
            endif;

            /**
             * Check and update all results with default medal points for each weapongroup.
             */
            $query = \DB::table('results_placements');
            $query->join(\DB::raw('(select
                signups_id,
                sum(IF(results.finals=0 and results.distinguish=0, results.points, 0)) points
                from results group by signups_id) results'
            ), function($join){
                $join->on('results.signups_id', '=', 'results_placements.signups_id');
            });
            $query->where('competitions_id', $competition->id);
            $query->update(['std_medal' => \DB::raw(
                'case
                    #Silver
                    when (
                        (results.points >= 323 and weaponclasses_id IN(1,2,3))
                        or (results.points >= 329 and weaponclasses_id IN(11,12,13))
                        or (results.points >= 330 and weaponclasses_id IN(20,21,22,23,24,25,26,27,28,29))
                    )
                    then "S"
                    #Bronze
                    when (
                        (results.points >= 312 and std_medal is null and weaponclasses_id IN(1,2,3))
                        or (results.points >= 319 and std_medal is null and weaponclasses_id IN(11,12,13))
                        or (results.points >= 322 and std_medal is null and weaponclasses_id IN(20,21,22,23,24,25,26,27,28,29))
                    )
                    then "B"
                    else results_placements.std_medal
                end'
            )]);
        endif;
    }
    /**
     * Update all ResultPlacement for a given competition with results type Military.
     */
    public function calculateStdMedalsMilitary($competition)
    {
        $query = ResultPlacement::select('*');
        $query->where('competitions_id', $competition->id);
        $competition->resultPlacements = $query->get();

        if(count($competition->resultPlacements)):

            if($competition->championships_id):
                $weaponclasses = $competition->resultPlacements->groupBy('weaponclasses_id');
                foreach($weaponclasses as $weaponclass_id=>$resultPlacements):
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'points', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'points', 'bronze');
                    $query = \DB::table('results_placements');
                    $query->where('competitions_id', $competition->id);
                    $query->where('weaponclasses_id', $weaponclass_id);
                    $query->update(['std_medal' => \DB::raw(
                        'case
                            when (placement = 0) then null
                            when (points >= '.$lastStdMedalSilverPoints.') then "S"
                            when (points >= '.$lastStdMedalBronzePoints.') then "B"
                            else null	
                        end'
                    )]);
                endforeach;
            else:
                foreach($this->getWeapongroupsClasses() as $weapongroupclasses):
                    $resultPlacements = $competition->resultPlacements->whereIn('weaponclasses_id', $weapongroupclasses);
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'points', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'points', 'bronze');
                    if($lastStdMedalSilverPoints || $lastStdMedalBronzePoints):
                        $query = \DB::table('results_placements');
                        $query->join(\DB::raw('(select 
                                    signups_id, 
                                    sum(IF(results.finals=0 and results.distinguish=0, results.points, 0)) points 
                                    from results group by signups_id) results'
                        ), function($join){
                            $join->on('results.signups_id', '=', 'results_placements.signups_id');
                        });
                        $query->whereIn('weaponclasses_id', $weapongroupclasses);
                        $query->where('competitions_id', $competition->id);
                        $query->update(['std_medal' => \DB::raw(
                            'case
                                when (placement = 0) then null
                                when (results.points >= '.$lastStdMedalSilverPoints.') then "S"
                                when (results.points >= '.$lastStdMedalBronzePoints.') then "B"
                                else null	
                            end'
                        )]);
                    endif;
                    endforeach;
            endif;

            /**
             * Check and update all results with default medal points for each weapongroup.
             */
            $query = \DB::table('results_placements');
            $query->where('competitions_id', $competition->id);
            $query->update(['std_medal' => \DB::raw(
                'case
                    #Silver
                    when (
                        (points >= 540 and weaponclasses_id IN(1,2,3))
                        or (points >= 561 and weaponclasses_id IN(11,12,13))
                        or (points >= 564 and weaponclasses_id IN(20,21,22,23,24,25,26,27,28,29))
                        or (points >= 552 and weaponclasses_id IN(31,32,33))
                    )
                    then "S"
                    #Bronze
                    when (
                        (points >= 516 and std_medal is null and weaponclasses_id IN(1,2,3))
                        or (points >= 537 and std_medal is null and weaponclasses_id IN(11,12,13))
                        or (points >= 540 and std_medal is null and weaponclasses_id IN(20,21,22,23,24,25,26,27,28,29))
                        or (points >= 528 and std_medal is null and weaponclasses_id IN(31,32,33))
                    )
                    then "B"
                    else results_placements.std_medal
                end'
            )]);
        endif;
    }
    /**
     * Update all ResultPlacement for a given competition with results type Field.
     */
    public function calculateStdMedalsField($competition)
    {
        $query = ResultPlacement::select('*');
        $query->where('competitions_id', $competition->id);
        $competition->resultPlacements = $query->get();

        if(count($competition->resultPlacements)):

            if($competition->championships_id):
                $weaponclasses = $competition->resultPlacements->groupBy('weaponclasses_id');
                foreach($weaponclasses as $weaponclass_id=>$resultPlacements):
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'hits', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'hits', 'bronze');
                    $query = \DB::table('results_placements');
                    $query->where('competitions_id', $competition->id);
                    $query->where('weaponclasses_id', $weaponclass_id);
                    $query->update(['std_medal' => \DB::raw(
                        'case
                            when (placement = 0) then null
                            when (hits >= '.$lastStdMedalSilverPoints.') then "S"
                            when (hits >= '.$lastStdMedalBronzePoints.') then "B"
                            else null	
                        end'
                    )]);
                endforeach;
            else:
                foreach($this->getWeapongroupsClasses() as $weapongroupclasses):
                    $resultPlacements = $competition->resultPlacements->whereIn('weaponclasses_id', $weapongroupclasses);
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'hits', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'hits', 'bronze');
                    if($lastStdMedalSilverPoints || $lastStdMedalBronzePoints):
                        $query = \DB::table('results_placements');
                        $query->where('competitions_id', $competition->id);
                        $query->whereIn('weaponclasses_id', $weapongroupclasses);
                        $query->update(['std_medal' => \DB::raw(
                            'case
                                when (placement = 0) then null
                                when (hits >= '.$lastStdMedalSilverPoints.') then "S"
                                when (hits >= '.$lastStdMedalBronzePoints.') then "B"
                                else null	
                            end'
                        )]);
                    endif;
                endforeach;
            endif;
        endif;
    }
    /**
     * Update all ResultPlacement for a given competition with results type Pointfield.
     */
    public function calculateStdMedalsPointfield($competition)
    {
        $query = ResultPlacement::select('*',\DB::raw('(hits+figure_hits) as pointfield'));
        $query->where('competitions_id', $competition->id);
        $competition->resultPlacements = $query->get();

        if(count($competition->resultPlacements)):

            if($competition->championships_id):
                $weaponclasses = $competition->resultPlacements->groupBy('weaponclasses_id');
                foreach($weaponclasses as $weaponclass_id=>$resultPlacements):
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'pointfield', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'pointfield', 'bronze');
                    $query = \DB::table('results_placements');
                    $query->where('competitions_id', $competition->id);
                    $query->where('weaponclasses_id', $weaponclass_id);
                    $query->update(['std_medal' => \DB::raw(
                        'case
                            when (placement = 0) then null
                            when ((hits+figure_hits) >= '.$lastStdMedalSilverPoints.') then "S"
                            when ((hits+figure_hits) >= '.$lastStdMedalBronzePoints.') then "B"
                            else null	
                        end'
                    )]);
                endforeach;
            else:
                foreach($this->getWeapongroupsClasses() as $weapongroupclasses):
                    $resultPlacements = $competition->resultPlacements->whereIn('weaponclasses_id', $weapongroupclasses);
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'pointfield', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'pointfield', 'bronze');
                    if($lastStdMedalSilverPoints || $lastStdMedalBronzePoints):
                        $query = \DB::table('results_placements');
                        $query->where('competitions_id', $competition->id);
                        $query->whereIn('weaponclasses_id', $weapongroupclasses);
                        $query->update(['std_medal' => \DB::raw(
                            'case
                                when (placement = 0) then null
                                when ((hits+figure_hits) >= '.$lastStdMedalSilverPoints.') then "S"
                                when ((hits+figure_hits) >= '.$lastStdMedalBronzePoints.') then "B"
                                else null	
                            end'
                        )]);
                    endif;
                endforeach;
            endif;
        endif;
    }

    /**
     * Update all ResultPlacement for a given competition with competitionstype Magnum and results type Field.
     */
    public function calculateStdMedalsMagnum($competition)
    {
        $ranking_concat = 'CONCAT(';
        $ranking_concat .= 'LPAD(hits, 3, 0),';
        $ranking_concat .= 'LPAD(figure_hits, 3, 0),';
        $ranking_concat .= 'LPAD(points, 3, 0)';
        $ranking_concat .= ')';
        $ranking_sql = $ranking_concat.' as magnumfield';

        $query = ResultPlacement::select([
            '*',
            \DB::raw($ranking_sql)
        ]);
        $query->where('competitions_id', $competition->id);
        $competition->resultPlacements = $query->get();

        if(count($competition->resultPlacements)):

            if($competition->championships_id):
                $weaponclasses = $competition->resultPlacements->groupBy('weaponclasses_id');
                foreach($weaponclasses as $weaponclass_id=>$resultPlacements):
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'magnumfield', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'magnumfield', 'bronze');
                    $query = \DB::table('results_placements');
                    $query->where('competitions_id', $competition->id);
                    $query->where('weaponclasses_id', $weaponclass_id);
                    $query->update(['std_medal' => \DB::raw(
                        'case
                            when (placement = 0) then null
                            when (('.$ranking_concat.') >= '.$lastStdMedalSilverPoints.') then "S"
                            when (('.$ranking_concat.') >= '.$lastStdMedalBronzePoints.') then "B"
                            else null	
                        end'
                    )]);
                endforeach;
            else:
                foreach($this->getWeapongroupsClasses() as $weapongroupclasses):
                    $resultPlacements = $competition->resultPlacements->whereIn('weaponclasses_id', $weapongroupclasses);
                    $lastStdMedalSilverPoints = $this->getStdMedalLimit($resultPlacements, 'magnumfield', 'silver');
                    $lastStdMedalBronzePoints = $this->getStdMedalLimit($resultPlacements, 'magnumfield', 'bronze');
                    if($lastStdMedalSilverPoints || $lastStdMedalBronzePoints):
                        $query = \DB::table('results_placements');
                        $query->where('competitions_id', $competition->id);
                        $query->whereIn('weaponclasses_id', $weapongroupclasses);
                        $query->update(['std_medal' => \DB::raw(
                            'case
                                when (placement = 0) then null
                                when (('.$ranking_concat.') >= '.$lastStdMedalSilverPoints.') then "S"
                                when (('.$ranking_concat.') >= '.$lastStdMedalBronzePoints.') then "B"
                                else null	
                            end'
                        )]);
                    endif;
                endforeach;
            endif;
        endif;
    }

    public function getStdMedalLimit($results, $column, $std_medal)
    {
        $points = 0;
        $results = $results->filter(function($item) use ($column){ return $item->$column > 0; })->sortByDesc($column)->values()->all();
        if(count($results) && $std_medal == 'silver'):
            $numberOfMedalists = floor(count($results)/9);
            $points = ($numberOfMedalists >= 1) ? $results[$numberOfMedalists-1]->$column : 999999999;
        elseif(count($results) && $std_medal == 'bronze'):
            $numberOfMedalists = floor(count($results)/3);
            $numberOfMedalists = ($numberOfMedalists < 1) ? 1 : $numberOfMedalists;
            $points = $results[$numberOfMedalists-1]->$column;
        endif;
        return $points;
    }

    public function getWeapongroupsClasses()
    {
        $groups = [];
        $groups[] = [1,2,3];
        $groups[] = [11,12,13];
        $groups[] = [20,21,22,23,24,25,26,27,28,29];
        $groups[] = [31,32,33];
        return $groups;
    }

}