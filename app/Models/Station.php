<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Station extends Model
{
    use SoftDeletes;
    protected $table = 'stations';

    protected $fillable = [
        'station_nr',
        'sortorder',
        'tracks_id',
        'figures',
        'shots',
        'points',
        'distinguish'
    ];

    public function Competition(){
        return $this->belongsTo(\App\Models\Competition);
    }
}
