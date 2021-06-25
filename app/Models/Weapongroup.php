<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Weapongroup extends Model
{
    use SoftDeletes;

    protected $table = 'weapongroups';

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function Weaponclasses()
    {
        return $this->hasMany('\App\Models\Weaponclass', 'weapongroups_id', 'id');
    }

}
