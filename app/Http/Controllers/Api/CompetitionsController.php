<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\CreateCompetitionRequest;
use App\Jobs\SendNewCompetitionEmail;
use App\Models\Championship;
use App\Models\Competition;
use App\Models\CompetitionAdmin;
use App\Models\Competitiontype;
use Carbon\Carbon;
use Illuminate\Http\Request;

use App\Http\Controllers\Controller;

class CompetitionsController extends Controller
{

    public function __construct()
    {
        $this->middleware('checkUserClub')->only('create');
    }

    /**
     * Här skapas data till map.blade.php
     * för vidare bahandling till markörer
     */
     
    public function list(){
        $data=Competition::all();
        return view('map', ['data'=> $data]);
        }


        /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $searchstring = \Request::get('search');
        $usersignup = \Request::get('usersignup');
        $type = \Request::get('type');
        $clubs_id = \Request::get('clubs_id');
        $status = \Request::get('status');
        $hasUsersignup = \Request::get('has_usersignup');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $query = Competition::with('Championship', 'Competitiontype', 'Weaponclasses', 'Usersignups', 'Club');
        if($searchstring) $query->search($searchstring);
        if($status) $query->filterByStatus($status);
        if($hasUsersignup && $hasUsersignup !== 'false') $query->filterByHasUsersignup();
        if($type) $query->filterByType($type);
        if($clubs_id):
            $club = \Auth::user()->clubs()->first();
            $query->where('clubs_id', $club->id);
        else:
            $query->where('is_public', '1');
        endif;
        $query->orderBy('date', 'desc');
        $competitions = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($competitions->currentPage() > $competitions->lastPage()):
            \Request::replace(['page'=>$competitions->lastPage()]);
            $competitions = $query->paginate($perPage);
        endif;

        foreach($competitions as $competition):
            $weapongroups_array = $competition->weaponclasses->unique('weapongroups_id');
            $weapongroups = [];
            $competition->weapongroups = [];
            foreach($weapongroups_array as $weapongroup):
                $weapongroups[] = ['id'=>$weapongroup->id, 'name'=>$weapongroup->classname_general];
            endforeach;
            $competition->weapongroups = $weapongroups;
        endforeach;

        $competitions = $competitions->toArray();
        $competitions['search'] = $searchstring;
        $competitions['status'] = $status;
        $competitions['clubs_id'] = $clubs_id;
        $competitions['type'] = (int)$type;
        $competitions['usersignup'] = $usersignup;
        $competitions['competitiontypes'] = \App\Models\Competitiontype::orderBy('name')->get();

