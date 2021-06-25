<?php

namespace App\Jobs;

use App\Models\Competition;
use App\Models\Signup;
use App\Jobs\Job;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSignupApprovalEmail extends Job implements ShouldQueue
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
        if($signup->requires_approval && !$signup->is_approved_by):
            $competition = Competition::with([
                'CompetitionAdmins'=>function($query){
                    $query->whereIn('role', ['admin', 'signups']);
                    $query->groupBy('users_id');
                },
                'CompetitionAdmins.User',
                'Championship'
            ])->find($signup->competitions_id);

            $content = 'Du har en ny efteranmälan att godkänna.
            
Tävling: '.$competition->name.'
Tävlingsdatum: '.$competition->date.'
Användare: '.$signup->user->fullname.'
Förening: '.$signup->club->name.'
Vapengrupp: '.$signup->weaponclass->classname;

            $link = env('APP_URL').'/app/competitions/'.$competition->id.'/admin/signups?status=approval';

            foreach($competition->CompetitionAdmins as $admin):
                $notification = new \App\Models\Notification([
                    'users_id' => $admin->user->id,
                    'type' => 'signups_approval',
                    'content' => $content,
                    'link' => $link
                ]);
                $notification->save();

                $mailer->send(['html' => 'emails.notification-html', 'text' => 'emails.notification-text'], ['user' => $admin->user,'notification'=>$notification], function($message) use ($admin)
                {
                    $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
                    $message->to($admin->user->email);
                    $message->subject(_('Efteranmälan'));
                });
            endforeach;

        endif;
    }
}
