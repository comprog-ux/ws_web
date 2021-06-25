<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sponsor extends Model
{
    use SoftDeletes;
    protected $table = 'sponsors';

    public function Competitions()
    {
        return $this->belongsTo('App\Models\Competition','competitions_id', 'id');
    }
}
