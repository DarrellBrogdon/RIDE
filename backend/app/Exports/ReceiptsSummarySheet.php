<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReceiptsSummarySheet implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected $receipts;

    public function __construct($receipts)
    {
        $this->receipts = $receipts;
    }

    public function collection()
    {
        return $this->receipts;
    }

    public function headings(): array
    {
        return [
            'Date',
            'Vendor',
            'Total',
            'Tax',
            'Status',
        ];
    }

    public function map($receipt): array
    {
        return [
            $receipt->date ? $receipt->date->format('Y-m-d') : '',
            $receipt->vendor ?? '',
            $receipt->total ?? 0,
            $receipt->tax ?? 0,
            ucfirst($receipt->status),
        ];
    }

    public function title(): string
    {
        return 'Summary';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
