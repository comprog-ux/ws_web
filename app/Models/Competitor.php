<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Competitor extends Model
{
    use SoftDeletes;
    protected $table = 'competitors';

    protected $hidden = [
       'users_id'
    ];

    protected $appends = [
        'user_id'
    ];

    public function getUserIdAttribute()
    {
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        return $optimus->encode($this->users_id);
    }

    public function User(){
        return $this->belongsTo('App\Models\User', 'users_id', 'id');
    }

    public function Club(){
        return $this->belongsTo('App\Models\Club', 'clubs_id', 'id');
    }

    public function Patrol(){
        return $this->belongsTo('App\Models\Patrol', 'id', 'patrols_id');
    }

    public function Weaponclass(){
        return $this->belongsTo('App\Models\Weaponclass', 'weaponclasses_id', 'id');
    }
}
