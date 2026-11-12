<?php

namespace App\Http\Requests;

use App\Enums\ResumeStyle;
use Illuminate\Validation\Rule;

class UpdateResumeRequest extends ResumeRequest
{
    /**
     * PUT replaces every core field. PATCH accepts any subset of them, but a
     * field that is present must still be valid and non-empty.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isPatch = $this->isMethod('PATCH');

        return array_merge([
            'name' => $isPatch
                ? ['sometimes', 'required', 'string', 'max:120']
                : ['required', 'string', 'max:120'],
            'role' => $isPatch
                ? ['sometimes', 'required', 'string', 'max:120']
                : ['required', 'string', 'max:120'],
            'style' => $isPatch
                ? ['sometimes', 'required', Rule::enum(ResumeStyle::class)]
                : ['required', Rule::enum(ResumeStyle::class)],
        ], $this->documentRules());
    }
}
