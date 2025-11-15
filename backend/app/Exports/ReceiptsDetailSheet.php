<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReceiptsDetailSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected $receipts;

    public function __construct($receipts)
    {
        $this->receipts = $receipts;
    }

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
            }
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'Date',
            'Vendor',
            'Item Description',
            'Quantity',
            'Unit Price',
            'Line Total',
            'Receipt Tax',
            'Receipt Total',
        ];
    }

    public function map($row): array
    {
        $receipt = $row['receipt'];
        $lineItem = $row['line_item'];

        return [
            $receipt->date ? $receipt->date->format('Y-m-d') : '',
            $receipt->vendor ?? '',
            $lineItem->description,
            $lineItem->quantity,
            $lineItem->unit_price,
            $lineItem->amount,
            $receipt->tax ?? 0,
            $receipt->total ?? 0,
        ];
    }

    public function title(): string
    {
        return 'Line Items';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
