<?php

namespace App\Jobs;

use App\Models\ExtractionLog;
use App\Models\Receipt;
use App\Services\ClaudeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessReceiptJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 5;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 90;

    protected Receipt $receipt;

    /**
     * Create a new job instance.
     */
    public function __construct(Receipt $receipt)
    {
        $this->receipt = $receipt;
    }

    /**
     * Execute the job.
     */
    public function handle(ClaudeService $claudeService): void
    {
        // Update receipt status to processing
        $this->receipt->update(['status' => 'processing']);

        // Create extraction log
        $log = ExtractionLog::create([
            'receipt_id' => $this->receipt->id,
            'status' => 'processing',
        ]);

        try {
            // Extract data using Claude API
            $result = $claudeService->extractReceiptData($this->receipt->file_path);

            if ($result['success']) {
                $data = $result['data'];

                // Update receipt with extracted data
                $this->receipt->update([
                    'vendor' => $data['vendor'],
                    'date' => $data['transaction_date'],
                    'total' => $data['total_amount'],
                    'tax' => $data['tax_amount'],
                    'status' => 'completed',
                    'raw_response' => $result['raw_response'],
                ]);

                // Create line items
                foreach ($data['line_items'] as $item) {
                    $this->receipt->lineItems()->create([
                        'description' => $item['description'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'amount' => $item['amount'],
                    ]);
                }

                // Update extraction log
                $log->update([
                    'status' => 'success',
                    'processing_time' => $result['processing_time'],
                ]);

                Log::info('Receipt processed successfully', [
                    'receipt_id' => $this->receipt->id,
                    'processing_time' => $result['processing_time'],
                ]);

            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            // Update receipt status to failed
            $this->receipt->update(['status' => 'failed']);

            // Update extraction log
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'processing_time' => $result['processing_time'] ?? 0,
            ]);

            Log::error('Receipt processing failed', [
                'receipt_id' => $this->receipt->id,
                'error' => $e->getMessage(),
            ]);

            // Re-throw to trigger retry
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        // Update receipt status to failed after all retries
        $this->receipt->update(['status' => 'failed']);

        Log::error('Receipt processing failed permanently', [
            'receipt_id' => $this->receipt->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
