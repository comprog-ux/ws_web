<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Http\Request;
use \Storage;

class Club extends Model
{
    use SoftDeletes;
    protected $table = 'clubs';

    protected $fillable = [
        'districts_id',
        'disable_personal_invoices',
        'name',
        'clubs_nr',
        'phone',
        'email',
        'address_street',
        'address_street_2',
        'address_zipcode',
        'address_city',
        'address_country',
        'bankgiro',
        'postgiro',
        'swish',
        'logo'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'country',
        'users_count',
        'admins_count',
        'competitions_count',
        'signups_count',
        'pivot'
    ];

    protected $appends = [
        'users_count',
        'admins_count',
        'competitions_count',
        'signups_count',
        'user_has_role',
        'address_combined',
        'address_incomplete',
        'logo_url',
        'logo_path'
    ];

    public function getLogoUrlAttribute()
    {
        return ($this->logo) ? Storage::disk('local')->url('public/clubs/'.$this->id.'/'.$this->logo) : '';
    }

    public function getLogoPathAttribute()
    {
        return ($this->logo) ? storage_path('app/public/clubs/'.$this->id.'/'.$this->logo) : '';
    }

    public function getUserHasRoleAttribute()
    {
        $value = \DB::table('clubs_admins')
            ->select('role')
            ->where('clubs_id', $this->id)
            ->where('users_id', \Auth::id())
            ->value('role');

        return ($value) ? $value : null;
    }

    public function getAddressCombinedAttribute()
    {
        $address = null;
        $address .= ($this->address_street) ? $this->address_street."\n" : '';
        $address .= ($this->address_street_2) ? $this->address_street_2."\n" : '';
        $address .= ($this->address_zipcode) ? $this->address_zipcode." " : '';
        $address .= ($this->address_city) ? $this->address_city : '';
        $address .= ($this->address_zipcode || $this->address_city) ? "\n" : '';
        $address .= ($this->address_country) ? $this->address_country : '';
        return $address;
    }

    public function getAddressIncompleteAttribute()
    {
        return (!$this->address_street || !$this->address_zipcode || !$this->address_city);
    }

    public function Admins(){
        return $this->belongsToMany('App\Models\User', 'clubs_admins', 'clubs_id', 'users_id')->wherePivot('role', 'admin');
    }

    public function ClubPremium(){
        return $this->hasOne('App\Models\ClubPremium', 'clubs_id', 'id');
    }

    public function getUsersCountAttribute(){
        return $this->belongsToMany('App\Models\User','users_clubs', 'clubs_id', 'users_id')->withTimestamps()->count();
    }

    public function getAdminsCountAttribute(){
        return $this->belongsToMany('App\Models\User','clubs_admins', 'clubs_id', 'users_id')->withTimestamps()->count();
    }

    public function getCompetitionsCountAttribute(){
        return $this->hasMany('App\Models\Competition','clubs_id', 'id')->count();
    }

    public function getSignupsCountAttribute(){
        return $this->hasMany('App\Models\Signup','clubs_id', 'id')->count();
    }

    public function District(){
        return $this->belongsTo('App\Models\District','districts_id', 'id');
    }

    public function Users(){
        return $this->belongsToMany('App\Models\User','users_clubs', 'clubs_id', 'users_id')->withTimestamps();
    }

    public function Competitions(){
        return $this->hasMany('App\Models\Competition', 'clubs_id', 'id');
    }

    public function Signups(){
        return $this->hasMany('App\Models\Signup', 'clubs_id', 'id');
    }

    public function Teams(){
        return $this->hasMany('App\Models\Team', 'clubs_id', 'id');
    }

    public function InvoicesIncoming()
    {
        return $this->hasMany('App\Models\Invoice', 'recipient_id', 'id')->where('recipient_type', 'App\Models\Club');
    }

    public function InvoicesOutgoing()
    {
        return $this->hasMany('App\Models\Invoice', 'sender_id', 'id')->where('sender_type', 'App\Models\Club');
    }

    public function scopeSearch($query, $searchQuery)
    {
        if($searchQuery):
            return $query->where(function($query) use ($searchQuery){
                $query->where('name', 'LIKE', '%'.$searchQuery.'%');
                #$query->orWhere('clubs_nr', 'LIKE', '%'.$searchQuery.'%');
            });
        endif;
    }

    public function getFilteredInvoicesByDirection($paginate = true){
        $direction = \Request::get('direction');
        $searchstring = \Request::get('search');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;
        $payment_status = \Request::get('payment_status');
        $paidAtStart = \Request::get('paid_at_start');
        $paidAtEnd = \Request::get('paid_at_end');
        $createdAtStart = \Request::get('created_at_start');
        $createdAtEnd = \Request::get('created_at_end');

        $query = \App\Models\Invoice::orderBy('invoices.created_at', 'DESC');

        if($direction == 'outgoing'):
            $query->where('sender_id', $this->id);
            $query->where('sender_type', 'App\Models\Club');
        elseif($direction == 'incoming'):
            $query->where('recipient_id', $this->id);
            $query->where('recipient_type', 'App\Models\Club');
        endif;

        if($searchstring) $query->search($searchstring);
        if($payment_status) $query->filterByPaymentStatus($payment_status);

        $query->paidBetween($paidAtStart, $paidAtEnd);
        $query->createdBetween($createdAtStart, $createdAtEnd);

        if($paginate){
            $invoices = $query->paginate($perPage);
            if($invoices->currentPage() > $invoices->lastPage()):
                \Request::replace(['page'=>$invoices->lastPage()]);
                $invoices = $query->paginate($perPage);
            endif;
            $invoices = $invoices->toArray();
            $invoices['direction'] = $direction;
            $invoices['search'] = $searchstring;
            $invoices['payment_status'] = $payment_status;
        } else {
            $invoices = $query->get();
        }
        
        return $invoices;
    }

}
