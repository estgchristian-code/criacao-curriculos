<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_resume_crud_is_available_to_an_authenticated_user(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $payload = [
            'name' => 'Ada Lovelace',
            'role' => 'Engenheira de software',
            'style' => 'editorial',
        ];

        $createResponse = $this->postJson('/api/v1/resumes', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', $payload['name'])
            ->assertJsonPath('data.role', $payload['role'])
            ->assertJsonPath('data.style', $payload['style']);

        $resumeId = $createResponse->json('data.id');
        $this->assertDatabaseHas('resumes', [
            'id' => $resumeId,
            'user_id' => $user->id,
            'name' => $payload['name'],
        ]);

        $this->getJson('/api/v1/resumes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $resumeId);

        $this->getJson("/api/v1/resumes/{$resumeId}")
            ->assertOk()
            ->assertJsonPath('data.id', $resumeId);

        $updatedPayload = [
            ...$payload,
            'name' => 'Ada Byron',
            'style' => 'classic',
        ];

        $this->putJson("/api/v1/resumes/{$resumeId}", $updatedPayload)
            ->assertOk()
            ->assertJsonPath('data.name', 'Ada Byron')
            ->assertJsonPath('data.style', 'classic');

        $this->deleteJson("/api/v1/resumes/{$resumeId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('resumes', ['id' => $resumeId]);
    }

    public function test_resume_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/resumes')->assertUnauthorized();
        $this->postJson('/api/v1/resumes', [
            'name' => 'Ada',
            'role' => 'Designer',
            'style' => 'classic',
        ])->assertUnauthorized();
    }

    public function test_users_cannot_read_or_change_another_users_resume(): void
    {
        $owner = User::factory()->create();
        $resume = $owner->resumes()->create([
            'name' => 'Grace Hopper',
            'role' => 'Compiladora',
            'style' => 'modern',
        ]);

        $intruder = User::factory()->create();
        $ownResume = $intruder->resumes()->create([
            'name' => 'Intruso',
            'role' => 'Analista',
            'style' => 'classic',
        ]);

        $this->actingAs($intruder);

        $this->getJson('/api/v1/resumes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownResume->id);

        $this->getJson("/api/v1/resumes/{$resume->id}")->assertNotFound();
        $this->putJson("/api/v1/resumes/{$resume->id}", [
            'name' => 'Alterado',
            'role' => 'Alterado',
            'style' => 'classic',
        ])->assertNotFound();
        $this->deleteJson("/api/v1/resumes/{$resume->id}")->assertNotFound();

        $this->assertDatabaseHas('resumes', [
            'id' => $resume->id,
            'name' => 'Grace Hopper',
        ]);
    }

    public function test_resume_input_is_validated(): void
    {
        $this->actingAs(User::factory()->create());

        $this->postJson('/api/v1/resumes', [
            'name' => '',
            'role' => 'Designer',
            'style' => 'not-a-template',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'style']);
    }

    public function test_put_requires_all_core_fields_while_patch_accepts_a_subset(): void
    {
        $user = User::factory()->create();
        $resume = $user->resumes()->create([
            'name' => 'Grace Hopper',
            'role' => 'Compiladora',
            'style' => 'modern',
        ]);

        $this->actingAs($user);

        $this->putJson("/api/v1/resumes/{$resume->id}", [
            'name' => 'Grace Murray Hopper',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role', 'style']);

        $this->patchJson("/api/v1/resumes/{$resume->id}", [
            'name' => 'Grace Murray Hopper',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Grace Murray Hopper')
            ->assertJsonPath('data.role', 'Compiladora')
            ->assertJsonPath('data.style', 'modern');

        $this->patchJson("/api/v1/resumes/{$resume->id}", ['style' => 'not-a-template'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['style']);

        $this->assertDatabaseHas('resumes', [
            'id' => $resume->id,
            'name' => 'Grace Murray Hopper',
            'role' => 'Compiladora',
            'style' => 'modern',
        ]);
    }

    public function test_resume_index_is_paginated_and_returns_only_summaries(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 25) as $index) {
            $user->resumes()->create([
                'name' => "Pessoa {$index}",
                'role' => 'Analista',
                'style' => 'classic',
            ]);
        }

        $otherUser = User::factory()->create();
        $otherUser->resumes()->create([
            'name' => 'Outra Pessoa',
            'role' => 'Designer',
            'style' => 'modern',
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/v1/resumes?per_page=10&page=2')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 25);

        $summary = $response->json('data.0');

        $this->assertSame(
            ['id', 'name', 'role', 'style', 'updated_at'],
            array_keys($summary),
        );
        $this->assertArrayNotHasKey('document', $summary);

        $this->getJson('/api/v1/resumes')
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.per_page', 20);

        $this->getJson('/api/v1/resumes?per_page=1000')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100);

        $this->getJson('/api/v1/resumes?per_page=0')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 1);
    }
}
