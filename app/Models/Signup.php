<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Signup extends Model
{
    use SoftDeletes;
    protected $table = 'competitions_signups';

    protected $fillable = [
        'competitions_id',
        'weaponclasses_id',
        'lane',
        'lane_distinguish',
        'lane_finals',
        'registration_fee',
        'users_id',
        'created_by',
        'clubs_id',
        'start_before',
        'start_after',
        'first_last_patrol',
        'share_weapon_with',
        'participate_out_of_competition',
        'exclude_from_standardmedal',
        'share_patrol_with',
        'shoot_not_simultaneously_with',
        'note'
    ];

    protected $hidden = [
        'users_id',
        'updated_at',
        'deleted_at'
    ];

    protected $appends = [
        'special_wishes',
        'first_last_patrol_human',
        'start_time_human',
        'end_time_human'
    ];

    protected $casts = [
        'weaponclasses_id' => 'integer',
    ];

    public function getStartTimeHumanAttribute()
    {
        return date('H:i', strtotime($this->start_time));
    }
    public function getEndTimeHumanAttribute()
    {
        return date('H:i', strtotime($this->end_time));
    }

    public function getSpecialWishesAttribute()
    {
        $specialWish = '';
        $specialWish .= ($this->start_before && $this->start_before != '00:00:00') ? _('Start gärna före').': '.$this->start_before ."<br>" : '';
        $specialWish .= ($this->start_after && $this->start_after != '00:00:00') ? _('Start gärna efter').': '.$this->start_after ."<br>": '';
        $specialWish .= ($this->first_last_patrol == 'first') ? _('Första patrullen') ."<br>": '';
        $specialWish .= ($this->first_last_patrol == 'last') ? _('Sista patrullen') ."<br>": '';
        $specialWish .= ($this->share_weapon_with) ? _('Delar vapen med').': '.$this->share_weapon_with."<br>": '';
        $specialWish .= ($this->share_patrol_with) ? _('Gärna samma patrull som').': '.$this->share_patrol_with."<br>": '';
        $specialWish .= ($this->shoot_not_simultaneously_with) ? _('Skjuter ej samtidigt som').': '.$this->shoot_not_simultaneously_with."<br>": '';
        $specialWish .= ($this->participate_out_of_competition) ? _('Deltar utom tävlan')."<br>": '';
        $specialWish .= ($this->exclude_from_standardmedal) ? _('Exluderas från standardmedalj')."<br>": '';
        return $specialWish;
    }

    public function getFirstLastPatrolHumanAttribute()
    {
        if($this->first_last_patrol):
            return ($this->first_last_patrol == 'first') ? _('Första patrull') : _('Sista patrull');
        else:
            return '-';
        endif;
    }

    public function User(){
        return $this->hasOne('App\Models\User', 'id', 'users_id')->withTrashed();
    }

    public function Competition(){
        return $this->belongsTo('App\Models\Competition', 'competitions_id', 'id');
    }

    public function Weaponclass(){
        return $this->belongsTo('App\Models\Weaponclass', 'weaponclasses_id', 'id');
    }

    public function Club(){
        return $this->belongsTo('App\Models\Club', 'clubs_id', 'id');
    }

    public function Patrol(){
        return $this->belongsTo('App\Models\Patrol', 'patrols_id', 'id');
    }
    public function PatrolDistinguish(){
        return $this->belongsTo('App\Models\PatrolDistinguish', 'patrols_distinguish_id', 'id');
    }
    public function PatrolFinals(){
        return $this->belongsTo('App\Models\PatrolFinals', 'patrols_finals_id', 'id');
    }
    public function Team(){
        return $this->belongsToMany('App\Models\Team','teams_signups', 'signups_id', 'teams_id');
    }

    public function TeamSignup(){
        return $this->hasMany('App\Models\TeamSignup', 'signups_id', 'id');
    }

    public function Invoice(){
        return $this->belongsTo('App\Models\Invoice', 'invoices_id', 'id');
    }

    public function CollidingSignups()
    {
        return $this->hasMany('App\Models\Signup', 'users_id', 'users_id')
            ->where('id', '!=', $this->id);
    }
    public function PossibleFinals()
    {
        return $this->hasMany('App\Models\Signup', 'users_id', 'users_id')
            ->where('id', '!=', $this->id);
    }

    public function Results()
    {
        return $this->hasMany('App\Models\Result', 'signups_id', 'id');
    }

    public function ResultsPlacements()
    {
        return $this->hasOne('App\Models\ResultPlacement', 'signups_id', 'id');
    }

    public function scopeFilterByInvoiceStatus($query, $args)
    {
        if ($args = trim($args)):
            $query->where(function($query) use ($args){
                switch ($args):
                    case 'open':
                        $query->whereNull('invoices_id');
                        break;
                    case 'unpaid':
                        $query->whereHas('Invoice', function($query){
                            $query->whereNull('paid_at');
                        });
                        break;
                    case 'paid':
                        $query->whereHas('Invoice', function($query){
                            $query->whereNotNull('paid_at');
                        });
                        break;
                endswitch;
            });
        endif;
    }

    public function scopeFilterByApprovalStatus($query, $args)
    {
        if ($args = trim($args)):
            $query->where(function($query) use ($args){
                switch ($args):
                    case 'approved':
                        $query->where(function($query){
                            $query->where('requires_approval', '!=', 0);
                            $query->where('is_approved_by', '!=', 0);
                        });
                        break;
                    case 'approval':
                        $query->where(function($query){
                            $query->where('requires_approval', '!=', 0);
                            $query->where('is_approved_by', 0);
                        });
                        break;
                endswitch;
            });
        endif;
    }

    public function scopeFilterByStatus($query, $args)
    {
        if ($args = trim($args)):
            switch ($args):
                case 'future':
                    $query->where(function($query) use ($args){
                        $query->whereHas('competition', function($query) use ($args) {
                            $query->where('date','>=', date('Y-m-d'));
                        });
                    });
                    break;
                case 'latest':
                    $query->orderBy('updated_at', 'desc');
                    break;
                case 'completed':
                    $query->where(function($query) use ($args){
                        $query->whereHas('competition', function($query) use ($args) {
                            $query->where('date','<=', date('Y-m-d'));
                        });
                    });
                    $query->orderBy('updated_at', 'desc');
                    break;
            endswitch;
        endif;
    }

    public function scopeSearch($query, $args)
    {
        $args = str_getcsv($args,' ','"');
        $query->leftJoin('users','users.id', '=', 'competitions_signups.users_id');
        $query->leftJoin('invoices','invoices.id', '=', 'competitions_signups.invoices_id');
        $query->leftJoin('clubs','clubs.id', '=', 'competitions_signups.clubs_id');
        $query->where(function($query) use ($args) {
            foreach ($args as $arg):
                if ($arg = trim($arg)):
                    $query->where('note', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('users.name', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('users.lastname', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('users.email', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('users.shooting_card_number', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('invoices.invoice_reference', 'LIKE', '%'.$arg.'%');
                    $query->orWhere('clubs.name', 'LIKE', '%'.$arg.'%');
                endif;
            endforeach;
        });
        return $query;
    }

}