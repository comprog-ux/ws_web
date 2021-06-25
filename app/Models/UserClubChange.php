<?php

namespace App\Models;

use App\Mail\ClubChangeApproved;
use App\Models\Signup;
use App\Models\User;
use App\Models\UserClubChange;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Mail;

class UserClubChange extends Model
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'users_clubs_changes';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'users_id',
        'from_clubs_id',
        'to_clubs_id',
        'created_by',
        'status',
    ];

    public function User()
    {
        return $this->belongsTo('\App\Models\User', 'users_id', 'id');
    }

    public function Creator()
    {
        return $this->belongsTo('\App\Models\User', 'created_by', 'id');
    }

    public function FromClub()
    {
        return $this->belongsTo('\App\Models\Club', 'from_clubs_id', 'id');
    }

    public function ToClub()
    {
        return $this->belongsTo('\App\Models\Club', 'to_clubs_id', 'id');
    }

    public function approve()
    {
        $user = $this->User;
        $user->Clubs()->sync([$this->to_clubs_id]);

        $this->update(['status' => 'approved']);

        Signup::where('users_id', $user->id)->where('created_at', '>=', $this->created_at)->update([
            'clubs_id' => $this->to_clubs_id,
        ]);

        // Remove any duplicate requests.
        UserClubChange::where('users_id', $user->id)
            ->where('to_clubs_id', $this->to_clubs_id)
            ->where('status', 'pending')
            ->delete();

        Mail::send(new ClubChangeApproved($this));

        return $this;
    }

    public function cancel()
    {
        $this->update(['status' => 'canceled']);

        // Remove any duplicate requests.
        UserClubChange::where('users_id', $this->users_id)
            ->where('to_clubs_id', $this->to_clubs_id)
            ->where('status', 'pending')
            ->delete();

        return $this;
    }

}
