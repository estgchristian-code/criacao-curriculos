<?php

namespace Tests\Feature;

use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumeDocumentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_a_complete_document_can_be_created_and_read(): void
    {
        $response = $this->postJson('/api/v1/resumes', $this->resumePayload([
            'document' => $this->document(),
        ]))
            ->assertCreated()
            ->assertJsonPath('data.style', 'classic')
            ->assertJsonPath('data.document.version', 1)
            ->assertJsonPath('data.document.template', 'classic');

        $resumeId = $response->json('data.id');
        $resume = Resume::query()->findOrFail($resumeId);

        $this->assertSame('summary', $resume->document['sections'][0]['type']);

        $this->getJson("/api/v1/resumes/{$resumeId}")
            ->assertOk()
            ->assertJsonPath('data.document.header.email', 'ada@example.com')
            ->assertJsonPath('data.document.sections.1.items.0.organization', 'ACME');
    }

    public function test_document_template_must_match_the_resume_style(): void
    {
        $this->postJson('/api/v1/resumes', $this->resumePayload([
            'document' => $this->document(['template' => 'modern']),
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document.template']);
    }

    public function test_header_contacts_must_be_a_valid_email_and_url(): void
    {
        $document = $this->document();
        $document['header']['email'] = 'not-an-email';
        $document['header']['website'] = 'javascript:alert(1)';
        $document['header']['linkedin'] = 'ftp://example.com/profile';

        $this->postJson('/api/v1/resumes', $this->resumePayload(['document' => $document]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'document.header.email',
                'document.header.website',
                'document.header.linkedin',
            ]);
    }

    public function test_section_type_and_duplicate_ids_are_rejected(): void
    {
        $document = $this->document();
        $document['sections'][1]['id'] = 'summary';
        $document['sections'][1]['type'] = 'hacked-section';

        $this->postJson('/api/v1/resumes', $this->resumePayload(['document' => $document]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'document.sections.1.id',
                'document.sections.1.type',
            ]);
    }

    public function test_item_dates_must_use_year_or_year_month_and_be_chronological(): void
    {
        $document = $this->document();
        $document['sections'][1]['items'][0]['startDate'] = '2024-05';
        $document['sections'][1]['items'][0]['endDate'] = '2020-01';

        $this->postJson('/api/v1/resumes', $this->resumePayload(['document' => $document]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document.sections.1.items.0.endDate']);

        $document = $this->document();
        $document['sections'][1]['items'][0]['startDate'] = '2024-13';

        $this->postJson('/api/v1/resumes', $this->resumePayload(['document' => $document]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document.sections.1.items.0.startDate']);
    }

    public function test_patch_can_replace_the_document_but_rejects_a_divergent_template(): void
    {
        $resume = $this->createResumeWithDocument();

        $this->patchJson("/api/v1/resumes/{$resume->id}", [
            'document' => $this->document(['template' => 'modern']),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document.template']);

        $this->patchJson("/api/v1/resumes/{$resume->id}", [
            'document' => $this->document(),
        ])
            ->assertOk()
            ->assertJsonPath('data.document.template', 'classic');

        $this->assertSame('classic', $resume->refresh()->document['template']);
    }

    public function test_changing_only_the_style_keeps_document_template_in_sync(): void
    {
        $resume = $this->createResumeWithDocument();

        $this->patchJson("/api/v1/resumes/{$resume->id}", ['style' => 'modern'])
            ->assertOk()
            ->assertJsonPath('data.style', 'modern')
            ->assertJsonPath('data.document.template', 'modern');

        $this->assertSame('modern', $resume->refresh()->document['template']);
    }

    public function test_health_reports_whether_the_document_column_is_available(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('document_persistence', true);
    }

    public function test_a_courses_section_is_accepted(): void
    {
        $document = $this->document();
        $document['sections'][] = [
            'id' => 'courses-1',
            'type' => 'courses',
            'title' => 'Cursos, certificações e projetos',
            'visible' => true,
            'layout' => 'default',
            'tags' => [],
            'items' => [
                [
                    'id' => 'course-1',
                    'title' => 'Curso de Arquitetura de Software',
                    'organization' => 'Alura',
                    'location' => 'Online',
                    'startDate' => '2023-02',
                    'endDate' => '2023-06',
                    'description' => 'Formação em sistemas distribuídos.',
                ],
            ],
        ];

        $this->postJson('/api/v1/resumes', $this->resumePayload(['document' => $document]))
            ->assertCreated()
            ->assertJsonPath('data.document.sections.2.type', 'courses');
    }

    public function test_a_blank_document_matching_the_editor_payload_is_accepted(): void
    {
        $document = $this->document();
        $document['header'] = [
            'name' => 'Ada Lovelace',
            'headline' => 'Engenheira de software',
            'email' => null,
            'phone' => null,
            'location' => null,
            'website' => null,
            'linkedin' => null,
        ];
        $document['sections'] = [
            [
                'id' => 'summary',
                'type' => 'summary',
                'title' => 'Resumo profissional',
                'visible' => true,
                'text' => '',
                'layout' => 'default',
                'tags' => [],
                'items' => [],
            ],
            [
                'id' => 'experience',
                'type' => 'experience',
                'title' => 'Experiência profissional',
                'visible' => true,
                'text' => '',
                'layout' => 'timeline',
                'tags' => [],
                'items' => [
                    [
                        'id' => 'item-1',
                        'title' => '',
                        'organization' => '',
                        'location' => '',
                        'startDate' => null,
                        'endDate' => null,
                        'description' => '',
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/resumes', $this->resumePayload(['document' => $document]))
            ->assertCreated();

        $this->assertSame('experience', $response->json('data.document.sections.1.type'));
        $this->assertCount(1, $response->json('data.document.sections.1.items'));
    }

    public function test_put_without_a_document_keeps_the_stored_document(): void
    {
        $resume = $this->createResumeWithDocument();

        $this->putJson("/api/v1/resumes/{$resume->id}", [
            'name' => 'Ada Byron',
            'role' => 'Matemática',
            'style' => 'classic',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Ada Byron')
            ->assertJsonPath('data.document.template', 'classic');

        $this->assertSame(
            'ACME',
            $resume->refresh()->document['sections'][1]['items'][0]['organization'],
        );
    }

    private function createResumeWithDocument(): Resume
    {
        $response = $this->postJson('/api/v1/resumes', $this->resumePayload([
            'document' => $this->document(),
        ]))->assertCreated();

        return Resume::query()->findOrFail($response->json('data.id'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function resumePayload(array $overrides = []): array
    {
        return array_replace([
            'name' => 'Ada Lovelace',
            'role' => 'Engenheira de software',
            'style' => 'classic',
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function document(array $overrides = []): array
    {
        return array_replace_recursive([
            'version' => 1,
            'template' => 'classic',
            'theme' => [
                'fontFamily' => 'Inter',
                'fontScale' => 100,
                'accentColor' => '#2F4B7C',
                'textColor' => '#111827',
                'headingColor' => '#111827',
                'lineHeight' => 1.5,
                'sectionSpacing' => 16,
                'pagePadding' => 48,
                'headingStyle' => 'rule',
                'headerStyle' => 'minimal',
                'bodyAlign' => 'left',
                'nameAlign' => 'left',
                'itemLayout' => 'stacked',
                'showIcons' => true,
            ],
            'header' => [
                'name' => 'Ada Lovelace',
                'headline' => 'Engenheira de software',
                'email' => 'ada@example.com',
                'phone' => '+55 11 99999-9999',
                'location' => 'São Paulo, SP',
                'website' => 'https://ada.example.com',
                'linkedin' => 'https://www.linkedin.com/in/ada',
            ],
            'sections' => [
                [
                    'id' => 'summary',
                    'type' => 'summary',
                    'title' => 'Resumo',
                    'visible' => true,
                    'text' => 'Engenheira de software com foco em sistemas distribuídos.',
                    'layout' => 'default',
                    'tags' => ['php', 'laravel'],
                    'items' => [],
                ],
                [
                    'id' => 'experience',
                    'type' => 'experience',
                    'title' => 'Experiência',
                    'visible' => true,
                    'layout' => 'timeline',
                    'tags' => [],
                    'items' => [
                        [
                            'id' => 'job-1',
                            'title' => 'Engenheira de software',
                            'organization' => 'ACME',
                            'location' => 'Remoto',
                            'startDate' => '2020-01',
                            'endDate' => '2023-12',
                            'description' => 'Desenvolvimento de APIs e integrações.',
                        ],
                    ],
                ],
            ],
        ], $overrides);
    }
}
