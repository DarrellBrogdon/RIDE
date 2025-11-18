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
        try {
            $request->validate([
                'format' => ['required', 'in:csv,excel'],
                'date_from' => ['nullable', 'date'],
                'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            ]);

            \Log::info('Export request received', [
                'format' => $request->format,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'user_id' => $request->user()->id,
            ]);

            // Build query
            $query = Receipt::where('user_id', $request->user()->id)
                ->with('lineItems')
                ->where('status', 'completed'); // Only export completed receipts

            // Apply date filters (use whereDate for date-only comparisons)
            if ($request->has('date_from')) {
                $query->whereDate('date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('date', '<=', $request->date_to);
            }

            // Get receipts
            $receipts = $query->orderBy('date', 'desc')->get();

            \Log::info('Receipts found for export', ['count' => $receipts->count()]);

            if ($receipts->isEmpty()) {
                return response()->json([
                    'message' => 'No receipts found for export.',
                ], 404);
            }

            // Generate filename
            $timestamp = now()->format('Y-m-d_His');
            $filename = "receipts_export_{$timestamp}";

            \Log::info('Attempting to export', [
                'format' => $request->format,
                'filename' => $filename,
                'receipt_count' => $receipts->count(),
            ]);

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
        } catch (\Exception $e) {
            \Log::error('Export failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
