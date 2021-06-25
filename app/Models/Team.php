<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Team extends Model
{
    use SoftDeletes;
    protected $table = 'teams';

    protected $fillable = [
        'name',
        'clubs_id',
        'registration_fee',
        'competitions_id',
        'weapongroups_id',
        'created_by'
    ];

    public function Competition(){
        return $this->belongsTo('App\Models\Competition', 'competitions_id', 'id');
    }

    public function Competitors(){
        return $this->belongsToMany('App\Models\Competitor','teams_competitors', 'teams_id', 'competitors_id');
    }

    public function Signups(){
        return $this->belongsToMany('App\Models\Signup','teams_signups', 'teams_id', 'signups_id')->withPivot('position');
    }

    public function Club(){
        return $this->belongsTo('App\Models\Club', 'clubs_id', 'id');
    }

    public function Invoice(){
        return $this->belongsTo('App\Models\Invoice', 'invoices_id', 'id');
    }

    public function Weaponclass(){
        return $this->belongsTo('App\Models\Weaponclass', 'weaponclasses_id', 'id');
    }

    public function Weapongroup(){
        return $this->belongsTo('App\Models\Weapongroup', 'weapongroups_id', 'id');
    }

}
