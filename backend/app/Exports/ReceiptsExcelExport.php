<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ReceiptsExcelExport implements WithMultipleSheets
{
    protected $receipts;

    public function __construct($receipts)
    {
        $this->receipts = $receipts;
    }

    /**
     * Return an array of sheets.
     */
    public function sheets(): array
    {
        return [
            new ReceiptsSummarySheet($this->receipts),
            new ReceiptsDetailSheet($this->receipts),
        ];
    }
}
