<?php

namespace App\Services;

/**
 * Anthropic API pricing calculator.
 *
 * Pricing as of November 2024:
 * - Claude Sonnet 4.5: $3.00 per million input tokens, $15.00 per million output tokens
 * - Claude Opus: $15.00 per million input tokens, $75.00 per million output tokens
 * - Claude Haiku: $0.25 per million input tokens, $1.25 per million output tokens
 */
class AnthropicPricing
{
    /**
     * Pricing per million tokens (in USD)
     */
    private const PRICING = [
        'claude-sonnet-4-5' => [
            'input' => 3.00,
            'output' => 15.00,
        ],
        'claude-3-5-sonnet-20241022' => [
            'input' => 3.00,
            'output' => 15.00,
        ],
        'claude-3-opus-20240229' => [
            'input' => 15.00,
            'output' => 75.00,
        ],
        'claude-3-5-haiku-20241022' => [
            'input' => 0.25,
            'output' => 1.25,
        ],
        'claude-3-haiku-20240307' => [
            'input' => 0.25,
            'output' => 1.25,
        ],
    ];

    /**
     * Calculate the cost for a given model and token usage.
     *
     * @param string $model Model identifier
     * @param int $inputTokens Number of input tokens
     * @param int $outputTokens Number of output tokens
     * @return float Cost in USD
     */
    public static function calculateCost(string $model, int $inputTokens, int $outputTokens): float
    {
        // Normalize model name
        $model = self::normalizeModelName($model);

        if (!isset(self::PRICING[$model])) {
            // Default to Sonnet 4.5 pricing if model not found
            $model = 'claude-sonnet-4-5';
        }

        $pricing = self::PRICING[$model];

        // Calculate cost: (tokens / 1,000,000) * price_per_million
        $inputCost = ($inputTokens / 1_000_000) * $pricing['input'];
        $outputCost = ($outputTokens / 1_000_000) * $pricing['output'];

        return round($inputCost + $outputCost, 6);
    }

    /**
     * Normalize model name to match pricing keys.
     *
     * @param string $model
     * @return string
     */
    private static function normalizeModelName(string $model): string
    {
        // Handle common variations
        $model = strtolower($model);

        if (str_contains($model, 'sonnet-4')) {
            return 'claude-sonnet-4-5';
        }

        if (str_contains($model, 'sonnet')) {
            return 'claude-3-5-sonnet-20241022';
        }

        if (str_contains($model, 'opus')) {
            return 'claude-3-opus-20240229';
        }

        if (str_contains($model, 'haiku')) {
            return 'claude-3-5-haiku-20241022';
        }

        return $model;
    }

    /**
     * Get pricing information for a model.
     *
     * @param string $model
     * @return array|null
     */
    public static function getPricing(string $model): ?array
    {
        $model = self::normalizeModelName($model);
        return self::PRICING[$model] ?? null;
    }
}
