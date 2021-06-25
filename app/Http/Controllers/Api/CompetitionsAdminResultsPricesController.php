<?php

namespace App\Http\Controllers\Api;

use App\Models\Competition;
use App\Models\ResultPlacement;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Repositories\ResultsRepository;

class CompetitionsAdminResultsPricesController extends Controller
{
    protected $results;

    public function __construct(ResultsRepository $results){
        $this->results = $results;
    }

    public function index($competitionsId){
        $competition = Competition::find($competitionsId);

        $query = ResultPlacement::select([
            'results_placements.*',
            \DB::raw('CONCAT(users.name, " ", users.lastname) as username'),
            'clubs.name as clubsname'
        ]);
        $query->leftJoin('competitions_signups', 'competitions_signups.id', '=', 'results_placements.signups_id');
        $query->leftJoin('users', 'competitions_signups.users_id', '=', 'users.id');
        $query->leftJoin('clubs', 'competitions_signups.clubs_id', '=', 'clubs.id');
        $query->with('Weaponclass');
        $query->where('results_placements.competitions_id', $competition->id);
        $query->orderBy('results_placements.placement', 'ASC');
        $results = $query->get();

        return response()->json(['results'=>$results]);

    }

    public function update(Request $request, $competitionsId, $placementsId)
    {
        $query = ResultPlacement::where('competitions_id', $competitionsId);
        $result = $query->find($placementsId);
        $result->price = ($request->has('price')) ? $request->get('price') : null;
        $result->placement = ($request->has('placement')) ? $request->get('placement') : null;
        $result->save();

        Competition::updateResultCache($competitionsId);
        $this->results->generatePdf($competitionsId, false);

        return response()->json($result);
    }

}
