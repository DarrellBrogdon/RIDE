<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receipt extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'file_path',
        'vendor',
        'date',
        'total',
        'tax',
        'status',
        'raw_response',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'datetime',
        'total' => 'decimal:2',
        'tax' => 'decimal:2',
        'raw_response' => 'array',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user that owns the receipt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the line items for the receipt.
     */
    public function lineItems(): HasMany
    {
        return $this->hasMany(LineItem::class);
    }

    /**
     * Get the extraction logs for the receipt.
     */
    public function extractionLogs(): HasMany
    {
        return $this->hasMany(ExtractionLog::class);
    }

    /**
     * Scope a query to only include receipts of a given status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $from = null, $to = null)
    {
        if ($from) {
            $query->where('date', '>=', $from);
        }
        if ($to) {
            $query->where('date', '<=', $to);
        }
        return $query;
    }

    /**
     * Scope a query to search by vendor.
     */
    public function scopeVendor($query, string $vendor)
    {
        return $query->where('vendor', 'like', '%' . $vendor . '%');
    }
}
