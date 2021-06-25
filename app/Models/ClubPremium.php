<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubPremium extends Model
{
    use SoftDeletes;
    protected $table = 'clubs_premium';

    protected $fillable = [
        'users_id',
        'clubs_id'
    ];

    protected $hidden = [
        'id',
        'updated_at',
        'deleted_at',
        'users_id',
        'clubs_id'
    ];


}
