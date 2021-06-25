<?php
namespace App\Repositories;

use App\Models\Club;
use App\Models\Competition;
use App\Models\District;
use Illuminate\Support\Facades\App;

class InvoiceRepository
{
    /**
     * Get all Signups and Teams which has not been invoiced.
     * Group all posts by club.
     * For each club collect the invoicable items as new collection.
     * Return a complete collection containing clubs and associated items.
     */
    public function getPendingClubSignups($clubId)
    {
        $query = \App\Models\Club::orderBy('name');
        $query->where(function($query) use ($clubId){
            $query->whereHas('Competitions', function($query) use ($clubId){
                $query->where(function($query) use ($clubId){
                    $query->whereHas('Signups', function($query) use ($clubId){
                        $query->where(function($query) use ($clubId) {
                            $query->whereNull('invoices_id');
                            $query->where('clubs_id', $clubId);
                        });
                    });
                    $query->orWhereHas('Teams', function($query) use ($clubId){
                        $query->where(function($query) use ($clubId) {
                            $query->whereNull('invoices_id');
                            $query->where('clubs_id', $clubId);
                        });
                    });
                });
            });
        });
        $invoiceClubs = $query->get();
        foreach($invoiceClubs as $invoiceClub):
            // Hook signups to this club.
            $query = \App\Models\Signup::with('User','Competition', 'Weaponclass');
            $query->orderBy('competitions_id', 'users_id');
            $query->where(function($query) use ($invoiceClub, $clubId){
                $query->whereNull('invoices_id');
                $query->where('clubs_id', $clubId);
                $query->whereHas('Competition', function($query) use ($invoiceClub){
                    $query->where('clubs_id', $invoiceClub->id);
                });
            });
            $signups = $query->get();
            $invoiceClub->signups = collect($signups);
            // Hook teams to this club
            $query = \App\Models\Team::with('Competition', 'Weapongroup');
            $query->orderBy('competitions_id', 'name');
            $query->where(function($query) use ($invoiceClub, $clubId){
                $query->whereNull('invoices_id');
                $query->where('clubs_id', $clubId);
                $query->whereHas('Competition', function($query) use ($invoiceClub){
                    $query->where('clubs_id', $invoiceClub->id);
                });
            });
            $teams = $query->get();
            $invoiceClub->teams = collect($teams);
        endforeach;
        return $invoiceClubs;
    }

