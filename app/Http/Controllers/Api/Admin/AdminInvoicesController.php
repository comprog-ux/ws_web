<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

class AdminInvoicesController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $searchstring = \Request::get('search');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;
        $payment_status = \Request::get('payment_status');


        $query = \App\Models\Invoice::orderBy('invoices.created_at', 'DESC');
        if($searchstring) $query->search($searchstring);
        if($payment_status) $query->filterByPaymentStatus($payment_status);
        $invoices = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($invoices->currentPage() > $invoices->lastPage()):
            \Request::replace(['page'=>$invoices->lastPage()]);
            $invoices = $query->paginate($perPage);
        endif;
        $invoices = $invoices->toArray();
        $invoices['search'] = $searchstring;
        $invoices['payment_status'] = $payment_status;

        $query = \App\Models\Invoice::orderBy('invoices.created_at', 'DESC');
        if($searchstring) $query->search($searchstring);
        if($payment_status) $query->filterByPaymentStatus($payment_status);
        $invoices['overview'] = $query->sum('amount');
        return response()->json(['invoices'=>$invoices]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
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
        $invoice = $query->find($id);

        return response()->json(['invoice'=>$invoice]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function download($id)
    {
        $invoice = \App\Models\Invoice::find($id);
        if($invoice) $invoice->generatePdf();
    }
}
