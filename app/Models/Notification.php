<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use SoftDeletes;
    protected $table = 'notifications';

    protected $fillable = [
        'users_id',
        'content',
        'type',
        'link'
    ];

    public function User()
    {
        return $this->belongsTo('App\Models\User', 'users_id', 'id');
    }
}
