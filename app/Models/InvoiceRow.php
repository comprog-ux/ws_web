<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceRow extends Model
{
    use SoftDeletes;
    protected $table = 'invoices_rows';

    protected $fillable = [
        'description',
        'quantity',
        'unit',
        'net_unit_amount',
        'vat_percent',
        'vat_amount',
        'row_net_amount',
        'row_vat_amount',
        'row_sum_amount',
        'sortorder'
   ];

    protected $casts = [
        'quantity' => 'integer'
    ];
}