        return response()->json(['competitions'=>$competitions]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $user = \Auth::user();
        $club = $user->clubs()->first();
        if($club->user_has_role != 'admin') return response()->json(['message'=>_('Du behöver ha administratörsbehörighet för din förening för att skapa en tävling.')], 403);

        $club->load('District');

        $competition = new Competition();
        $competition->load('Weaponclasses');
        $competition->clubs_id = $club->id;
        $competition->load('Club');
        $competition->load('Club.District');
        $competition->date = date('Y-m-d');
        $competition->results_prices = 0;
        $competition->invoices_recipient_type = 'App\Models\Club';
        $competition->invoices_recipient_id = $club->id;
        $competition->organizer_type = 'App\Models\Club';
        $competition->organizer_id = $club->id;
        $competition->signups_opening_date = date('Y-m-d');
        $competition->signups_closing_date = date('Y-m-d');
        $competition->start_time = "08:00:00";
        $competition->final_time = "18:00:00";
        $competition->patrol_time = 90;
        $competition->patrol_time_rest = 20;
        $competition->patrol_time_interval = 10;

        $competition->makeVisible([
            'patrol_size',
            'max_competitors',
            'signups_opening_date',
            'signups_closing_date',
            'start_time',
            'contact_city',
            'lat',
            'lng',
            'stations_count',
            'final_time',
            'patrol_time',
            'patrol_time_rest',
            'patrol_time_interval',
            'competitiontypes_id'
        ]);

        $competitiontypes = Competitiontype::orderBy('name')->get();

        $resultstypes = [
            ['type'=>'military', 'name' => _('Militär snabbmatch')],
            ['type'=>'precision', 'name' => _('Precision')],
            ['type'=>'field', 'name' => _('Fält')],
            ['type'=>'pointfield', 'name' => _('Poängfält')]
        ];

        $championships = Championship::where('clubs_id', $user->clubs_id)->orderBy('id', 'desc')->get();

        $weaponclasses = \App\Models\Weaponclass::orderBy('classname')->get();

        $newChampionship = new Championship();

        return response()->json([
            'club'=>$club,
            'competition'=>$competition,
            'competition_types'=>$competitiontypes,
            'results_types'=>$resultstypes,
            'championships'=>$championships,
            'newChampionships'=>$newChampionship,
            'weaponclasses'=>$weaponclasses,
            'available_clubs' => $user->getClubsInAdministratedDistricts($club)
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(CreateCompetitionRequest $request)
    {
        $club = \Auth::user()->clubs()->first();
        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att skapa en tävling'), 403);

        $competition = new Competition();
        $competition->clubs_id = $club->id;
        $competition->fill($request->all());
        $competition->created_by = \Auth::id();

        if($request->get('invoices_recipient_type') == 'App\Models\District'):
            $competition->invoices_recipient_type = 'App\Models\District';
            $competition->invoices_recipient_id = $club->districts_id;
        else:
            $competition->invoices_recipient_type = 'App\Models\Club';
            $competition->invoices_recipient_id = $club->id;
        endif;


        /*
         * Här skapas lat och lng för orten där tävlingen sker.
         * Sparas i competition->lat och competition->lng
         * 
         */

    // locationiq funkar perfekt
        $address = $competition->contact_city;

        $json = file_get_contents('https://eu1.locationiq.com/v1/search.php?key=pk.0bf95265572a146a766348aff22ea4ad&q=' . $address . '&format=json');
        $jsonArr = json_decode($json);

        $lat = $jsonArr[0]->lat; 
        $lng = $jsonArr[0]->lon;

        $competition->lat = $lat; 
        $competition->lng = $lng; 
    // end locationiq




           if($request->get('organizer_type') == 'App\Models\District'){
            $competition->organizer_id = $club->districts_id;
        }
        if($request->has('google_maps')):
            preg_match('/(.*)src(.*)=(.*)"(.*)"/U', $request->get('google_maps'), $result);
            $competition->google_maps = (count($result)) ? array_pop($result) : $request->get('google_maps');
        endif;
        $competition->save();
        if($request->has('weaponclasses')):
            foreach($request->get('weaponclasses') as $weaponclass):
                $competition->Weaponclasses()->attach($weaponclass['weaponclasses_id'], ['registration_fee' => $weaponclass['registration_fee']]);
            endforeach;
        endif;

        CompetitionAdmin::create([
            'users_id' => \Auth::user()->id,
            'role' => 'admin',
            'competitions_id' => $competition->id
            ]);


        if(env('APP_ENV') == 'production'):
            $this->dispatch(new SendNewCompetitionEmail($competition));
        endif;

        return response()->json(['competitions_id'=>$competition->id]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $user = \Auth::user();

        $query = Competition::
            with([
                'UserRoles',
                'Championship',
                'Championship.Competitions',
                'Championship.Competitions.Weaponclasses',
                'Championship.Competitions.Competitiontype',
                'Club',
                'Club.District',
                'Competitiontype',
                'Usersignups'=>function($query){
                    $query->orderBy('weaponclasses_id');
                },
                'Usersignups.User',
                'Usersignups.Club',
                'Usersignups.Team'=>function($query){
                    $query->withPivot('position');
                },
                'Usersignups.Patrol',
                'Weaponclasses',
                'Weaponclasses.Weapongroup',
                'invoices_recipient'
            ]);
        $competitions = $query->findOrFail($id);
        $competitions->makeVisible([
            'teams_count',
            'results_count',
        ]);

        $competitions->weapongroups = $competitions->weaponclasses->unique('weapongroups_id')->map(function($weaponclass, $key){
            return $weaponclass->weapongroup;
        });

        return response()->json([
            'competitions'=>$competitions,
        ]);
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
}
