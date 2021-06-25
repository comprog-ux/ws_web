<?php

namespace App\Jobs;

use \App\Models\User;
use App\Jobs\Job;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendActivationEmail extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    protected $user;
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(Mailer $mailer)
    {
        $user = $this->user;

        $mailer->send(['html' => 'emails.userActivation', 'text' => 'emails.text-userActivation'], ['user' => $user], function($message) use ($user)
        {
            $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
            $message->to($user->email);
            $message->subject(_('Vänligen aktivera ditt konto'));
        });
    }
}
