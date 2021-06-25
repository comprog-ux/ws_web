<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Weaponclass extends Model
{
    use SoftDeletes;
    protected $table = 'weaponclasses';

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $appends = [
        'classname_general'
    ];

    public function getClassnameGeneralAttribute()
    {
        if($this->weapongroups_id < 8):
            return preg_replace("/[!^0-9]/","",$this->classname);
        else:
            return $this->classname;
        endif;
    }

    public function Weapongroup()
    {
        return $this->belongsTo('\App\Models\Weapongroup', 'weapongroups_id', 'id');
    }
}
