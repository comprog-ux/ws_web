<?php

namespace App\Jobs;

use App\Jobs\Job;
use \App\Models\User;
use \App\Models\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Mail\Mailer;

class UserNotification extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;
    protected $user;
    protected $notification;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(User $user, Notification $notification)
    {
        $this->user = $user;
        $this->notification = $notification;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(Mailer $mailer)
    {
        $user = $this->user;

        $mailer->send(['html' => 'emails.notification-html', 'text' => 'emails.notification-text'], ['user' => $user,'notification'=>$this->notification], function($message) use ($user)
        {
            $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
            $message->to($user->email, $user->fullname);
            $message->subject(_('Meddelande från %s', env('APP_NAME')));
        });
    }
}
