<?php

namespace App\Http\Requests;

use App\Enums\ResumeStyle;
use Illuminate\Validation\Rule;

class StoreResumeRequest extends ResumeRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge([
            'name' => ['required', 'string', 'max:120'],
            'role' => ['required', 'string', 'max:120'],
            'style' => ['required', Rule::enum(ResumeStyle::class)],
        ], $this->documentRules());
    }
}
