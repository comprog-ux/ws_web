<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Championship extends Model
{
    use SoftDeletes;
    protected $table = 'championships';

    protected $appends = [
        'competitions_count',
        'signups_count'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function getCompetitionsCountAttribute()
    {
        if($this->relationLoaded('Competitions')):
            $related = $this->getRelation('Competitions');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Competition', 'championships_id', 'id')->count();
        endif;
    }
    public function getSignupsCountAttribute()
    {
        if($this->relationLoaded('Signups')):
            $related = $this->getRelation('Signups');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasManyThrough('App\Models\Signup', 'App\Models\Competition','championships_id','competitions_id')->count();
        endif;
    }

    public function Competitions()
    {
        return $this->hasMany('App\Models\Competition', 'championships_id', 'id');
    }

    public function Signups()
    {
        return $this->hasManyThrough('App\Models\Signup', 'App\Models\Competition','championships_id','competitions_id');
    }

    public function scopeSearch($query, $args)
    {
        $args = str_getcsv($args,' ','"');
        $query->where(function($query) use ($args) {
            foreach ($args as $arg):
                if ($arg = trim($arg)):
                    $query->where('name', 'LIKE', '%' . $arg . '%');
                endif;
            endforeach;
        });
        return $query;
    }


}
