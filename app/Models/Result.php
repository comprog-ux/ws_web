<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Result extends Model
{
    use SoftDeletes;
    protected $table = 'results';

    protected $fillable = [
        'stations_id',
        'figure_hits',
        'hits',
        'points',
        'station_figure_hits'
    ];

    protected $casts = [
        'station_figure_hits' => 'array',
    ];

    public function Signup()
    {
        return $this->belongsTo('App\Models\Signup', 'signups_id', 'id');
    }
}
