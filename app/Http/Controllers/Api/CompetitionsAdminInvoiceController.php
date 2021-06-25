<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\District;
use App\Models\Invoice;
use App\Models\Signup;
use Illuminate\Http\Request;

use App\Http\Requests;

class CompetitionsAdminInvoiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('checkUserCompetitionRole:signups');
    }

    public function show($competitionsId, $invoiceId)
    {
        $query = \App\Models\Invoice::with(
            'InvoiceRows',
            'Signups',
            'Signups.User',
            'Signups.Competition',
            'Signups.Weaponclass',
            'Teams',
            'Teams.Competition',
            'Teams.Weapongroup',
            'Recipient',
            'Sender',
            'User');
        $invoice = $query->find($invoiceId);

        return response()->json(['invoice'=>$invoice]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $competitionsId)
    {

        if($signupsId = $request->get('signups_id')):
            $query = Signup::with([
                'Competition',
                'Competition.Club',
                'User',
            ]);
            $query->whereNull('invoices_id');
            $signup = $query->find($signupsId);
            if($signup):
                $sender = ($signup->Competition->invoices_recipient_type == 'App\Models\District') ? District::find($signup->Competition->invoices_recipient_id) : Club::find($signup->Competition->invoices_recipient_id);


                $invoice = new Invoice;
                $invoice->created_by = \Auth::id();
                $invoice->recipient_id = $signup->users_id;
                $invoice->recipient_type = 'App\Models\User';
                $invoice->recipient_name = $signup->user->fullname;
                $invoice->sender_id = $sender->id;
                $invoice->sender_type = $signup->Competition->invoices_recipient_type;
                $invoice->sender_name = $sender->name;

                $invoice_nr = \App\Models\Invoice::GenerateInvoiceNumber($signup->Competition->invoices_recipient_type, $sender->id);

                $invoice->invoice_nr = $invoice_nr;
                $invoice->invoice_reference = $sender->id.date('Y').$invoice_nr;
                $invoice->sender_address_street = $sender->address_street;
                $invoice->sender_address_street_2 = $sender->address_street_2;
                $invoice->sender_address_zipcode = $sender->address_zipcode;
                $invoice->sender_address_city = $sender->address_city;
                $invoice->sender_bankgiro = $sender->bankgiro;
                $invoice->sender_postgiro = $sender->postgiro;
                $invoice->sender_swish = $sender->swish;
                $invoice->save();

                $invoice->InvoiceRows()->create([
                    'description' => $signup->User->full_name.' '.$signup->Competition->name.' '.$signup->Competition->date.' ('.(($signup->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname).')',
                    'quantity' => 1,
                    'unit' => _('st'),
                    'net_unit_amount' => $signup->registration_fee,
                    'vat_percent' => 0,
                    'vat_amount' => 0,
                    'row_net_amount' => 1 * $signup->registration_fee,
                    'row_vat_amount' => 0,
                    'row_sum_amount' => 1 * $signup->registration_fee,
                    'sortorder' => 1
                ]);
                $invoice->Signups()->save($signup);

                $amount = $invoice->InvoiceRows()->sum('row_sum_amount');
                $invoice->amount = $amount;

                $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date < date('Y-m-d')) ? date('Y-m-d') : $invoice->expiration_date;

                if($request->has('paid')):
                    $invoice->paid_at = date('Y-m-d H:i:s');
                endif;

                $invoice->save();
                return response()->json(['invoice'=>$invoice]);
            endif;
        endif;
    }

    public function download($competitionsId, $invoiceId)
    {
        $invoice = \App\Models\Invoice::find($invoiceId);
        if($invoice) $invoice->generatePdf();
    }

}
