<?php

namespace App\Exports;

use App\Models\Receipt;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ReceiptsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $receipts;

    public function __construct($receipts)
    {
        $this->receipts = $receipts;
    }

    /**
     * Return collection of receipts with line items.
     */
    public function collection()
    {
        // Flatten receipts with line items
        $rows = collect();

        foreach ($this->receipts as $receipt) {
            if ($receipt->lineItems->count() > 0) {
                foreach ($receipt->lineItems as $lineItem) {
                    $rows->push([
                        'receipt' => $receipt,
                        'line_item' => $lineItem,
                    ]);
                }
            } else {
                // Add receipt without line items
                $rows->push([
                    'receipt' => $receipt,
                    'line_item' => null,
                ]);
            }
        }

        return $rows;
    }

    /**
     * Define column headings.
     */
    public function headings(): array
    {
        return [
            'Date',
            'Vendor',
            'Item Description',
            'Quantity',
            'Unit Price',
            'Amount',
            'Tax',
            'Total',
        ];
    }

    /**
     * Map each row to the correct format.
     */
    public function map($row): array
    {
        $receipt = $row['receipt'];
        $lineItem = $row['line_item'];

        return [
            $receipt->date ? $receipt->date->format('Y-m-d') : '',
            $receipt->vendor ?? '',
            $lineItem ? $lineItem->description : '',
            $lineItem ? $lineItem->quantity : '',
            $lineItem ? $lineItem->unit_price : '',
            $lineItem ? $lineItem->amount : '',
            $receipt->tax ?? '',
            $receipt->total ?? '',
        ];
    }
}
