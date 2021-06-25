<?php

namespace App\Models;
use App\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'lastname',
        'email',
        'no_email_address',
        'mobile',
        'phone',
        'address_street',
        'address_street_2',
        'address_zipcode',
        'address_city',
        'address_country',
        'gender',
        'birthday',
        'shooting_card_number',
        'no_shooting_card_number',
        'is_admin',
        'password',
        'active',
        'activation_code',
        'language',
        'grade_trackshooting',
        'grade_field'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'activation_code',
        'created_at',
        'updated_at',
        'deleted_at',
        'active',
        'id',
        'is_admin',
        'email',
        'no_email_address',
        'phone',
        'mobile',
        'address_city',
        'address_combined',
        'address_country',
        'address_street',
        'address_street_2',
        'address_zipcode',
        'birthday',
        'gender',
        'language',
        'no_shooting_card_number',
        'pivot'
    ];
    
    protected $appends = [
        'address_combined',
        'user_id',
        'fullname',
        'clubs_id',
        'status'
    ];

    protected $casts = [
        'active' => 'integer',
        'grade_trackshooting' => 'string',
        'grade_field' => 'string'
    ];

    public function getClubsIdAttribute()
    {
        if(!$this->relationLoaded('Clubs')):
            $this->load('Clubs');
        endif;

        return (count($this->Clubs->first())) ? $this->Clubs->first()->id : null;
    }

    public function getUserIdAttribute()
    {
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        return $optimus->encode($this->id);
    }

    public function getRouteKey()
    {
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));

        return $optimus->encode($this->getKey());
    }

    public function getFullnameAttribute(){
        $return = '';
        $return .= ($this->name) ? $this->name : '';
        $return .= ($this->name && $this->lastname) ? ' ' : '';
        $return .= ($this->lastname) ? $this->lastname : '';
        return $return;
    }

    public function getBirthdayAttribute($value)
    {
        if($value && $value != '0000-00-00'){
            return (int)date('Y', strtotime($value));
        }
    }

    public function getAddressCombinedAttribute()
    {
        $address = null;
        $address .= $this->address_street."\n";
        $address .= $this->address_street_2."\n";
        $address .= $this->address_zipcode." ";
        $address .= $this->address_city."\n";
        $address .= $this->address_country;
        return $address;
    }

    public function getStatusAttribute()
    {
        if($this->deleted_at):
            return 'deleted';
        elseif(!$this->active && $this->no_email_address):
            return 'noaccount';
        elseif(!$this->active && !$this->no_email_address):
            return 'inactive';
        elseif($this->active ):
            return 'active';
        endif;
        return null;
    }

    public function Clubs(){
        return $this->belongsToMany('App\Models\Club','users_clubs', 'users_id', 'clubs_id')->withTimestamps()->whereNull('users_clubs.deleted_at')->orderBy('updated_at', 'desc');
    }

    public function ClubsAdmin(){
        return $this->belongsToMany('App\Models\Club', 'clubs_admins', 'users_id', 'clubs_id')->wherePivot('role', 'admin');
    }

    public function DistrictsAdmin(){
        return $this->belongsToMany('App\Models\District', 'districts_admins', 'users_id', 'districts_id')->wherePivot('role', 'admin');
    }

    public function InvoicesIncoming()
    {
        return $this->hasMany('App\Models\Invoice', 'recipient_id', 'id')->where('recipient_type', 'App\Models\User');
    }

    public function InvoicesOutgoing()
    {
        return $this->hasMany('App\Models\Invoice', 'sender_id', 'id')->where('sender_type', 'App\Models\User');
    }

    public function Signups()
    {
        return $this->hasMany('App\Models\Signup', 'users_id', 'id');
    }

    public function Notifications()
    {
        return $this->hasMany('App\Models\Notification', 'users_id', 'id');
    }

    public static function sendAdminNotification($user)
    {
        if(!$user->email || !$user->active) return false;
        \Mail::send(['html' => 'emails.adminNewUserNotification'], ['user' => $user], function($message) use ($user)
        {
            $message->to(env('MAIL_USERNAME'));
            $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
            $message->replyTo($user->email, $user->fullname);
            $message->subject(_('Ny aktiv användare!'));
        });
    }

    public function scopeFilterByStatus($query, $args)
    {
        if ($args = trim($args)):
            $query->where(function($query) use ($args){
                switch ($args):
                    case 'deleted':
                        $query->whereNotNull('deleted_at');
                        break;
                    case 'noaccount':
                        $query->where('active', 0);
                        $query->whereNotNull('no_email_address');
                        $query->whereNull('deleted_at');
                        break;
                    case 'inactive':
                        $query->where('active', 0);
                        $query->whereNull('no_email_address');
                        break;
                    case 'active':
                        $query->where('active', 1);
                        break;
                endswitch;
            });
        endif;
    }

    public function scopeSearch($query, $args)
    {
        $args = str_getcsv($args,' ','"');
        $query->where(function($query) use ($args) {
            foreach ($args as $arg):
                if ($arg = trim($arg)):
                    $query->where('id', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('name', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('lastname', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('email', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('shooting_card_number', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('address_country', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('address_city', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('address_zipcode', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('address_street_2', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('address_street', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('phone', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('mobile', 'LIKE', '%'.$arg.'%');
                    $query->orWhereHas('Clubs', function($query) use ($arg){
                        $query->where('name', 'LIKE', '%'.$arg.'%');
                    });
                endif;
            endforeach;
        });
        return $query;
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPassword($token));
    }

    public function getClubsInAdministratedDistricts($requireClub = null){
        $this->load('DistrictsAdmin.Clubs');
        
        $availableClubs = $this->DistrictsAdmin->flatMap(function($district){
            return $district->Clubs;
        });
        if($requireClub){
            $availableClubs->push($requireClub);    
        }
        $availableClubs = $availableClubs->unique('id');

        return $availableClubs;
    }
}
