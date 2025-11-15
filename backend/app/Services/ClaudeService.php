<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ClaudeService
{
    protected string $apiKey;
    protected string $apiUrl = 'https://api.anthropic.com/v1/messages';
    protected string $model = 'claude-sonnet-4-5';

    public function __construct()
    {
        $this->apiKey = env('ANTHROPIC_API_KEY');
    }

    /**
     * Extract receipt data from an image.
     *
     * @param string $imagePath Path to the image file in storage
     * @return array Extracted receipt data
     * @throws \Exception
     */
    public function extractReceiptData(string $imagePath): array
    {
        $startTime = microtime(true);

        try {
            // Read the image file and encode to base64
            $imageContents = Storage::get($imagePath);
            $base64Image = base64_encode($imageContents);

            // Determine media type
            $extension = pathinfo($imagePath, PATHINFO_EXTENSION);
            $mediaType = $this->getMediaType($extension);

            // Build the prompt
            $prompt = $this->buildExtractionPrompt();

            // Make API request
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->timeout(30)
                ->post($this->apiUrl, [
                    'model' => $this->model,
                    'max_tokens' => 1024,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => [
                                [
                                    'type' => 'image',
                                    'source' => [
                                        'type' => 'base64',
                                        'media_type' => $mediaType,
                                        'data' => $base64Image,
                                    ],
                                ],
                                [
                                    'type' => 'text',
                                    'text' => $prompt,
                                ],
                            ],
                        ],
                    ],
                ]);

            if ($response->failed()) {
                $errorBody = $response->body();
                $statusCode = $response->status();

                // Try to parse error as JSON
                $errorData = json_decode($errorBody, true);
                $errorMessage = $errorData['error']['message'] ?? $errorBody;

                Log::error('Claude API request failed', [
                    'status_code' => $statusCode,
                    'response_body' => $errorBody,
                    'error_message' => $errorMessage,
                    'api_key_present' => !empty($this->apiKey),
                    'api_key_length' => strlen($this->apiKey ?? ''),
                    'image_path' => $imagePath,
                    'media_type' => $mediaType,
                ]);

                throw new \Exception("Claude API error ({$statusCode}): {$errorMessage}");
            }

            $responseData = $response->json();

            // Extract text content from response
            $textContent = $responseData['content'][0]['text'] ?? '';

            // Parse the JSON response
            $extractedData = $this->parseClaudeResponse($textContent);

            $processingTime = (int)((microtime(true) - $startTime) * 1000);

            return [
                'success' => true,
                'data' => $extractedData,
                'raw_response' => $responseData,
                'processing_time' => $processingTime,
            ];

        } catch (\Exception $e) {
            $processingTime = (int)((microtime(true) - $startTime) * 1000);

            Log::error('Claude extraction failed', [
                'error' => $e->getMessage(),
                'image_path' => $imagePath,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'processing_time' => $processingTime,
            ];
        }
    }

    /**
     * Build the extraction prompt.
     */
    protected function buildExtractionPrompt(): string
    {
        return <<<'PROMPT'
Extract the following information from this receipt/invoice image and return it as valid JSON:

- vendor: The vendor/merchant name
- transaction_date: The transaction date in YYYY-MM-DD HH:MM:SS format
- total_amount: The total amount as a decimal number
- tax_amount: The tax amount as a decimal number (0 if not found)
- line_items: An array of items purchased with the following fields for each:
  - description: Item description
  - quantity: Quantity (default to 1 if not specified)
  - unit_price: Price per unit as a decimal
  - amount: Total amount for this line item as a decimal

Return ONLY valid JSON in exactly this format, with no additional text:
{
  "vendor": "Vendor Name",
  "transaction_date": "2024-11-14 19:07:03",
  "total_amount": 21.31,
  "tax_amount": 1.58,
  "line_items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit_price": 19.73,
      "amount": 19.73
    }
  ]
}

If you cannot extract a value, use null for that field. Ensure all numeric values are numbers, not strings.
PROMPT;
    }

    /**
     * Parse Claude's response and extract structured data.
     */
    protected function parseClaudeResponse(string $responseText): array
    {
        // Try to extract JSON from the response
        // Claude might wrap JSON in markdown code blocks
        $jsonPattern = '/\{[\s\S]*\}/';

        if (preg_match($jsonPattern, $responseText, $matches)) {
            $jsonString = $matches[0];
            $data = json_decode($jsonString, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return $this->normalizeExtractedData($data);
            }
        }

        // If parsing fails, throw exception
        throw new \Exception('Failed to parse JSON from Claude response: ' . $responseText);
    }

    /**
     * Normalize extracted data to ensure correct types and structure.
     */
    protected function normalizeExtractedData(array $data): array
    {
        return [
            'vendor' => $data['vendor'] ?? null,
            'transaction_date' => $data['transaction_date'] ?? null,
            'total_amount' => isset($data['total_amount']) ? (float)$data['total_amount'] : null,
            'tax_amount' => isset($data['tax_amount']) ? (float)$data['tax_amount'] : null,
            'line_items' => $this->normalizeLineItems($data['line_items'] ?? []),
        ];
    }

    /**
     * Normalize line items data.
     */
    protected function normalizeLineItems(array $lineItems): array
    {
        return array_map(function ($item) {
            return [
                'description' => $item['description'] ?? 'Unknown item',
                'quantity' => isset($item['quantity']) ? (float)$item['quantity'] : 1,
                'unit_price' => isset($item['unit_price']) ? (float)$item['unit_price'] : 0,
                'amount' => isset($item['amount']) ? (float)$item['amount'] : 0,
            ];
        }, $lineItems);
    }

    /**
     * Get media type from file extension.
     */
    protected function getMediaType(string $extension): string
    {
        return match (strtolower($extension)) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };
    }
}
