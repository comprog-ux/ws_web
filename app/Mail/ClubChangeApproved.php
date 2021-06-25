<?php

namespace App\Mail;

use App\Models\User;
use App\Models\UserClubChange;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ClubChangeApproved extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $clubChange;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(UserClubChange $clubChange)
    {
        $clubChange->load(['User', 'ToClub']);

        $this->clubChange = $clubChange;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->to($this->clubChange->User)
            ->subject(_('Föreningsbyte godkänt'))
            ->view('emails.clubChangeApproved');
    }
}
