<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResumeRequest;
use App\Http\Requests\UpdateResumeRequest;
use App\Http\Resources\ResumeResource;
use App\Http\Resources\ResumeSummaryResource;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ResumeController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const SUMMARY_COLUMNS = ['id', 'name', 'role', 'style', 'updated_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(100, max(1, $request->integer('per_page', 20)));

        $resumes = $request->user()
            ->resumes()
            ->select(self::SUMMARY_COLUMNS)
            ->latest('updated_at')
            ->latest('id')
            ->paginate($perPage);

        return ResumeSummaryResource::collection($resumes);
    }

    public function store(StoreResumeRequest $request): JsonResponse
    {
        $resume = $request->user()->resumes()->create($request->validated());

        return (new ResumeResource($resume))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Resume $resume): ResumeResource
    {
        abort_unless($resume->user_id === $request->user()->id, 404);

        return new ResumeResource($resume);
    }

    /**
     * PUT requires the complete set of core fields. PATCH requires only the
     * fields being changed. The `document` is replaced as a whole whenever it
     * is present in the payload; when it is omitted, only `style` is kept in
     * sync with its redundant `document.template` copy.
     */
    public function update(UpdateResumeRequest $request, Resume $resume): ResumeResource
    {
        abort_unless($resume->user_id === $request->user()->id, 404);

        $validated = $request->validated();

        if (! array_key_exists('document', $validated) && array_key_exists('style', $validated)) {
            $document = $resume->document;

            if (is_array($document) && isset($document['template']) && $document['template'] !== $validated['style']) {
                $document['template'] = $validated['style'];
                $validated['document'] = $document;
            }
        }

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
