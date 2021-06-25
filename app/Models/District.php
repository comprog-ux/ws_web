<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use \Storage;

class District extends Model
{
    use SoftDeletes;
    protected $table = 'districts';

    protected $appends = [
        'clubs_count',
        'address_combined',
        'logo_url',
        'logo_path'
    ];

    protected $fillable = [
        'districts_nr',
        'name',
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
        'admins_count',
        'pivot'
    ];

    public function getLogoUrlAttribute()
    {
        return ($this->logo) ? Storage::disk('local')->url('public/districts/'.$this->id.'/'.$this->logo) : '';
    }

    public function getLogoPathAttribute()
    {
        return ($this->logo) ? storage_path('app/public/districts/'.$this->id.'/'.$this->logo) : '';
    }

    public function getUserHasRoleAttribute()
    {
        $value = \DB::table('districts_admins')
            ->select('role')
            ->where('districts', $this->id)
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

    public function getClubsCountAttribute(){
        return $this->hasMany('App\Models\Club','districts_id', 'id')->count();
    }

    public function Admins(){
        return $this->belongsToMany('App\Models\User', 'districts_admins', 'districts_id', 'users_id')->wherePivot('role', 'admin');
    }

    public function Clubs(){
        return $this->hasMany('App\Models\Club','districts_id', 'id');
    }

    public function InvoicesIncoming()
    {
        return $this->hasMany('App\Models\Invoice', 'recipient_id', 'id')->where('recipient_type', 'App\Models\District');
    }

    public function InvoicesOutgoing()
    {
        return $this->hasMany('App\Models\Invoice', 'sender_id', 'id')->where('sender_type', 'App\Models\District');
    }

    public function scopeSearch($query, $searchQuery)
    {
        if($searchQuery):
            return $query->where(function($query) use ($searchQuery){
                $query->where('name', 'LIKE', '%'.$searchQuery.'%');
                $query->orWhere('districts_nr', 'LIKE', '%'.$searchQuery.'%');
            });
        endif;
    }

    public function getFilteredInvoicesByDirection($paginate = true){
        $direction = \Request::get('direction');
        $searchstring = \Request::get('search');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;
        $payment_status = \Request::get('payment_status');
        $orderby = \Request::get('orderby');
        $paidAtStart = \Request::get('paid_at_start');
        $paidAtEnd = \Request::get('paid_at_end');
        $createdAtStart = \Request::get('created_at_start');
        $createdAtEnd = \Request::get('created_at_end');

        if($searchstring):
            $query = \App\Models\Invoice::search($searchstring);
        else:
            $query = \App\Models\Invoice::search('');
        endif;

        $query->paidBetween($paidAtStart, $paidAtEnd);
        $query->createdBetween($createdAtStart, $createdAtEnd);

        if($direction == 'outgoing'):
            $query->where('sender_id', $this->id);
            $query->where('sender_type', 'App\Models\District');
        elseif($direction == 'incoming'):
            $query->where('recipient_id', $this->id);
            $query->where('recipient_type', 'App\Models\District');
        endif;

        if($orderby) $query->orderBy($orderby, 'desc');
        if($payment_status) $query->filterByPaymentStatus($payment_status);

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
            $invoices['orderby'] = $orderby;
        } else {
            $invoices = $query->get();
        }
        
        return $invoices;
    }
}
