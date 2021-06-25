<?php

namespace App\Jobs;

use App\Models\Competition;
use App\Models\Signup;
use App\Jobs\Job;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSignupApprovalConfimationEmail extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    protected $signup;
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(Signup $signup)
    {
        $this->signup = $signup;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(Mailer $mailer)
    {
        $signup = $this->signup;
        $signup->load(['User','Club', 'Weaponclass']);
        if($signup->requires_approval != 0 && $signup->is_approved_by != 0):
            $competition = Competition::with([
                'Championship'
            ])->find($signup->competitions_id);

            $content = 'Nedanstående efteranmälan har godkänts av en administratör följande tävling.
            
Tävling: '.$competition->name.'
Tävlingsdatum: '.$competition->date.'
Användare: '.$signup->user->fullname.'
Förening: '.$signup->club->name.'
Vapengrupp: '.$signup->weaponclass->classname;

            $link = env('APP_URL').'/app/signup/'.$signup->id;

            if($signup->user):
                $notification = new \App\Models\Notification([
                    'users_id' => $signup->user->id,
                    'type' => 'signups_approval',
                    'content' => $content,
                    'link' => $link
                ]);
                $notification->save();

                $mailer->send(['html' => 'emails.notification-html', 'text' => 'emails.notification-text'], ['user' => $signup->user,'notification'=>$notification], function($message) use ($signup)
                {
                    $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
                    $message->to($signup->user->email);
                    $message->subject(_('Efteranmälan har godkänts'));
                });
            endif;

        endif;
    }
}
