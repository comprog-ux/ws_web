<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubAdmin extends Model
{
    use SoftDeletes;
    protected $table = 'clubs_admins';

    protected $fillable = [
        'role',
        'users_id',
        'clubs_id'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'users_id',
        'clubs_id'
    ];


}
