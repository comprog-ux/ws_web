<?php

namespace App\Http\Controllers\Api;

use App\Repositories\ResultsRepository;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CompetitionsAdminResultsController extends Controller
{
    public function __construct(ResultsRepository $results)
    {
        $this->middleware('checkUserCompetitionRole:results');
        $this->results = $results;
    }

    public function getResultsForRegistration(Request $request, $competitionsId)
    {
        $signups  = $this->results->getResultsForRegistration($competitionsId);
        $stations = \App\Models\Station::where('competitions_id', $competitionsId)->whereBetween('sortorder', [$request->get('station_start'), $request->get('station_end')])->orderBy('sortorder')->get();
        $patrols  = $this->results->getPatrols($competitionsId);

        return response()->json(['signups'=>$signups, 'stations'=>$stations, 'patrols'=>$patrols]);
    }

    public function storeResults(Request $request, $competitionsId)
    {
        $results = $this->results->storeResults($competitionsId);

        return response()->json(_('Resultatet sparades'));
    }

    public function export(Request $request, $competitionsId)
    {
        if ($request->has('format') && $request->get('format') === 'xlsx') {
            $filter = [
                'std_medals' => $request->get('std_medals'),
                'prices' => $request->get('prices'),
            ];
            $this->results->generateXlsx($competitionsId, $filter);
        } else {
            $this->results->calculateResults($competitionsId);
            $this->results->generatePdf($competitionsId);
        }
    }

    public function exportTeamsResults(Request $request, $competitionsId)
    {
        $this->results->generateTeamsResultsPdf($competitionsId);
    }

    public function shootingcards(Request $request, $competitionsId)
    {
        $this->results->generatePdf($competitionsId);
    }
}
