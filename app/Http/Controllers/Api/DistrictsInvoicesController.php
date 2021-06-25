<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use Illuminate\Http\Request;

class DistrictsInvoicesController extends Controller
{
    public function __construct()
    {
        $this->middleware('checkDistrictUserAdmin');
    }

    public function index(Request $request, $districtId)
    {
        $district = District::find($districtId);
        if($request->has('direction')):
            $invoices = $district->getFilteredInvoicesByDirection();
        else:
            $invoices['InvoicesIncoming'] = $district->InvoicesIncoming->count();
            $invoices['InvoicesOutgoing'] = $district->InvoicesOutgoing->count();
        endif;

        return response()->json(['invoices'=>$invoices]);
    }

    public function downloadInvoiceList(Request $request, $districtId)
    {
        if(!$request->has('direction')){
            return response()->json(['Vänligen välj inkommande eller utgående fakturor.'], 422);
        }

        $district = District::find($districtId);
        $invoices = $district->getFilteredInvoicesByDirection(false);

        $pdf = new \App\Classes\pdfInvoiceList($invoices);
        $pdf->create();
    }

    public function show($districtId, $id)
    {
        $district = District::find($districtId);
        $query = \App\Models\Invoice::with(
            'InvoiceRows',
            'Signups',
            'Signups.User',
            'Signups.Competition',
            'Signups.Weaponclass',
            'Teams',
            'Teams.Competition',
            'Teams.Weapongroup');
        $query->where(function($query) use ($district) {
            $query->where(function($query) use ($district) {
                $query->where('sender_type', 'App\Models\District');
                $query->where('sender_id', $district->id);
            });
            $query->orWhere(function($query) use ($district) {
                $query->where('recipient_type', 'App\Models\District');
                $query->where('recipient_id', $district->id);
            });
        });
        $invoice = $query->find($id);
        return response()->json(['invoice'=>$invoice]);
    }

    public function update(Request $request, $districtId, $id)
    {
        $district = District::find($districtId);
        $query = \App\Models\Invoice::where(function($query) use ($district) {
            $query->where(function($query) use ($district) {
                $query->where('sender_type', 'App\Models\District');
                $query->where('sender_id', $district->id);
            });
        });
        $invoice = $query->find($id);

        if($invoice):
            $invoice->fill($request->all())->save();
            return response()->json(['invoice'=>$invoice]);
        endif;
    }

    public function download($districtId, $invoiceId)
    {
        $district = District::find($districtId);
        $query = \App\Models\Invoice::with(
            'InvoiceRows',
            'Signups',
            'Signups.User',
            'Signups.Competition',
            'Signups.Weaponclass',
            'Teams',
            'Teams.Competition',
            'Teams.Weapongroup');
        $query->where(function($query) use ($district) {
            $query->where(function($query) use ($district) {
                $query->where('sender_type', 'App\Models\District');
                $query->where('sender_id', $district->id);
            });
            $query->orWhere(function($query) use ($district) {
                $query->where('recipient_type', 'App\Models\District');
                $query->where('recipient_id', $district->id);
            });
        });
        $invoice = $query->find($invoiceId);

        if($invoice) $invoice->generatePdf();
    }

}
