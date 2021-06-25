<?php

namespace App\Http\Controllers\Api;

use App\Models\Club;
use App\Models\District;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

use App\Http\Requests;
use App\Models\Invoice;
use App\Models\Signup;

class InvoicesController extends Controller
{
    /**
     * Retreive all payments for a club attached to the current user.
     * Specify payment direction by payment_direction request.
     *
     * @param Request $request
     * @return mixed
     */
    public function index(Request $request){
        $user = \Auth::user();

        $user->load([
            'InvoicesIncoming'=>function($query){
                $query->orderBy('created_at', 'desc');
            },
            'InvoicesOutgoing'=>function($query){
                $query->orderBy('created_at', 'desc');
            },
        ]);

        $query = Signup::where('users_id', $user->id);
        $query->whereNull('invoices_id');
        $invoices_generate = $query->get();

        return response()->json([
            'invoices_incoming'=>$user->InvoicesIncoming,
            'invoices_outgoing'=>$user->InvoicesOutgoing,
            'invoices_generate'=>$invoices_generate
        ]);
    }

    public function show($id)
    {
        $user = \Auth::user();

        $query = Invoice::with(
            'InvoiceRows',
            'Signups',
            'Signups.User',
            'Signups.Competition',
            'Signups.Weaponclass');
        $query->where(function($query) use ($user) {
            $query->where(function($query) use ($user) {
                $query->where('sender_type', 'App\Models\User');
                $query->where('sender_id', $user->id);
            });
            $query->orWhere(function($query) use ($user) {
                $query->where('recipient_type', 'App\Models\User');
                $query->where('recipient_id', $user->id);
            });
        });
        $invoice = $query->find($id);

        return response()->json(['invoice'=>$invoice]);
    }

    public function getPendingSignups()
    {
        $user = \Auth::user();

        $query = Signup::with('User', 'Competition', 'Weaponclass');
        $query->whereHas('Club', function($query){
            $query->where('clubs.disable_personal_invoices', 0);
        });
        $query->where(function($query){
            $query->where('requires_approval', 0);
            $query->orWhere('is_approved_by', '!=', 0);
        });

        $query->where('users_id', $user->id);
        $query->whereNull('invoices_id');
        $signups = $query->get();

        return response()->json(['signups'=>$signups]);

    }

    public function update(Request $request, $id)
    {
        $user = \Auth::user();

        $query = Invoice::where(function($query) use ($user) {
            $query->orWhere(function($query) use ($user) {
                $query->where('recipient_type', 'App\Models\User');
                $query->where('recipient_id', $user->id);
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
        $signupIds = null;
        if($request->has('signup_ids')){
            $signupIds = explode(',', $request->get('signup_ids'));
        }

        $user = \Auth::user();

        $query = Signup::with([
            'User',
            'Competition',
            'Weaponclass'
        ]);
        $query->select('competitions_signups.*', 'competitions.invoices_recipient_id as invoices_recipient_id', 'competitions.invoices_recipient_type as invoices_recipient_type');
        $query->where(function($query){
            $query->where('requires_approval', 0);
            $query->orWhere('is_approved_by', '!=', 0);
        });
        if($signupIds){
            $query->whereIn('competitions_signups.id', $signupIds);
        }
        $query->where('competitions_signups.users_id', $user->id);
        $query->leftJoin('competitions','competitions.id','=','competitions_id');
        $query->whereNull('invoices_id');
        $query->whereNotNull('competitions.clubs_id');
        $signups = $query->get();

        $invoices = new \Illuminate\Database\Eloquent\Collection;

        $invoicesRecipientTypes = $signups->groupBy('invoices_recipient_type');
        $invoicesRecipientTypes->each(function($invoiceRecipientType, $type) use($user, $invoices){
            $signupsGroupedBySender = $invoiceRecipientType->groupBy('invoices_recipient_id');
            $signupsGroupedBySender->each(function($signups, $index) use($user, $invoices, $type) {
                $sender = ($type == 'App\Models\District') ? District::find($index) : Club::find($index);
                $invoice = new Invoice;
                $invoice->created_by = \Auth::id();
                $invoice->recipient_id = $user->id;
                $invoice->recipient_type = 'App\Models\User';
                $invoice->recipient_name = $user->fullname;
                #$invoice->recipient_address_street = $club->address_street;
                #$invoice->recipient_address_street_2 = $club->address_street_2;
                #$invoice->recipient_address_zipcode = $club->address_zipcode;
                #$invoice->recipient_address_city = $club->address_city;
                $invoice->sender_id = $sender->id;
                $invoice->sender_type = $type;
                $invoice->sender_name = $sender->name;

                $invoice_nr = \App\Models\Invoice::GenerateInvoiceNumber($type, $sender->id);

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

                $sortorder = 0;
                $signups->each(function ($item, $key) use ($invoice, $sortorder) {
                    $sortorder++;
                    $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date > $item->Competition->signups_closing_date) ?  $item->Competition->signups_closing_date : $invoice->expiration_date;
                    $invoice->InvoiceRows()->create([
                        'description' => $item->User->full_name.' '.$item->Competition->name.' '.$item->Competition->date.' ('.(($item->Competition->championships_id) ? $item->weaponclass->classname_general : $item->weaponclass->classname).')',
                        'quantity' => 1,
                        'unit' => _('st'),
                        'net_unit_amount' => $item->registration_fee,
                        'vat_percent' => 0,
                        'vat_amount' => 0,
                        'row_net_amount' => 1 * $item->registration_fee,
                        'row_vat_amount' => 0,
                        'row_sum_amount' => 1 * $item->registration_fee,
                        'sortorder' => $sortorder
                    ]);
                    $invoice->Signups()->save($item);
                });

                $amount = $invoice->InvoiceRows()->sum('row_sum_amount');
                $invoice->amount = $amount;
                /**
                 * Expiration date is set during the team and signups loop.
                 * But change this to current date if the compitions signups_closing_date is in the past.
                 * Also set the expiration date to current date if is empty.
                 */
                $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date < date('Y-m-d')) ? date('Y-m-d') : $invoice->expiration_date;

                $invoice->save();

                $invoices->push($invoice);
            });
        });

        return response()->json(['message'=>_('Dina fakturor är skapade')]);
    }

    public function download($id)
    {
        $user = \Auth::user();

        $query = Invoice::where(function($query) use ($user) {
            $query->where(function($query) use ($user) {
                $query->where('sender_type', 'App\Models\User');
                $query->where('sender_id', $user->id);
            });
            $query->orWhere(function($query) use ($user) {
                $query->where('recipient_type', 'App\Models\User');
                $query->where('recipient_id', $user->id);
            });
        });
        $invoice = $query->find($id);

        if($invoice) $invoice->generatePdf();
    }

}
