<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeamSignup extends Model
{
    use SoftDeletes;
    protected $table = 'teams_signups';

}
