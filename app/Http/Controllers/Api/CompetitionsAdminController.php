<?php

namespace App\Http\Controllers\Api;

use App\Models\Championship;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Competitiontype;
use App\Models\Signup;
use App\Repositories\CompetitionRepository;
use App\Contracts\ExcelInterface;

class CompetitionsAdminController extends Controller
{
    protected $excel;

    public function __construct(CompetitionRepository $competition, ExcelInterface $excel)
    {
        $this->middleware('checkUserCompetitionRole');
        $this->competition = $competition;
        $this->excel       = $excel;
    }

    public function index($competitionsId)
    {
        $user        = \Auth::user();
        $competition = Competition::with([
            'Club',
            'Club.District',
            'Patrols',
            'PatrolsFinals',
            'PatrolsDistinguish',
            'Stations',
            'Championship',
            'Weaponclasses',
            'Competitiontype'
        ])->find($competitionsId);

        $competition->makeVisible([
            'patrol_size',
            'max_competitors',
            'signups_closing_date',
            'start_time',
            'stations_count',
            'final_time',
            'patrol_time',
            'patrol_time_rest',
            'patrol_time_interval',
            'competitiontypes_id',
            'results_count'
        ]);

        $competition->weapongroups = $competition->weaponclasses->unique('weapongroups_id')->map(function ($weaponclass, $key) {
            return $weaponclass->weapongroup;
        });

        $competitiontypes = Competitiontype::orderBy('name')->get();

        $resultstypes = [
            ['type'=>'military', 'name' => _('Militär snabbmatch')],
            ['type'=> 'precision', 'name' => _('Precision')],
            ['type'=> 'field', 'name' => _('Fält')],
            ['type'=> 'pointfield', 'name' => _('Poängfält')],
            ['type'=> 'magnum', 'name' => _('Magnumfält')]
        ];

        $championships = Championship::where('clubs_id', $user->clubs_id)->orderBy('id', 'desc')->get();

        return response()->json([
            'competition'      => $competition,
            'competition_types'=> $competitiontypes,
            'results_types'    => $resultstypes,
            'championships'    => $championships,
            'available_clubs'  => $user->getClubsInAdministratedDistricts($competition->Club)
        ]);
    }

    public function update(Request $request, $competitionsId)
    {
        $competition = Competition::with([
            'Club',
            'Club.District',
            'Championship',
            'Weaponclasses',
            'Competitiontype'
        ])->find($competitionsId);

        $data = $request->except(['closed_at']);

        if ($request->has('google_maps')):
            preg_match('/(.*)src(.*)=(.*)"(.*)"/U', $data['google_maps'], $result);
        $data['google_maps'] = (count($result)) ? array_pop($result) : $data['google_maps'];
        endif;

        if ($request->get('invoices_recipient_type') == 'App\Models\District'):
            $data['invoices_recipient_type'] = 'App\Models\District';
        $data['invoices_recipient_id']       = $competition->Club->District->id; else:
            $data['invoices_recipient_type'] = 'App\Models\Club';
        $data['invoices_recipient_id']       = $competition->Club->id;
        endif;

        if ($request->get('organizer_type') == 'App\Models\District') {
            $data['organizer_id'] = $competition->Club->District->id;
        }

        $competition->update($data);

        $competition = Competition::with([
            'Championship',
            'Club',
            'Club.District',
            'Weaponclasses',
            'Competitiontype'
        ])->find($competitionsId);

        $competition->makeVisible([
            'patrol_size',
            'max_competitors',
            'signups_closing_date',
            'start_time',
            'stations_count',
            'final_time',
            'patrol_time',
            'patrol_time_rest',
            'patrol_time_interval',
            'competitiontypes_id'
        ]);

        return response()->json(['message'=>_('Tävlingen har uppdaterats'), 'competition'=>$competition]);
    }

    public function exportTeams(Request $request, $competitionsId)
    {
        $this->competition->generateTeamsPdf($competitionsId);
    }

    public function exportSignups(Request $request, $competitionsId)
    {
        $this->competition->generateSignupsPdf($competitionsId);
    }

    public function exportSignupsAsXlsx(Request $request, $competitionsId)
    {
        $signups = Signup::with('Club', 'User', 'Weaponclass')
            ->where('competitions_signups.competitions_id', $competitionsId)
            ->get()
            ->map(function ($row) {
                return [
                    'Föreningsnummer'         => ($row->Club) ? $row->Club->clubs_nr : '-',
                    'Föreningsnamn'           => ($row->Club) ? $row->Club->name : '-',
                    'Pistolskyttekortsnummer' => ($row->User) ? $row->User->shooting_card_number : '-',
                    'Förnamn'                 => ($row->User) ? $row->User->name : '-',
                    'Efternamn'               => ($row->User) ? $row->User->lastname : '-',
                    'Klass fält'              => ($row->User && $row->User->grade_field) ? $row->User->grade_field : '-',
                    'Vapenklass'              => ($row->Weaponclass) ? $row->Weaponclass->classname : '-',
                    'Önskemål'                => $row->special_wishes,
                    'Kommentar'               => $row->note
                ];
            })
            ->sortBy(function ($row) {
                return $row['Föreningsnamn'];
            });

        $filename = 'anmalningar-export-' . date('Y-m-d') . '.xlsx';
        $file     = $this->excel->create($filename, $signups);
        $this->excel->store($file, storage_path('app/public/admin/signup-exports'), 'xlsx');

        return response()->json(['filepath' => 'admin/signup-exports/' . $filename]);
    }

    public function exportShootingcards(Request $request, $competitionsId)
    {
        $this->competition->generateShootingcardsPdf($competitionsId);
    }

    public function close($competitionsId)
    {
        $timestamp = date('Y-m-d H:i:s');
        Competition::where('id', $competitionsId)->update(['closed_at' => $timestamp]);

        return response()->json(['message' => _('Tävlingen har stängts.'), 'closed_at' => $timestamp]);
    }
}
