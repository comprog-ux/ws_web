<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\ResultPlacement;
use Illuminate\Http\Request;

use App\Http\Requests;
use Illuminate\Support\Facades\Storage;

class CompetitionsResultsController extends Controller
{
    public function index($competitionsId){
        $competitions = Competition::find($competitionsId);
        if($competitions->results_is_public || count($competitions->UserRoles)):
            $resultsFilePath = '/competitions/'.$competitionsId.'/results/webshooter-resultat-'.$competitionsId.'.json';
            if(Storage::exists($resultsFilePath)):
                $results = Storage::get($resultsFilePath);
                $results = json_decode($results);
            else:
                $results = Competition::updateResultCache($competitionsId);
            endif;
        else:
            $results = [];
        endif;

        return response()->json(['results'=>$results]);
    }

    public function export($competitionsId)
    {
        $pdfFilePath = '/competitions/'.$competitionsId.'/results/webshooter-resultat-'.$competitionsId.'.pdf';
        if(Storage::exists($pdfFilePath)):
            return response()->download(storage_path().'/app'.$pdfFilePath);
        endif;
    }
}
