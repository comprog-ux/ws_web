<?php

namespace App\Mail;

use App\Models\User;
use App\Models\UserClubChange;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ClubChangeInitiated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $clubChange;
    protected $recipients;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(UserClubChange $clubChange)
    {
        $clubChange->load(['User', 'ToClub.Admins']);

        $this->recipients = $clubChange->ToClub->Admins->where('email', '!=', '');

        if ($this->recipients->count() === 0) {
            $this->recipients = User::where('is_admin', 1)->where('email', '!=', '')->get();
        }

        $this->clubChange = $clubChange;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->to($this->recipients)
            ->subject(_('En användare har begärt föreningsbyte'))
            ->view('emails.clubChangeInitiated');
    }
}
