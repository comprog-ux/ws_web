<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UserPendingInvoiceNotificationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'emails:notification';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle(\App\Repositories\InvoiceRepository $invoice)
    {
        $users = $invoice->getUsersToNotifyAboutPendingInvoice();

        $users->load('ClubsAdmin');

        $users->each(function($user, $key){
            if($user->ClubsAdmin->count()):
                $content = _('Du eller din förening har möjlighet att generera en eller flera fakturor för aktuella anmälningar.');
                $link = url('invoices/generate');
            else:
                $content = _('Du har möjlighet att generera en eller flera fakturor för aktuella anmälningar.');
                $link = url('invoices');
            endif;
            if($user->email):
                $notification = new \App\Models\Notification([
                    'users_id' => $user->id,
                    'type' => 'pending_invoice',
                    'content' => $content,
                    'link' => $link
                ]);
                $notification->save();
                dispatch(new \App\Jobs\UserNotification($user, $notification));
                $this->line(\Carbon\Carbon::now().': Notificated '.$user->fullname.' ('.$user->email.') about pending invoice.');
            endif;
        });
    }
}
