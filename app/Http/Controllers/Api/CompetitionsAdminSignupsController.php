<?php

namespace App\Http\Controllers\Api;

use App\Jobs\SendSignupApprovalConfimationEmail;
use App\Models\ResultPlacement;
use App\Repositories\SignupRepository;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Signup;
use App\Http\Requests;

class CompetitionsAdminSignupsController extends Controller
{
    public function __construct(SignupRepository $signups)
    {
        $this->middleware('checkUserCompetitionRole:signups');
        $this->signups = $signups;
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($competitionId)
    {
        $searchstring = \Request::get('search');
        $invoice = \Request::get('invoice');
        $status = \Request::get('status');

        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $query = Signup::with('Competition', 'Weaponclass','User','Club','Invoice');
        $query->select('competitions_signups.*');
        if($competitionId) $query->where('competitions_id', $competitionId);
        if($searchstring) $query->search($searchstring);
        if($invoice) $query->filterByInvoiceStatus($invoice);
        if($status) $query->filterByApprovalStatus($status);
        $query->orderBy('competitions_signups.created_at', 'desc');
        $signups = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($signups->currentPage() > $signups->lastPage()):
            \Request::replace(['page'=>$signups->lastPage()]);
            $signups = $query->paginate($perPage);
        endif;

        $signups->each(function($signup, $key){
            $signup->user->makeVisible('shooting_card_number');
        });
        $signups = $signups->toArray();
        $signups['search'] = $searchstring;
        $signups['status'] = $status;

        return response()->json([
            'signups'=> $signups
        ]);

    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $competitionsId)
    {
        $data = $request->all();
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId = $optimus->decode($request->get('users_id'));
        $user = User::find($userId)->load('Clubs');
        if(!$user->Clubs->first()) return response()->json(_('Användaren behöver vara ansluten till en förening innan du kan skapa en anmälan.'), 404);
        $data['clubs_id'] = $user->Clubs->first()->id;
        $data['users_id'] = $user->id;
        $data['created_by'] = \Auth::id();
        $registrationFee = \DB::table('competitions_weaponclasses')
            ->select('registration_fee')
            ->where('competitions_id', $data['competitions_id'])
            ->where('weaponclasses_id', $data['weaponclasses_id'])
            ->value('registration_fee');
        $data['registration_fee'] = $registrationFee;

        $signup = Signup::create($data);

        $signup = Signup::with('User')->find($signup->id);

        return response()->json($signup);
    }

    public function approveSignup(Request $request, $competitionsId, $signupsId)
    {
        $signup = Signup::where('competitions_id', $competitionsId)->find($signupsId);
        $input = $request->all();
        $signup->is_approved_by = \Auth::id();
        $signup->save();
        $signup->load(['Competition', 'Weaponclass','User','Club','Invoice']);

        if(env('APP_ENV') == 'production'):
            $this->dispatch(new SendSignupApprovalConfimationEmail($signup));
        endif;

        return response()->json(['signup'=>$signup]);
    }

    public function destroy($competitionsId, $id)
    {
        $query = Signup::with([
            'TeamSignup',
            'Results',
            'ResultsPlacements'
        ]);
        $query->where('competitions_id', $competitionsId);
        $query->whereNull('invoices_id');
        $signup = $query->find($id);

        if(!$signup) return response()->json(_('Anmälan du försöker ta bort verkar inte finnas.'), 404);

        foreach($signup->TeamSignup as $teamsignup):
            $teamsignup->delete();
        endforeach;

        foreach($signup->Results as $result):
            $result->delete();
        endforeach;

        if($signup->ResultsPlacements) $signup->ResultsPlacements->delete();

        $signup->delete();

        return response()->json('success');
    }

}
