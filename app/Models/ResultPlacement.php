<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResultPlacement extends Model
{
    use SoftDeletes;
    protected $table = 'results_placements';

    protected $fillable = [
        'competitions_id',
        'placement',
        'stations_id',
        'figure_hits',
        'hits',
        'points',
        'weaponclasses_id',
        'std_medal'
    ];

    protected $hidden = [
        'created_at',
        'deleted_at',
        'updated_at'
    ];

    public function Signup()
    {
        return $this->belongsTo('App\Models\Signup', 'signups_id', 'id');
    }

    public function Weaponclass()
    {
        return $this->belongsTo('App\Models\Weaponclass', 'weaponclasses_id', 'id');
    }

    public function Results()
    {
        return $this->hasMany('App\Models\Result', 'signups_id', 'signups_id')
            ->where('distinguish', 0)
            ->where('finals', 0)
            ->orderBy('stations_id');
    }

    public function ResultsFinals()
    {
        return $this->hasMany('App\Models\Result', 'signups_id', 'signups_id')
            ->where('distinguish', 0)
            ->where('finals', 1)
            ->orderBy('stations_id');
    }
    public function ResultsDistinguish()
    {
        return $this->hasMany('App\Models\Result', 'signups_id', 'signups_id')
            ->where('distinguish', 1)
            ->where('finals', 0)
            ->orderBy('stations_id');
    }

}
