<?php
namespace App\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use App\Repositories\SignupRepository;
use App\Repositories\ResultsRepository;
use App\Models\Competition;
use App\Models\Patrol;
use App\Models\PatrolFinals;
use App\Models\PatrolDistinguish;
use App\Models\Signup;
use App\Models\Result;
use App\Models\ResultPlacement;

class PatrolRepository
{
    public function __construct(SignupRepository $signups, Request $request, ResultsRepository $results)
    {
        $this->signups = $signups;
        $this->request = $request;
        $this->results = $results;
    }

    public function getCompetitionPatrols($competitionsId)
    {
        $competition = Competition::find($competitionsId);

        if(!$this->request->has('patrol_type')):
            $query = Patrol::where('competitions_id', $competitionsId);
        elseif($this->request->get('patrol_type') == 'finals'):
            $query = PatrolFinals::where('competitions_id', $competitionsId);
        elseif($this->request->get('patrol_type') == 'distinguish'):
            $query = PatrolDistinguish::where('competitions_id', $competitionsId);
        endif;

        $query->with([
            'Signups',
            'Signups.User',
            'Signups.Club',
            'Signups.Weaponclass'
        ]);
        $query->orderBy('start_time');
        $patrols = $query->get();
        return $patrols;
    }

    public function getCompetitionPatrolsExtended($competitionsId)
    {
        $competition = Competition::find($competitionsId);
        $query = Patrol::where('competitions_id', $competitionsId);
        $query->with([
            'Signups',
            'Signups.User',
            'Signups.Club',
            'Signups.Weaponclass'
        ]);
        $query->orderBy('start_time');
        $patrols = $query->get();
        $patrols->each(function($patrol, $key) use ($competition){
            $this->signups->loadCollidingSignups($patrol->Signups, $competition->date);
        });
        return $patrols;
    }

    public function getAvailableSignupsForCompetition($competitionsId){
        $competition = Competition::find($competitionsId);

        $query = Signup::with('User','Club', 'Weaponclass');
        $query->where(function($query){
            $query->where('requires_approval', 0);
            $query->orWhere('is_approved_by', '!=', 0);
        });

        $query->where('competitions_id', $competition->id);
        $query->where('patrols_id', 0);
        $signups = $query->get();

        $this->signups->loadCollidingSignups($signups, $competition->date);

        return $signups;
    }

