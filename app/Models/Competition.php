<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Competition extends Model
{
    use SoftDeletes;
    protected $table = 'competitions';
    public $Sortable = ['contact_city'];

    protected $appends = [
        'signups_count',
        'patrols_count',
        'teams_count',
        'stations_count',
        'results_count',
        'status',
        'status_human',
        'start_time_human',
        'final_time_human',
        'allow_signups_after_closing_date_human',
        'translations',
        'results_type_human',
        'available_logos',
        'pdf_logo_path',
        'pdf_logo_url',
    ];

    protected $fillable = [
        'is_public',
        'patrols_is_public',
        'results_is_public',
        'results_type',
        'results_prices',
        'results_comment',
        'name',
        'championships_id',
        'organizer_id',
        'organizer_type',
        'invoices_recipient_id',
        'invoices_recipient_type',
        'allow_teams',
        'teams_registration_fee',
        'website',
        'contact_name',
        'contact_city',
        'contact_venue',
        'contact_email',
        'contact_telephone',
        'google_maps',
        'description',
        'competitiontypes_id',
        'max_competitors',
        'date',
        'signups_opening_date',
        'signups_closing_date',
        'approval_signups_after_closing_date',
        'price_signups_after_closing_date',
        'allow_signups_after_closing_date',
        'start_time',
        'final_time',
        'patrol_time',
        'patrol_time_rest',
        'patrol_time_interval',
        'patrol_size',
        'pdf_logo'
    ];

    protected $hidden = [
        'competitiontypes_id',
        'clubs_id',
        'created_at',
        'deleted_at',
        'max_competitors',
        'patrol_size',
        'patrol_time',
        'patrol_time_interval',
        'patrol_time_rest',
        'start_time',
        'stations_count',
        'results_count',
        'teams_count',
        'updated_at'
    ];

    public function getAvailableLogosAttribute()
    {
        $logos = ['webshooter'];

        if($this->relationLoaded('Club')){
            if($this->Club->logo){
                $logos[] = 'club';    
            }

            if($this->Club->relationLoaded('District')){
                if($this->Club->District && $this->Club->District->logo){
                    $logos[] = 'district';
                }
            }
            
        }
       
        return $logos;
    }



    public function getPdfLogoPathAttribute()
    {
        if($this->relationLoaded('Club')){
            if($this->pdf_logo === 'club' && $this->Club->logo){
                return $this->Club->logo_path;
            }

            if($this->pdf_logo === 'district' && $this->Club->relationLoaded('District') && $this->Club->District->logo){
                return $this->Club->District->logo_path;
            }
        }

        return public_path().'/img/webshooter-logo.png';
    }

    public function getPdfLogoUrlAttribute()
    {
        if($this->relationLoaded('Club')){
            if($this->pdf_logo === 'club' && $this->Club->logo){
                return $this->Club->logo_url;
            }

            if($this->pdf_logo === 'district' && $this->Club->relationLoaded('District') && $this->Club->District->logo){
                return $this->Club->District->logo_url;
            }
        }

        return '/img/webshooter-logo.png';
    }

    public function getTranslationsAttribute()
    {
        $translations = new \stdClass();

        if (in_array($this->competitiontypes_id, [1, 4, 5, 6, 8, 11, 12, 13, 14, 15])):
            $translations->patrols_name_singular = _('skjutlag');
            $translations->patrols_name_plural = _('skjutlag');
            $translations->patrols_list_singular = _('skjutlagslista');
            $translations->patrols_list_plural = _('skjutlagslistor');
            $translations->patrols_size = _('antal skjutplatser');
            $translations->patrols_lane_singular = _('skjutplats');
            $translations->patrols_lane_plural = _('skjutplatser');
            $translations->stations_name_singular = _('serie');
            $translations->stations_name_plural = _('serier');
        else:
            $translations->patrols_name_singular = _('patrull');
            $translations->patrols_name_plural = _('patruller');
            $translations->patrols_list_singular = _('patrullista');
            $translations->patrols_list_plural = _('patrullistor');
            $translations->patrols_size = _('Patrullstorlek');
            $translations->patrols_lane_singular = _('figur');
            $translations->patrols_lane_plural = _('figurer');
            $translations->stations_name_singular = _('station');
            $translations->stations_name_plural = _('stationer');
        endif;
        $translations->results_list_singular = _('resultatlista');
        $translations->results_list_plural = _('resultatlistor');
        $translations->shootingcard = _('skjutkort');
        $translations->shootingcards = _('skjutkort');
        $translations->signups = _('anmälningar');

        return $translations;
    }

    public function getStartTimeHumanAttribute()
    {
        return date('H:i', strtotime($this->start_time));
    }

    public function getFinalTimeHumanAttribute()
    {
        return date('H:i', strtotime($this->final_time));
    }

    public function getUserHasRoleAttribute()
    {
        return 'admin';
    }

    public function CompetitionAdmins(){
        return $this->hasMany('App\Models\CompetitionAdmin', 'competitions_id', 'id');
    }

    public function Club(){
        return $this->belongsTo('App\Models\Club', 'clubs_id', 'id');
    }

    public function invoices_recipient()
    {
        return $this->morphTo();
    }

    public function getInvoicesRecipientObjectAttribute()
    {
        switch($this->recipient_type):
            case 'App\Models\Club':
                return 'club';
                break;
            case 'App\Models\District':
                return 'district';
                break;
            default:
                return '';
                break;
        endswitch;
    }

    public function User(){
        return $this->belongsTo('App\Models\User', 'created_by', 'id');
    }

    public function UserRoles(){
        return $this->belongsToMany('App\Models\User', 'competitions_admins', 'competitions_id', 'users_id')
            ->withPivot('role')
            ->where('users_id', \Auth::id());
    }

    public function getStatusAttribute(){
        $status = 'open';

        $signupsCount = ($this->max_competitors) ? $this->Signups()->count() : 0;
        if($this->closed_at):
            $status = 'stangd'; 
        elseif($this->date < date('Y-m-d')):
            $status = 'completed';
        elseif((($this->max_competitors > 0 && $signupsCount >= $this->max_competitors) || $this->signups_closing_date < date('Y-m-d')) && !$this->allow_signups_after_closing_date):
            $status = 'closed';
        elseif($this->signups_opening_date > date('Y-m-d')):
            $status = 'not_opened';
        elseif(($this->max_competitors > 0 && $signupsCount >= $this->max_competitors) || ($this->signups_closing_date < date('Y-m-d') && $this->allow_signups_after_closing_date)):
            $status = 'after_signups_closing_date';
        endif;
        return $status;
    }

    public function getStatusHumanAttribute(){
        if($this->status == 'completed'):
            return _('Avslutad (genomförd)');
        elseif($this->status == 'stangd'):
            return _('Stängd');
        elseif($this->status == 'not_opened'):
            return _('Anmälan öppnar %s', $this->signups_opening_date);
        elseif($this->status == 'closed'):
            return _('Anmälan stängd');
        elseif($this->status == 'after_signups_closing_date'):
            return _('Efteranmälan');
        else:
            return _('Öppen för anmälan');
        endif;
    }

    public function getSignupsCountAttribute()
    {
        if($this->relationLoaded('Signups')):
            $related = $this->getRelation('Signups');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Signup', 'competitions_id', 'id')
                ->where(function($query){
                    $query->where('requires_approval', 0);
                    $query->orWhere('is_approved_by', '!=', 0);

                })
                ->count();
        endif;
    }

    public function getAllowSignupsAfterClosingDateHumanAttribute()
    {
        if(!$this->allow_signups_after_closing_date):
            return _('Tillåts ej');
        elseif($this->allow_signups_after_closing_date && $this->approval_signups_after_closing_date):
            return _('Behöver godkännas. %s kr avgift', $this->price_signups_after_closing_date);
        elseif($this->allow_signups_after_closing_date && !$this->approval_signups_after_closing_date):
            return _('Efteranmälan möjlig. %s kr avgift', $this->price_signups_after_closing_date);
        endif;
    }

    public function getPatrolsCountAttribute()
    {
        if($this->relationLoaded('Patrols')):
            $related = $this->getRelation('Patrols');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Patrol', 'competitions_id', 'id')->count();
        endif;
    }

    public function getStationsCountAttribute()
    {
        if($this->relationLoaded('Stations')):
            $related = $this->getRelation('Stations');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Station', 'competitions_id', 'id')->count();
        endif;
    }

    public function getResultsCountAttribute()
    {
        if($this->relationLoaded('ResultPlacements')):
            $related = $this->getRelation('ResultPlacements');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\ResultPlacement', 'competitions_id', 'id')->count();
        endif;
    }

    public function getTeamsCountAttribute()
    {
        if($this->relationLoaded('Teams')):
            $related = $this->getRelation('Teams');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Team', 'competitions_id', 'id')->count();
        endif;
    }

    public function getResultsTypeHumanAttribute()
    {
        switch($this->results_type):
            case 'military':
                return _('Militär snabbmatch');
                break;
            case 'precision':
                return _('Precision');
                break;
            case 'field':
                return _('Fält');
                break;
            case 'pointfield':
                return _('Poängfält');
                break;
            case 'magnum':
                return _('Magnumfält');
                break;
        endswitch;
    }

    public function Championship(){
        return $this->belongsTo('App\Models\Championship', 'championships_id', 'id');
    }
    public function Competitiontype(){
        return $this->belongsTo('App\Models\Competitiontype', 'competitiontypes_id', 'id');
    }
    public function Weaponclasses(){
        return $this->belongsToMany('App\Models\Weaponclass', 'competitions_weaponclasses', 'competitions_id', 'weaponclasses_id')->withPivot('registration_fee');
    }
    public function Competitors(){
        return $this->hasMany('App\Models\Competitor', 'competitions_id', 'id');
    }

    public function Stations(){
        return $this->hasMany('App\Models\Station', 'competitions_id', 'id')->orderBy('distinguish')->orderBy('sortorder');
    }

    public function Patrols(){
        return $this->hasMany('App\Models\Patrol', 'competitions_id', 'id')->orderBy('start_time', 'asc');
    }

    public function PatrolsFinals(){
        return $this->hasMany('App\Models\PatrolFinals', 'competitions_id', 'id')->orderBy('start_time', 'asc');
    }

    public function PatrolsDistinguish(){
        return $this->hasMany('App\Models\PatrolDistinguish', 'competitions_id', 'id')->orderBy('start_time', 'asc');
    }

    public function Teams(){
        return $this->hasMany('App\Models\Team', 'competitions_id', 'id');
    }

    public function Users(){
        return $this->belongsToMany('App\Models\User', 'competitions_signups', 'competitions_id', 'users_id', 'id');
    }

    public function Signups(){
        return $this->hasMany('App\Models\Signup', 'competitions_id', 'id');
    }

    public function ResultPlacements(){
        return $this->hasMany('App\Models\ResultPlacement', 'competitions_id', 'id');
    }

    public function Usersignups(){
        return $this->hasMany('App\Models\Signup', 'competitions_id', 'id')->where('users_id', \Auth::user()->id);
    }

    public function Sponsors()
    {
        return $this->hasMany('App\Models\Sponsor','competitions_id', 'id');
    }

    public function scopeFilterByType($query, $args)
    {
        if ($args = trim($args)):
            $query->where('competitiontypes_id', $args);
        endif;
    }

    public function scopeFilterByHasUsersignup($query)
    {
        $query->whereHas('Usersignups', function(){});
    }

    public function scopeFilterByStatus($query, $args)
    {
        if ($args = trim($args)):
            $query->where(function($query) use ($args){
                switch ($args):
                    case 'completed':
                        $query->where('date', '<', date('Y-m-d'));
                        break;
                    case 'open':
                        $query->where(function($query){
                            $query->where(function($query){
                                $query->where('signups_opening_date', '<=', date('Y-m-d'));
                                $query->orWhere('signups_opening_date', '0000-00-00');
                            });
                            $query->where(function($query){
                                $query->where('signups_closing_date', '>=', date('Y-m-d'));
                                $query->orWhere('allow_signups_after_closing_date', '1');
                            });
                        });
                        $query->Where('date', '>=', date('Y-m-d'));
                        break;
                    case 'upcoming':
                        $query->where(function($query){
                            $query->where('signups_opening_date', '>', date('Y-m-d'));
                            $query->where('signups_closing_date', '>', date('Y-m-d'));
                        });
                        $query->where('date', '>=', date('Y-m-d'));
                        break;
                    case 'closed':
                        $query->where(function($query){
                            $query->where('signups_closing_date', '<', date('Y-m-d'));
                            $query->where('allow_signups_after_closing_date', '0');
                        });
                        $query->where('date', '>=', date('Y-m-d'));
                        break;
                endswitch;
            });
        endif;
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

    public static function updateResultCache($competitionId)
    {
        $competition = Competition::with([
            'ResultPlacements',
            'ResultPlacements.Signup',
            'ResultPlacements.Signup.User',
            'ResultPlacements.Signup.Club',
            'ResultPlacements.Weaponclass',
            'ResultPlacements.Results',
            'ResultPlacements.ResultsDistinguish',
            'ResultPlacements.ResultsFinals'
        ])->find($competitionId);
        $results = $competition->ResultPlacements;
        Storage::put('/competitions/'.$competitionId.'/results/webshooter-resultat-'.$competitionId.'.json', $results);

        return $results;
    }

}