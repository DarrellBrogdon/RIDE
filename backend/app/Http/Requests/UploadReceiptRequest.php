<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadReceiptRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxSize = env('UPLOAD_MAX_SIZE', 10) * 1024; // Convert MB to KB

        return [
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:' . $maxSize,
            ],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The uploaded file is not valid.',
            'file.mimes' => 'The file must be a JPG, PNG, or PDF.',
            'file.max' => 'The file size must not exceed ' . env('UPLOAD_MAX_SIZE', 10) . 'MB.',
        ];
    }
}