    public function store($competitionsId, $patrols_type=null)
    {
        $competition = Competition::with(['Patrols'=>function($query){
            $query->orderBy('start_time');
        }])->find($competitionsId);

        $competition->start_time = ($competition->start_time) ? $competition->start_time : '08:00:00';

        if($competition->Patrols->count()):
            $start_time = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $competition->Patrols->last()->start_time)->addMinutes($competition->patrol_time_interval)->format('Y-m-d H:i:s');
        else:
            $start_time = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $competition->date.' '.$competition->start_time)->format('Y-m-d H:i:s');
        endif;

        if($patrols_type == 'distinguish'):
            $patrol = new PatrolDistinguish;
            $patrol->sortorder = 1;
        elseif($patrols_type == 'finals'):
            $patrol = new PatrolFinals;
            $patrol->sortorder = 1;
        else:
            $patrol = new Patrol;
        endif;
        $patrol->competitions_id = $competition->id;
        $patrol->patrol_size = $competition->patrol_size;
        $patrol->start_time = $start_time;
        $patrol->end_time = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $start_time)->addMinutes($competition->patrol_time)->format('Y-m-d H:i:s');
        $patrol->save();
        $patrol->load('Signups');

        $this->updatePatrolSortorder($competition->load(['Patrols', 'PatrolsFinals', 'PatrolsDistinguish']));

        return $patrol;
    }
    
    public function updatePatrol($competitionsId, $patrolsId)
    {

        $competition = Competition::with(['Patrols'=>function($query){
            $query->orderBy('start_time');
        }])->find($competitionsId);

        $patrol = Patrol::with('Signups')->where('competitions_id', $competitionsId)->find($patrolsId);

        $patrol->update($this->request->all());

        if($this->request->has('start_time') || $this->request->has('end_time')):
            $patrol->Signups->each(function($signup, $index) use ($patrol, $competition){
                $signup->start_time = $patrol->start_time;
                $signup->end_time = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $patrol->end_time)->addMinutes($competition->patrol_time_rest)->format('Y-m-d H:i:s');
                $signup->save();
            });
        endif;
        $patrol->load('Signups','Signups.User','Signups.Club', 'Signups.Weaponclass');
        $this->signups->loadCollidingSignups($patrol->Signups, $competition->date);

        $this->updatePatrolSortorder($competition->load('Patrols'));

        return $patrol;
    }
    
    public function updatePatrolSortorder($competition)
    {
        if(count($competition->Patrols)):
            $sortorder=0;
            foreach($competition->Patrols as $patrol):
                $sortorder++;
                $patrol->sortorder = $sortorder;
                $patrol->save();
            endforeach;
        endif;
        if(count($competition->PatrolsFinals)):
            $sortorder=0;
            foreach($competition->PatrolsFinals as $patrol):
                $sortorder++;
                $patrol->sortorder = $sortorder;
                $patrol->save();
            endforeach;
        endif;
        if(count($competition->PatrolsDistinguish)):
            $sortorder=0;
            foreach($competition->PatrolsDistinguish as $patrol):
                $sortorder++;
                $patrol->sortorder = $sortorder;
                $patrol->save();
            endforeach;
        endif;
    }

    public function generatePatrols($competitionsId)
    {
        $query = Competition::with([
            'Patrols'=>function($query){
                $query->orderBy('start_time');
            }
        ]);
        $competition = $query->find($competitionsId);

        if(!$competition->Signups->count()) return true;

        $numberOfPatrolsToCreate = ceil($competition->Signups->count() / $competition->patrol_size);
        $numberOfSignupsPerPatrol = ceil($competition->Signups->count()/$numberOfPatrolsToCreate);

        $patrols = new Collection();
        for($i=0;$i<$numberOfPatrolsToCreate;$i++):
            $patrol = $this->store($competitionsId);
            $patrol->load('Signups','Signups.User','Signups.Club', 'Signups.Weaponclass');
            $patrols->push($patrol);
        endfor;

        $this->updatePatrolSortorder($competition->load('Patrols'));

        return $patrols;
    }

    public function generateDistinguishPatrols($competitionsId)
    {
        $competition = Competition::find($competitionsId);

        if($competition):

            $patrols = PatrolDistinguish::where('competitions_id', $competition->id)->get();
            $patrols->each(function($patrol, $index){
                $patrol->Signups()->each(function($signup, $index){
                    Result::where('signups_id', $signup->id)->where('distinguish', 1)->forceDelete();
                    $signup->PatrolDistinguish()->dissociate();
                });
                $patrol->delete();
            });


            if($competition->results_type == 'military' || $competition->results_type == 'precision' || $competition->results_type == 'field' || $competition->results_type == 'pointfield' || $competition->results_type == 'magnum'):

                // Recalculate all results for this competitions.
                $this->results->calculateResults($competition->id);

                /**
                 * Fetch all signups which share the same placement in in results_placements.
                 */
                $query = Signup::whereRaw(\DB::raw('id IN (select signups_id
                    from results_placements
                    where placement IN (
                        select placement
                        from results_placements as distinguish_placements
                        where placement != 0
                        and placement < 4
                        and distinguish_placements.competitions_id = results_placements.competitions_id
                        and distinguish_placements.weaponclasses_id = results_placements.weaponclasses_id
                        and results_placements.competitions_id = '.$competition->id.'
                        group by placement
                        having count(*) > 1
                    )
                    and competitions_id = '.$competition->id.'
                    and placement != 0
                    order by placement
                )'));
                $query->orderBy('weaponclasses_id');
                $signups = $query->get();

                if(count($signups)):
                    /**
                     * Group all signups by weaponclass and loop through weaponclasses
                     * Create suitable amount patrols for each weaponclass and assign the grouped signups even devided.
                     */
                    $weaponclasses = $signups->groupBy('weaponclasses_id');

                    foreach($weaponclasses as $weaponclass => $weaponclassSignups):
                        $patrol = $this->store($competitionsId, 'distinguish');

                        $numberOfPatrolsToCreate = ceil($weaponclassSignups->count() / $competition->patrol_size);
                        $numberOfSignupsPerPatrol = ceil($weaponclassSignups->count() / $numberOfPatrolsToCreate);

                        for($i=0;$i<$numberOfPatrolsToCreate;$i++):
                            $signups = $weaponclassSignups->splice(0,$numberOfSignupsPerPatrol);
                            $signups->each(function($signup, $index) use ($patrol, $competition){
                                $signup->lane_distinguish = ($signup->lane_finals) ? $signup->lane_finals : $index+1;
                                $signup->PatrolDistinguish()->associate($patrol->id)->save();
                            });
                        endfor;
                    endforeach;
                endif;
            endif;

            /**
             * Fetch all patrols and return to frontend.
             */
            $query = PatrolDistinguish::where('competitions_id', $competitionsId);
            $query->with([
                'Signups',
                'Signups.User',
                'Signups.Club',
                'Signups.Weaponclass'
            ]);
            $query->orderBy('start_time');
            $patrols = $query->get();
            return $patrols;
        endif;
    }
    public function generateFinalsPatrols($competitionsId)
    {
        $competition = Competition::with('weaponclasses')->find($competitionsId);
        if($competition):

            $laneoffset = 1;
            $formdata = $this->request->get('formdata');

            $patrols = PatrolFinals::where('competitions_id', $competition->id)->get();
            $patrols->each(function($patrol, $index){
                $patrol->Signups()->each(function($signup, $index){
                    Result::where('signups_id', $signup->id)->where('finals', 1)->forceDelete();
                    $signup->PatrolFinals()->dissociate();
                });
                $patrol->delete();
            });

            /**
             * Distinguish calculation of patrols depending on competitions results type.
             */
            if($competition->results_type == 'military' || $competition->results_type == 'precision' || $competition->results_type == 'field' || $competition->results_type == 'magnum'):

                // Recalculate all results for this competitions.
                $this->results->calculateResults($competition->id);

                /**
                 * Group all signups by weaponclass and loop through weaponclasses
                 * Create suitable amount patrols for each weaponclass and assign the grouped signups even devided.
                 */
                $patrol = $this->store($competitionsId, 'finals');
                foreach($competition->Weaponclasses as $weaponclass):

                    /**
                     * Set limit of minimum results points.
                     */
                    $pointslimit = (isset($formdata[$weaponclass->id]) && isset($formdata[$weaponclass->id]['pointslimit'])) ? $formdata[$weaponclass->id]['pointslimit'] : 0;

                    $query = ResultPlacement::with('Signup');
                    $query->where('competitions_id',$competition->id);
                    $query->where('weaponclasses_id', $weaponclass->id);
                    $query->where('points', '>=', $pointslimit);
                    $query->orderBy(\DB::raw('placement = 0, placement'));
                    $resultPlacements = $query->get();

                    if(count($resultPlacements)):
                        /**
                         * Adjust the laneoffset.
                         */
                        $laneoffset = (isset($formdata[$weaponclass->id]) && isset($formdata[$weaponclass->id]['laneoffset'])) ? $formdata[$weaponclass->id]['laneoffset'] : $laneoffset;
                        $numberOfSignupsForBestSixth = count($resultPlacements);
                        /*
                        $numberOfSignupsForBestSixth = ceil(count($resultPlacements)/6);

                        if($numberOfSignupsForBestSixth < 10):
                            $numberOfSignupsForBestSixth = (count($resultPlacements) < 10) ? count($resultPlacements) : 10;
                        endif;

                        */
                        $numberOfPatrolsToCreate = ceil($numberOfSignupsForBestSixth / $competition->patrol_size);
                        $numberOfSignupsPerPatrol = ceil($numberOfSignupsForBestSixth / $numberOfPatrolsToCreate);

                        $currentSignupNumber = 1;
                        $currentSignupPlacement = 1;

                        $signups = $resultPlacements->splice(0, $numberOfSignupsPerPatrol);
                        foreach($signups as $signup):
                            $signup->Signup->lane_finals = $laneoffset;
                            if($currentSignupNumber == count($signup) && $signup->placement == $currentSignupPlacement):
                                $signup->Signup->PatrolFinals()->associate($patrol->id)->save();
                            else:
                                $signup->Signup->PatrolFinals()->associate($patrol->id)->save();
                            endif;
                            $currentSignupNumber++;
                            $laneoffset++;
                            $currentSignupPlacement = $signup->placement;
                        endforeach;
                    endif;
                endforeach;
            endif;

            /**
             * Fetch all patrols and return to frontend.
             */
            $query = PatrolFinals::where('competitions_id', $competitionsId);
            $query->with([
                'Signups',
                'Signups.User',
                'Signups.Club',
                'Signups.Weaponclass'
            ]);
            $query->orderBy('start_time');
            $patrols = $query->get();
            return $patrols;
        endif;
    }

    public function generatePatrolsWithSignups($competitionsId)
    {
        $query = Competition::with([
            'Patrols'=>function($query){
                $query->orderBy('start_time');
            },
            'Patrols.Signups',
            'Signups'=>function($query){
                $query->where('patrols_id', 0);
            }
        ]);
        $competition = $query->find($competitionsId);

        if(!$competition->Signups->count()) return true;

        $numberOfPatrolsToCreate = ceil($competition->Signups->count() / $competition->patrol_size);
        $numberOfSignupsPerPatrol = ceil($competition->Signups->count()/$numberOfPatrolsToCreate);

        $patrols = new Collection();
        for($i=0;$i<$numberOfPatrolsToCreate;$i++):
            $patrol = $this->store($competitionsId);
            $signups = $competition->Signups->splice(0,$numberOfSignupsPerPatrol);
            $signups->each(function($signup, $index) use ($patrol, $competition){
                $signup->start_time = $patrol->start_time;
                $signup->end_time = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $patrol->end_time)->addMinutes($competition->patrol_time_rest)->format('Y-m-d H:i:s');
                $signup->Patrol()->associate($patrol->id)->save();
            });
            $patrol->load('Signups','Signups.User','Signups.Club', 'Signups.Weaponclass');
            $this->signups->loadCollidingSignups($patrol->Signups, $competition->date);
            $patrols->push($patrol);
        endfor;

        $this->updatePatrolSortorder($competition->load('Patrols'));

        return $patrols;
    }

    public function delete($competitionsId, $patrolsId)
    {
        $competition = Competition::find($competitionsId);
        $patrol = Patrol::with('Signups')->where('competitions_id', $competitionsId)->find($patrolsId);
        $signups = $patrol->Signups;
        $patrol->Signups->each(function($signup, $index){
            $signup->start_time = null;
            $signup->end_time = null;
            $signup->Patrol()->dissociate()->save();
        });
        $patrol->delete();
        $signups->load('User', 'Weaponclass');
        $this->signups->loadCollidingSignups($signups, $competition->date);

        $this->updatePatrolSortorder($competition->load('Patrols'));

        return $signups;
    }

    public function deleteAll($competitionsId)
    {
        $query = Competition::with('Patrols');
        $competition = $query->find($competitionsId);

        $competition->Patrols->each(function($patrol, $key) use ($competition){
            $this->delete($competition->id, $patrol->id);
        });

        $competition->load([
            'Signups'=>function($query){
                $query->where('patrols_id', 0);
            },
            'Signups.User',
            'Signups.Club',
            'Signups.Weaponclass'
        ]);

        $this->signups->loadCollidingSignups($competition->Signups, $competition->date);

        $this->updatePatrolSortorder($competition->load('Patrols'));

        return $competition->Signups;
    }

    public function emptyPatrol($competitionsId, $patrolsId)
    {
        $competition = Competition::find($competitionsId);
        $patrol = Patrol::with('Signups')->where('competitions_id', $competitionsId)->find($patrolsId);
        $signups = $patrol->Signups;
        $patrol->Signups->each(function($signup, $index){
            $signup->start_time = null;
            $signup->end_time = null;
            $signup->lane = 0;
            $signup->Patrol()->dissociate()->save();
        });
        $signups->load('User', 'Weaponclass');
        $this->signups->loadCollidingSignups($signups, $competition->date);
        return $signups;
    }

    /**
     * Associate the signup to a patrol.
     * Return the signup including new timestamps and patrol id.
     * The front-end uses the data to update colliding signups.
     *
     * @param $competitionsId
     * @param $patrolsId
     * @param $signupsId
     * @return mixed
     */
    public function associateSignup($competitionsId, $patrolsId, $signupsId, $lane=null)
    {
        $competition = Competition::find($competitionsId);
        $patrol = Patrol::with(['Signups'=>function($query){
            $query->orderBy('lane', 'desc');
            $query->limit(1);
        }])->where('competitions_id', $competitionsId)->find($patrolsId);
        if(!$lane):
            $lane = (count($patrol->Signups)) ? $patrol->Signups->first()->lane +1 : 1;
            if($patrol->patrol_size < $lane):
                $lane = null;
            endif;
        endif;

        $signup = Signup::find($signupsId);
        if($patrol && $signup):
            $signup->start_time = $patrol->start_time;
            $signup->end_time = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $patrol->end_time)->addMinutes($competition->patrol_time_rest)->format('Y-m-d H:i:s');
            $signup->lane = (int)$lane;
            $signup->Patrol()->associate($patrol->id)->save();
            return $signup;
        endif;
    }
    public function dissociateSignup($competitionsId, $patrolsId, $signupsId)
    {
        $patrol = Patrol::where('competitions_id', $competitionsId)->find($patrolsId);
        $signup = Signup::find($signupsId);
        if($patrol && $signup):
            $signup->start_time = null;
            $signup->end_time = null;
            $signup->lane = 0;
            $signup->Patrol()->dissociate()->save();
            return $signup;
        endif;
    }

    public function generatePdf($competitionsId)
    {
        $pdf = new \App\Classes\pdfPatrols();
        $pdf->create($competitionsId, $this->request->all());
    }
}