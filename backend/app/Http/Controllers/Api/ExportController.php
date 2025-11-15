<?php

namespace App\Http\Controllers\Api;

use App\Exports\ReceiptsExcelExport;
use App\Exports\ReceiptsExport;
use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * Export receipts to CSV or Excel.
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => ['required', 'in:csv,excel'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        // Build query
        $query = Receipt::where('user_id', $request->user()->id)
            ->with('lineItems')
            ->where('status', 'completed'); // Only export completed receipts

        // Apply date filters
        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        // Get receipts
        $receipts = $query->orderBy('date', 'desc')->get();

        if ($receipts->isEmpty()) {
            return response()->json([
                'message' => 'No receipts found for export.',
            ], 404);
        }

        // Generate filename
        $timestamp = now()->format('Y-m-d_His');
        $filename = "receipts_export_{$timestamp}";

        // Export based on format
        if ($request->format === 'csv') {
            return Excel::download(
                new ReceiptsExport($receipts),
                "{$filename}.csv"
            );
        } else {
            return Excel::download(
                new ReceiptsExcelExport($receipts),
                "{$filename}.xlsx"
            );
        }
    }
}
