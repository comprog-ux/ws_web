<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserInvite extends Model
{
    use SoftDeletes;

    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'users_invites';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
    	'name',
		'lastname',
    	'email', 
    	'users_id',
        'message',
		'registered_at'
    ];

	protected $appends = [
		'invite_token'
	];
        
    public function getInviteTokenAttribute()
	{
		$optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
		return $optimus->encode($this->id);
	}

	public function user()
    {
		return $this->belongsTo('\App\Models\User', 'users_id', 'id');
    }

    /**
     * Send an activation email to the registered user.
     *
     * @param  object  $user
     * @return boolean
     */
    public static function sendInviteEmail($invite)
    {
    	if(!$invite->email) return false;
    	$invite->load('user');
    	\Mail::send(['html' => 'emails.userInvite'], ['invite' => $invite], function($message) use ($invite)
		{
			$message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
		    $message->to($invite->email);
		    $message->subject(_('Du har fått en inbjudan till Webshooter'));
		});
    }
	
}
