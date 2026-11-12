<?php

namespace App\Http\Requests;

use App\Enums\ResumeSectionType;
use App\Enums\ResumeStyle;
use App\Models\Resume;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

abstract class ResumeRequest extends FormRequest
{
    /**
     * Maximum size (in bytes) accepted for the serialized document payload.
     */
    private const DOCUMENT_MAX_BYTES = 262144;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Rules shared by resume creation and update.
     *
     * `document` is optional: when present it must be sent as a complete
     * snapshot, because updates replace it as a whole instead of merging
     * nested keys. This keeps the stored document predictable.
     *
     * @return array<string, mixed>
     */
    protected function documentRules(): array
    {
        return [
            'document' => ['nullable', 'array', $this->documentSizeLimit()],
            'document.version' => ['required_with:document', 'integer', 'in:1'],
            'document.template' => ['required_with:document', Rule::enum(ResumeStyle::class)],
            'document.theme' => ['required_with:document', 'array'],
            'document.theme.fontFamily' => ['required_with:document', 'string', 'max:60'],
            'document.theme.fontScale' => ['required_with:document', 'integer', 'between:80,130'],
            'document.theme.accentColor' => ['required_with:document', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'document.theme.textColor' => ['required_with:document', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'document.theme.headingColor' => ['required_with:document', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'document.theme.lineHeight' => ['required_with:document', 'numeric', 'between:1.1,2'],
            'document.theme.sectionSpacing' => ['required_with:document', 'integer', 'between:0,64'],
            'document.theme.pagePadding' => ['required_with:document', 'integer', 'between:24,96'],
            'document.theme.headingStyle' => ['required_with:document', 'in:rule,bar,plain,boxed'],
            'document.theme.headerStyle' => ['required_with:document', 'in:minimal,split,banner'],
            'document.theme.bodyAlign' => ['required_with:document', 'in:left,justify'],
            'document.theme.nameAlign' => ['required_with:document', 'in:left,center'],
            'document.theme.itemLayout' => ['required_with:document', 'in:stacked,compact'],
            'document.theme.showIcons' => ['required_with:document', 'boolean'],

            'document.header' => ['required_with:document', 'array'],
            'document.header.name' => ['required_with:document', 'string', 'max:120'],
            'document.header.headline' => ['required_with:document', 'string', 'max:160'],
            'document.header.email' => ['nullable', 'string', 'email', 'max:160'],
            'document.header.phone' => ['nullable', 'string', 'max:60'],
            'document.header.location' => ['nullable', 'string', 'max:120'],
            'document.header.website' => ['nullable', 'string', 'url:http,https', 'max:160'],
            'document.header.linkedin' => ['nullable', 'string', 'url:http,https', 'max:160'],

            'document.sections' => ['required_with:document', 'array', 'max:30'],
            'document.sections.*.id' => ['required', 'string', 'max:64', 'distinct:strict'],
            'document.sections.*.type' => ['required', Rule::enum(ResumeSectionType::class)],
            'document.sections.*.title' => ['required', 'string', 'max:120'],
            'document.sections.*.visible' => ['required', 'boolean'],
            'document.sections.*.text' => ['nullable', 'string', 'max:6000'],
            'document.sections.*.layout' => ['nullable', 'string', 'regex:/^[a-z][a-z0-9-]{0,31}$/'],
            'document.sections.*.tags' => ['nullable', 'array', 'max:80'],
            'document.sections.*.tags.*' => ['string', 'max:60'],
            'document.sections.*.items' => ['nullable', 'array', 'max:40'],
            'document.sections.*.items.*.id' => ['required', 'string', 'max:64', 'distinct:strict'],
            'document.sections.*.items.*.title' => ['nullable', 'string', 'max:160'],
            'document.sections.*.items.*.organization' => ['nullable', 'string', 'max:160'],
            'document.sections.*.items.*.location' => ['nullable', 'string', 'max:120'],
            'document.sections.*.items.*.startDate' => ['nullable', 'string', 'regex:/^\d{4}(-(0[1-9]|1[0-2]))?$/'],
            'document.sections.*.items.*.endDate' => ['nullable', 'string', 'regex:/^\d{4}(-(0[1-9]|1[0-2]))?$/'],
            'document.sections.*.items.*.description' => ['nullable', 'string', 'max:4000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $document = $this->input('document');

            if (! is_array($document)) {
                return;
            }

            $this->validateTemplateMatchesStyle($validator, $document);
            $this->validateItemChronology($validator, $document);
        });
    }

    /**
     * `style` is the canonical template identifier of the resume. The copy kept
     * inside `document.template` must be explicitly equal; it is never silently
     * derived from the payload.
     *
     * @param  array<string, mixed>  $document
     */
    private function validateTemplateMatchesStyle(Validator $validator, array $document): void
    {
        $template = $document['template'] ?? null;

        if (! is_string($template) || ResumeStyle::tryFrom($template) === null) {
            return;
        }

        $style = $this->input('style');

        if (! is_string($style) && $this->isMethod('PATCH')) {
            $resume = $this->route('resume');
            $style = $resume instanceof Resume ? $resume->style : null;
        }

        if (is_string($style) && ResumeStyle::tryFrom($style) !== null && $style !== $template) {
            $validator->errors()->add(
                'document.template',
                'O modelo do documento deve ser igual ao modelo informado em "style".',
            );
        }
    }

    /**
     * @param  array<string, mixed>  $document
     */
    private function validateItemChronology(Validator $validator, array $document): void
    {
        $sections = $document['sections'] ?? null;

        if (! is_array($sections)) {
            return;
        }

        foreach ($sections as $sectionIndex => $section) {
            if (! is_array($section) || ! is_array($section['items'] ?? null)) {
                continue;
            }

            foreach ($section['items'] as $itemIndex => $item) {
                if (! is_array($item)) {
                    continue;
                }

                $start = $this->comparableDate($item['startDate'] ?? null, '01');
                $end = $this->comparableDate($item['endDate'] ?? null, '12');

                if ($start !== null && $end !== null && $start > $end) {
                    $validator->errors()->add(
                        "document.sections.{$sectionIndex}.items.{$itemIndex}.endDate",
                        'A data final não pode ser anterior à data inicial.',
                    );
                }
            }
        }
    }

    private function comparableDate(mixed $value, string $defaultMonth): ?string
    {
        if (! is_string($value) || ! preg_match('/^(\d{4})(?:-(0[1-9]|1[0-2]))?$/', $value, $matches)) {
            return null;
        }

        return $matches[1].'-'.($matches[2] ?? $defaultMonth);
    }

    private function documentSizeLimit(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $encoded = json_encode($value);

            if ($encoded === false || strlen($encoded) > self::DOCUMENT_MAX_BYTES) {
                $fail('O documento do currículo excede o limite de 256 KB.');
            }
        };
    }
}
