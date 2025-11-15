<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessReceiptJob;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptController extends Controller
{
    /**
     * Upload a receipt image.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:' . (env('UPLOAD_MAX_SIZE', 10) * 1024), // Convert MB to KB
            ],
        ]);

        $file = $request->file('file');
        $user = $request->user();

        // Generate unique filename with UUID
        $extension = $file->getClientOriginalExtension();
        $uuid = Str::uuid();
        $filename = $uuid . '.' . $extension;

        // Create directory structure: uploads/receipts/{user_id}/{year}/{month}/
        $year = date('Y');
        $month = date('m');
        $directory = "uploads/receipts/{$user->id}/{$year}/{$month}";

        // Store the file
        $path = $file->storeAs($directory, $filename);

        // Create receipt record with pending status
        $receipt = Receipt::create([
            'user_id' => $user->id,
            'file_path' => $path,
            'status' => 'pending',
        ]);

        // Dispatch job to process receipt with Claude API
        ProcessReceiptJob::dispatch($receipt);

        return response()->json([
            'message' => 'File uploaded successfully. Processing will begin shortly.',
            'receipt' => [
                'id' => $receipt->id,
                'file_path' => $receipt->file_path,
                'status' => $receipt->status,
                'created_at' => $receipt->created_at,
            ],
        ], 201);
    }

    /**
     * List all receipts for the authenticated user.
     */
    public function index(Request $request)
    {
        $query = Receipt::where('user_id', $request->user()->id)
            ->with('lineItems');

        // Filter by status
        if ($request->has('status')) {
            $query->status($request->status);
        }

        // Filter by vendor
        if ($request->has('vendor')) {
            $query->vendor($request->vendor);
        }

        // Filter by date range
        if ($request->has('date_from') || $request->has('date_to')) {
            $query->dateRange($request->date_from, $request->date_to);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 15);
        $receipts = $query->paginate($perPage);

        return response()->json($receipts);
    }

    /**
     * Get a single receipt with line items.
     */
    public function show(Request $request, $id)
    {
        $receipt = Receipt::where('user_id', $request->user()->id)
            ->with('lineItems')
            ->findOrFail($id);

        return response()->json([
            'receipt' => $receipt,
        ]);
    }

    /**
     * Update receipt data.
     */
    public function update(Request $request, $id)
    {
        $receipt = Receipt::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'vendor' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'total' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
        ]);

        $receipt->update($validated);

        // Update line items if provided
        if ($request->has('line_items')) {
            // Delete existing line items
            $receipt->lineItems()->delete();

            // Create new line items
            foreach ($request->line_items as $item) {
                $receipt->lineItems()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'] ?? 1,
                    'unit_price' => $item['unit_price'],
                    'amount' => $item['amount'],
                ]);
            }
        }

        $receipt->load('lineItems');

        return response()->json([
            'message' => 'Receipt updated successfully',
            'receipt' => $receipt,
        ]);
    }

    /**
     * Delete a receipt.
     */
    public function destroy(Request $request, $id)
    {
        $receipt = Receipt::where('user_id', $request->user()->id)
            ->findOrFail($id);

        // Delete the file from storage
        if (Storage::exists($receipt->file_path)) {
            Storage::delete($receipt->file_path);
        }

        // Soft delete the receipt (will cascade delete line items and logs)
        $receipt->delete();

        return response()->json([
            'message' => 'Receipt deleted successfully',
        ]);
    }
}
