<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatrolDistinguish extends Model
{
    use SoftDeletes;
    protected $table = 'patrols_distinguish';
    protected $fillable = [
        'patrol_size',
        'start_time',
        'end_time',
        'sortorder'
    ];

    protected $appends = [
        'start_time_human',
        'end_time_human'
    ];

    public function getStartTimeHumanAttribute()
    {
        return date('H:i', strtotime($this->start_time));
    }
    public function getEndTimeHumanAttribute()
    {
        return date('H:i', strtotime($this->end_time));
    }

    public function Signups(){
        return $this->hasMany('App\Models\Signup', 'patrols_distinguish_id', 'id');
    }
    
}