    /**
     * Collect all the clubs which to generate a invoice to.
     * The club must have one or more competitions that has signups where invoices_id is null.
     * Or the club must have one or more competitions that has teams where invoices_id is null.
     */
    public function createInvoicesForClub($club, $signupIds = null, $teamIds = null)
    {
        /**
         * Instanciate $invoices as new collection.
         */
        $invoices = new \Illuminate\Database\Eloquent\Collection;

        $query = Competition::where(function($query) use ($club, $signupIds, $teamIds){
            $query->where(function($query) use ($club, $signupIds, $teamIds){
                $query->whereHas('Signups', function($query) use ($club, $signupIds){
                    $query->where(function($query) use ($club) {
                        $query->whereNull('invoices_id');
                        $query->where('clubs_id', $club->id);
                    });

                    if($signupIds){
                        $query->whereIn('competitions_signups.id', $signupIds);
                    }
                });
                $query->orWhereHas('Teams', function($query) use ($club){
                    $query->where(function($query) use ($club) {
                        $query->whereNull('invoices_id');
                        $query->where('clubs_id', $club->id);
                    });
                });
            });
        });
        $competitions = $query->get();

        $invoicesRecipientTypes = $competitions->groupBy('invoices_recipient_type');
        $invoicesRecipientTypes->each(function($invoiceRecipientType, $type) use($club, $invoices, $teamIds){
            $signupsGroupedBySender = $invoiceRecipientType->groupBy('invoices_recipient_id');
            $signupsGroupedBySender->each(function($signups, $index) use($club, $invoices, $type, $teamIds) {
                $signupsGroupedByCompetition = $signups->groupBy('competitions_id');
                $signupsGroupedByCompetition->each(function($item) use ($index, $club, $invoices, $type, $teamIds){
                    $sender = ($type == 'App\Models\District') ? District::find($index) : Club::find($index);

                    /**
                     * Collect the signups to attach to the invoice.
                     */
                    $query = \App\Models\Signup::with('User','Competition', 'Weaponclass');
                    $query->orderBy('competitions_id', 'users_id');
                    $query->where(function($query) use ($club, $sender, $type){
                        $query->whereNull('invoices_id');
                        $query->where('clubs_id', $club->id);
                        $query->whereHas('Competition', function($query) use ($sender, $type){
                            $query->where('invoices_recipient_type', $type);
                            $query->where('invoices_recipient_id', $sender->id);
                        });
                    });
                    $signups = $query->get();
                    if($signups):
                        
                        $invoice = new \App\Models\Invoice;
                        $invoice->created_by = \Auth::id();
                        $invoice->recipient_id = $club->id;
                        $invoice->recipient_type = 'App\Models\Club';
                        $invoice->recipient_name = $club->name;
                        $invoice->recipient_address_street = $club->address_street;
                        $invoice->recipient_address_street_2 = $club->address_street_2;
                        $invoice->recipient_address_zipcode = $club->address_zipcode;
                        $invoice->recipient_address_city = $club->address_city;

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

                        foreach($signups as $signup):
                            $sortorder++;
                            $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date > $signup->Competition->signups_closing_date) ?  $signup->Competition->signups_closing_date : $invoice->expiration_date;
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
                                'sortorder' => $sortorder
                            ]);
                            $invoice->Signups()->save($signup);
                        endforeach;
                    endif;

                    $amount = $invoice->InvoiceRows()->sum('row_sum_amount');
                    $invoice->amount = $amount;

                    /**
                     * Expiration date is set during the team and signups loop.
                     * But change this to current date if the compitions signups_closing_date is in the past.
                     */
                    $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date < date('Y-m-d')) ? date('Y-m-d') : $invoice->expiration_date;
                    $invoice->save();
                    $invoices->push($invoice);


                    /**
                     * Create a separate invoice for the teams instead of attaching 
                     * them to the same invoice.
                     */
                    if($teamIds){
                        $query = \App\Models\Team::with('Competition', 'Weapongroup');
                        $query->whereIn('teams.id', $teamIds);
                        
                        $query->orderBy('competitions_id', 'name');
                        $query->where(function($query) use ($club, $sender, $type){
                            $query->whereNull('invoices_id');
                            $query->where('clubs_id', $club->id);
                            $query->whereHas('Competition', function($query) use ($sender, $type){
                                $query->where('invoices_recipient_type', $type);
                                $query->where('invoices_recipient_id', $sender->id);
                            });
                        });
                        $teams = $query->get();
                    } else {
                        $teams = null;
                    }

                    if($teams):

                        // Create the invoice.
                        $invoice = new \App\Models\Invoice;
                        $invoice->created_by = \Auth::id();
                        $invoice->recipient_id = $club->id;
                        $invoice->recipient_type = 'App\Models\Club';
                        $invoice->recipient_name = $club->name;
                        $invoice->recipient_address_street = $club->address_street;
                        $invoice->recipient_address_street_2 = $club->address_street_2;
                        $invoice->recipient_address_zipcode = $club->address_zipcode;
                        $invoice->recipient_address_city = $club->address_city;

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

                        foreach($teams as $team):
                            $sortorder++;
                            $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date > $team->Competition->signups_closing_date) ?  $team->Competition->signups_closing_date : $invoice->expiration_date;
                            $invoice->InvoiceRows()->create([
                                'description' => _('Lag').': '.$team->name.' '.$team->Competition->name.' '.$team->Competition->date.' ('.$team->Weapongroup->name.')',
                                'quantity' => 1,
                                'unit' => _('st'),
                                'net_unit_amount' => $team->registration_fee,
                                'vat_percent' => 0,
                                'vat_amount' => 0,
                                'row_net_amount' => 1 * $team->registration_fee,
                                'row_vat_amount' => 0,
                                'row_sum_amount' => 1 * $team->registration_fee,
                                'sortorder' => $sortorder
                            ]);
                            $invoice->Teams()->save($team);
                        endforeach;

                        $amount = $invoice->InvoiceRows()->sum('row_sum_amount');
                        $invoice->amount = $amount;

                        /**
                         * Expiration date is set during the team and signups loop.
                         * But change this to current date if the compitions signups_closing_date is in the past.
                         */
                        $invoice->expiration_date = (!$invoice->expiration_date || $invoice->expiration_date < date('Y-m-d')) ? date('Y-m-d') : $invoice->expiration_date;

                        $invoice->save();

                        $invoices->push($invoice);
                    endif;

                });
            });
        });

        return $invoices;
    }

    public function findInvoiceForClub($club, $id)
    {
        $query = \App\Models\Invoice::with(
            'InvoiceRows',
            'Signups',
            'Signups.User',
            'Signups.Competition',
            'Signups.Weaponclass',
            'Teams',
            'Teams.Competition',
            'Teams.Weapongroup');
        $query->where(function($query) use ($club) {
            $query->where(function($query) use ($club) {
                $query->where('sender_type', 'App\Models\Club');
                $query->where('sender_id', $club->id);
            });
            $query->orWhere(function($query) use ($club) {
                $query->where('recipient_type', 'App\Models\Club');
                $query->where('recipient_id', $club->id);
            });
        });
        $invoice = $query->find($id);
        return $invoice;
    }

    /**
     * Get all users which fullfill the following:
     * Has not been notified during the last week.
     * Has signups which are not associated to any invoice.
     * The user is admin for one or multiple clubs which has signups or teams which are not associated to any invoices.
     */
    public function getUsersToNotifyAboutPendingInvoice()
    {
        $query = \App\Models\User::where(function($query){
            //Did not receive any notification during the last week.
            $query->whereDoesntHave('Notifications', function($query){
                $query->where('type', 'pending_invoice');
                $query->whereDate('created_at', '>', \Carbon\Carbon::now()->subWeek());
            });
            $query->where(function($query){
                //The user has signups which are not attached to any invoice
                $query->whereHas('Signups', function($query){
                    $query->whereHas('Competition', function($query){
                        $query->whereDate('signups_closing_date', '<', \Carbon\Carbon::now());
                    });
                    $query->whereNull('invoices_id');
                    $query->whereDate('created_at', '<', \Carbon\Carbon::now()->subDay());

                });
                //The user is admin for any clubs
                $query->orWhereHas('ClubsAdmin', function($query){
                    $query->where(function($query){
                        //Where the club has signups which are not associated to any invoice.
                        $query->whereHas('Signups', function($query){
                            $query->whereHas('Competition', function($query){
                                $query->whereDate('signups_closing_date', '<', \Carbon\Carbon::now());
                            });
                            $query->whereNull('invoices_id');
                            $query->whereDate('created_at', '<', \Carbon\Carbon::now()->subDay());
                        });
                        //Where the club has teams which are not associated to any invoice.
                        $query->orWhereHas('Teams', function($query){
                            $query->whereHas('Competition', function($query){
                                $query->whereDate('signups_closing_date', '<', \Carbon\Carbon::now());
                            });
                            $query->whereNull('invoices_id');
                            $query->whereDate('created_at', '<', \Carbon\Carbon::now()->subDay());
                        });
                    });
                });
            });
        });
        $users = $query->get();
        return $users;
    }
    
}