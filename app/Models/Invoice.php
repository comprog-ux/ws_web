<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;
    protected $table = 'invoices';

    protected $fillable = [
        'paid_at'
    ];

    protected $appends = [
        'sum_amount',
        'currency',
        'signups_count',
        'teams_count',
        'invoice_date',
        'payment_status',
        'recipient_address_combined',
        'sender_address_combined',
        'recipient_object',
        'sender_object'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'created_by',
        'invoice_nr',
        'payment_gateway',
        'payment_reference',
        'recipient_type',
        'sender_type',
        'recipient_id',
        'sender_id',
    ];

    public function recipient()
    {
        return $this->morphTo();
    }

    public function getSumAmountAttribute()
    {
        return $this->amount;
    }

    public function getRecipientObjectAttribute()
    {
        switch($this->recipient_type):
            case 'App\Models\Club':
                return 'club';
                break;
            case 'App\Models\User':
                return 'user';
                break;
            case 'App\Models\District':
                return 'district';
                break;
            default:
                return '';
            break;
        endswitch;
    }

    public function getSenderObjectAttribute()
    {
        switch($this->sender_type):
            case 'App\Models\Club':
                return 'club';
                break;
            case 'App\Models\User':
                return 'user';
                break;
            case 'App\Models\District':
                return 'district';
                break;
            default:
                return '';
            break;
        endswitch;
    }

    public function User()
    {
        return $this->belongsTo('App\Models\User', 'created_by', 'id');
    }
    public function getCurrencyAttribute()
    {
        return 'kr';
    }

    public function getRecipientAddressCombinedAttribute()
    {
        $address = null;
        $address .= ($this->recipient_address_street) ? $this->recipient_address_street."\n" : '';
        $address .= ($this->recipient_address_street_2) ? $this->recipient_address_street_2."\n" : '';
        $address .= ($this->recipient_address_zipcode) ? $this->recipient_address_zipcode." " : '';
        $address .= ($this->recipient_address_city) ? $this->recipient_address_city : '';
        $address .= ($this->recipient_address_zipcode || $this->recipient_address_city) ? "\n" : '';
        $address .= ($this->recipient_address_country) ? $this->recipient_address_country : '';
        return $address;
    }

    public function getSenderAddressCombinedAttribute()
    {
        $address = null;
        $address .= ($this->sender_address_street) ? $this->sender_address_street."\n" : '';
        $address .= ($this->sender_address_street_2) ? $this->sender_address_street_2."\n" : '';
        $address .= ($this->sender_address_zipcode) ? $this->sender_address_zipcode." " : '';
        $address .= ($this->sender_address_city) ? $this->sender_address_city : '';
        $address .= ($this->sender_address_zipcode || $this->sender_address_city) ? "\n" : '';
        $address .= ($this->sender_address_country) ? $this->sender_address_country : '';
        return $address;
    }

    public function InvoiceRows()
    {
        return $this->hasMany('App\Models\InvoiceRow', 'invoices_id','id')->orderBy('Description');
    }
    
    public function sender()
    {
        return $this->morphTo();
    }

    public function Signups(){
        return $this->hasMany('App\Models\Signup', 'invoices_id', 'id');
    }

    public function Teams(){
        return $this->hasMany('App\Models\Team', 'invoices_id', 'id');
    }

    public function getInvoiceDateAttribute()
    {
        return date("Y-m-d", strtotime($this->created_at));
    }
    public function getPaymentStatusAttribute()
    {
        return ($this->paid_at == '') ? _('Ej betald') : _('Betald');
    }

    public function getSignupsCountAttribute()
    {
        if($this->relationLoaded('Signups')):
            $related = $this->getRelation('Signups');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Signup', 'invoices_id', 'id')->count();
        endif;
    }
    public function getTeamsCountAttribute()
    {
        if($this->relationLoaded('Teams')):
            $related = $this->getRelation('Teams');
            return ($related) ? (int)$related->count() : 0;
        else:
            return $this->hasMany('App\Models\Team', 'invoices_id', 'id')->count();
        endif;
    }

    public function generatePdf()
    {
        $pdf = new \App\Classes\pdfInvoice();
        $pdf->create($this->id);
    }

    public function seperatevat()
    {
        return $this->InvoiceRows()
            ->selectRaw('SUM(row_vat_amount) as total, vat_percent')
            ->groupBy('vat_percent')
            ->orderBy('vat_percent');
    }

    static public function GenerateInvoiceNumber($recipient_type, $recipient_id)
    {
        $latestInvoiceNr = Invoice::where('sender_type', $recipient_type)->where('sender_id', $recipient_id)->orderBy('invoice_nr','desc')->first();
        if(count($latestInvoiceNr)):
            return $latestInvoiceNr->invoice_nr+1;
        else:
            return 1500;
        endif;
    }

    public function scopeFilterByPaymentStatus($query, $status)
    {
        if($status == 'unpaid'):
            $query->whereNull('paid_at');
        elseif($status == 'paid'):
            $query->whereNotNull('paid_at');
        endif;
    }

    public function scopeSearch($query, $args)
    {
        $args = str_getcsv($args,' ','"');

        $query->where(function($query) use ($args) {
            foreach ($args as $arg):
                if ($arg = trim($arg)):
                    $query->where('invoice_reference', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('recipient_name', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('sender_name', 'LIKE', '%' . $arg . '%');
                    $query->orWhere('amount', 'LIKE', '%' . $arg . '%');
                endif;
            endforeach;
        });

        return $query;
    }

    public function scopePaidBetween($query, $start = null, $end = null)
    {
        if($start){
            $query = $query->whereRaw('DATE(invoices.paid_at) >= "'.$start.'"');
        }
        if($end){
            $query = $query->whereRaw('DATE(invoices.paid_at) <= "'.$end.'"');
        }

        return $query;
    }

    public function scopeCreatedBetween($query, $start = null, $end = null)
    {
        if($start){
            $query = $query->whereRaw('DATE(invoices.created_at) >= "'.$start.'"');
        }
        if($end){
            $query = $query->whereRaw('DATE(invoices.created_at) <= "'.$end.'"');
        }

        return $query;
    }
}
