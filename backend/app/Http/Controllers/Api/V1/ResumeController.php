<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ResumeResource;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ResumeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $resumes = $request->user()
            ->resumes()
            ->latest('updated_at')
            ->get();

        return ResumeResource::collection($resumes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'role' => ['required', 'string', 'max:120'],
            'style' => ['required', 'string', Rule::in(['editorial', 'classic', 'modern', 'minimal'])],
        ]);

        $resume = $request->user()->resumes()->create($validated);

        return (new ResumeResource($resume))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Resume $resume): ResumeResource
    {
        abort_unless($resume->user_id === $request->user()->id, 404);

        return new ResumeResource($resume);
    }

    public function update(Request $request, Resume $resume): ResumeResource
    {
        abort_unless($resume->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'role' => ['required', 'string', 'max:120'],
            'style' => ['required', 'string', Rule::in(['editorial', 'classic', 'modern', 'minimal'])],
        ]);

        $resume->update($validated);

        return new ResumeResource($resume->refresh());
    }

    public function destroy(Request $request, Resume $resume): Response
    {
        abort_unless($resume->user_id === $request->user()->id, 404);

        $resume->delete();

        return response()->noContent();
    }
}
