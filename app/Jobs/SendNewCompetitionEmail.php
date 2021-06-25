<?php

namespace App\Jobs;

use App\Jobs\Job;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendNewCompetitionEmail extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    protected $competition;
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(Competition $competition)
    {
        $this->competition = $competition;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(Mailer $mailer)
    {
        $competition = $this->competition;
        $competition->load('Club', 'User');

        $content = $competition->User->fullname.' har skapat följande tävling: 
            
Tävling: '.$competition->name.'
Tävlingsdatum: '.$competition->date.'
Förening: '.$competition->club->name.'
Skapad av: '.$competition->user->fullname;

        $link = env('APP_URL').'/app/competitions/'.$competition->id;

        $administrators = User::where('is_admin', 1)->get();
        foreach($administrators as $administrator):

            $notification = new \App\Models\Notification([
                'users_id' => $administrator->id,
                'type' => 'competition_created',
                'content' => $content,
                'link' => $link
            ]);
            $notification->save();

            $mailer->send(['html' => 'emails.notification-html', 'text' => 'emails.notification-text'], ['user' => $administrator,'notification'=>$notification], function($message) use ($competition, $administrator)
            {
                $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
                $message->to($administrator->email);
                $message->subject(_('En tävling har skapats'));
            });

        endforeach;
    }
}
