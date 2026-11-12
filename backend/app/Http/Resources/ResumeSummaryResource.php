<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lightweight representation used by the resume listing.
 *
 * The full `document` is intentionally excluded so the index endpoint stays
 * small and does not load potentially large JSON payloads.
 */
class ResumeSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => $this->role,
            'style' => $this->style,
            'updated_at' => $this->updated_at,
        ];
    }
}
