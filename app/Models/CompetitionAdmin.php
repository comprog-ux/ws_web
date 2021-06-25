<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetitionAdmin extends Model
{
    protected $table = 'competitions_admins';

    protected $fillable = [
        'role',
        'users_id',
        'competitions_id'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'users_id'
    ];

    protected $appends = [
        'role_human'
    ];

    public function User()
    {
        return $this->belongsTo('App\Models\User', 'users_id', 'id');
    }

    public function getRoleHumanAttribute()
    {
        $return = '';
        switch ($this->role):
            case 'admin':
                $return = _('Admin (Full behörighet)');
                break;
            case 'stations':
                $return = _('Stations och skjutplatser');
                break;
            case 'signups':
                $return = _('Anmälningar');
                break;
            case 'patrols':
                $return = _('Patruller och Skjutlag');
                break;
            case 'results':
                $return = _('Resultat');
                break;
        endswitch;
        return $return;

    }

    public static function getRoles()
    {
        $roles = [];
        $roles[] = ['id'=>'admin', 'role'=>_('Admin (Full behörighet)')];
        $roles[] = ['id'=>'stations', 'role'=>_('Stations och skjutplatser')];
        $roles[] = ['id'=>'signups', 'role'=>_('Anmälningar')];
        $roles[] = ['id'=>'patrols', 'role'=>_('Patruller och Skjutlag')];
        $roles[] = ['id'=>'results', 'role'=>_('Resultat')];
        return $roles;
    }

}
