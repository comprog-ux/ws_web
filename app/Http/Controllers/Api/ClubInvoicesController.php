<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

use App\Http\Requests;
use App\Models\Invoice;
use App\Models\Signup;

class ClubInvoicesController extends Controller
{

    public function __construct(\App\Repositories\InvoiceRepository $invoices)
    {
        $this->invoices = $invoices;
    }

    /**
     * Retreive all payments for a club attached to the current user.
     * Specify payment direction by payment_direction request.
     *
     * @param Request $request
     * @return mixed
     */
    public function index(Request $request){
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        /**
         * Invoices
         */
        if($request->has('direction')):
            $invoices = $club->getFilteredInvoicesByDirection();
        else:
            $invoices['InvoicesIncoming'] = $club->InvoicesIncoming->count();
            $invoices['InvoicesOutgoing'] = $club->InvoicesOutgoing->count();
        endif;

        /**
         * To generate
         */
        $query = Signup::where('clubs_id', $club->id);
        $query->whereNull('invoices_id');
        $invoices_generate = $query->get();

        return response()->json([
            'invoices'=>$invoices,
            'invoices_generate'=>$invoices_generate
        ]);
    }

    public function downloadInvoiceList(Request $request)
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        if(!$request->has('direction')){
            return response()->json(['Vänligen välj inkommande eller utgående fakturor.'], 422);
        }

        $invoices = $club->getFilteredInvoicesByDirection(false);

        $pdf = new \App\Classes\pdfInvoiceList($invoices);
        $pdf->create();
    }

    public function show($id)
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        $invoice = $this->invoices->findInvoiceForClub($club, $id);

        return response()->json(['invoice'=>$invoice]);
    }

    public function getPendingSignups()
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);
        $invoiceClubs = $this->invoices->getPendingClubSignups($club->id);
        return response()->json(['clubs'=>$invoiceClubs]);
    }

    public function update(Request $request, $id)
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);
        $query = Invoice::where(function($query) use ($club) {
            $query->where(function($query) use ($club) {
                $query->where('sender_type', 'App\Models\Club');
                $query->where('sender_id', $club->id);
            });
        });
        $invoice = $query->find($id);

        if($invoice):
            $invoice->fill($request->all())->save();
            return response()->json(['invoice'=>$invoice]);
        endif;

    }

    public function store(Request $request)
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        $signupIds = null;
        $signupsSelected = ($request->exists('signup_ids'));
        if($request->has('signup_ids')){
            $signupIds = explode(',', $request->get('signup_ids'));
        }

        $teamIds = null;
        $teamsSelected = ($request->exists('team_ids'));
        if($request->has('team_ids')){
            $teamIds = explode(',', $request->get('team_ids'));
        }

        // If all options are unchecked, display error message.
        if(($signupsSelected && !$signupIds) && ($teamsSelected && !$teamIds)){
            return response()->json(['message'=>_('Du måste välja minst en rad att fakturera')], 422);
        }
        
        $this->invoices->createInvoicesForClub($club, $signupIds, $teamIds);

        return response()->json(['message'=>_('Dina fakturor är skapade')]);
    }

    public function download($id)
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        $invoice = $this->invoices->findInvoiceForClub($club, $id);

        if($invoice) $invoice->generatePdf();
    }


}
