<?php

namespace App\Http\Controllers\Api;

use App\Models\Patrol;
use App\Repositories\SignupRepository;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Repositories\PatrolRepository;

use App\Http\Requests;

class CompetitionsAdminPatrolsController extends Controller
{
    public function __construct(PatrolRepository $patrols, SignupRepository $signups)
    {
        $this->middleware('checkUserCompetitionRole:patrols');
        $this->patrols = $patrols;
        $this->signups = $signups;
    }

    public function index($competitionsId)
    {
        $patrols = $this->patrols->getCompetitionPatrols($competitionsId);
        return response()->json(['patrols'=>$patrols]);
    }

    public function getPatrolsExtended($competitionsId)
    {
        $patrols = $this->patrols->getCompetitionPatrolsExtended($competitionsId);
        $signups = $this->patrols->getAvailableSignupsForCompetition($competitionsId);
        return response()->json(['patrols'=>$patrols, 'signups'=>$signups]);
    }

    public function store($competitionsId)
    {
        $patrol = $this->patrols->store($competitionsId);
        return response()->json(['patrol'=>$patrol]);
    }

    public function update($competitionsId, $patrolsId)
    {
        $patrol = $this->patrols->updatePatrol($competitionsId, $patrolsId);
        return response()->json(['patrol'=>$patrol]);
    }

    public function generate($competitionsId)
    {
        $patrols = $this->patrols->generatePatrols($competitionsId);
        $signups = $this->patrols->getAvailableSignupsForCompetition($competitionsId);
        return response()->json(['patrols'=>$patrols, 'signups'=>$signups]);
    }

    public function generateFinalsPatrols($competitionsId)
    {
        $patrols = $this->patrols->generateFinalsPatrols($competitionsId);
        return response()->json(['patrols'=>$patrols]);
    }

    public function generateDistinguishPatrols($competitionsId)
    {
        $patrols = $this->patrols->generateDistinguishPatrols($competitionsId);
        return response()->json(['patrols'=>$patrols]);
    }

    public function destroy($competitionsId, $patrolId)
    {
        $signups = $this->patrols->delete($competitionsId, $patrolId);
        return response()->json(['signups'=>$signups]);
    }

    public function destroyAll($competitionsId)
    {
        $signups = $this->patrols->deleteAll($competitionsId);
        return response()->json(['signups'=>$signups]);
    }

    public function emptyPatrol($competitionsId, $patrolId)
    {
        $signups = $this->patrols->emptyPatrol($competitionsId, $patrolId);
        return response()->json(['signups'=>$signups]);
    }
    
    public function updateSignup($competitionsId, $signupId)
    {
        $signup = $this->signups->update($competitionsId, $signupId);
        return response()->json(['signup'=>$signup]);
    }

    public function storeSignups(Request $request, $competitionsId)
    {
        if(!$request->has('patrols_id') || !$request->has('signups_id')) return response()->json(_('Du behöver välja en patrull och en anmälan för att kunna koppla anmälan till en patrull'), 404);
        $signup = $this->patrols->associateSignup($competitionsId, $request->get('patrols_id'), $request->get('signups_id'), $request->get('lane'));
        return response()->json(['patrols_id'=>$request->get('patrols_id'), 'signup'=>$signup]);
    }

    public function destroySignups(Request $request, $competitionsId)
    {
        if(!$request->has('patrols_id') || !$request->has('signups_id')) return response()->json(_('Du behöver välja en patrull och en anmälan för att kunna koppla anmälan till en patrull'), 404);
        $signup = $this->patrols->dissociateSignup($competitionsId, $request->get('patrols_id'), $request->get('signups_id'));
        return response()->json(['patrols_id'=>$request->get('patrols_id'), 'signup'=>$signup]);
    }

    public function export(Request $request, $competitionsId)
    {
        $this->patrols->generatePdf($competitionsId);
    }

}
