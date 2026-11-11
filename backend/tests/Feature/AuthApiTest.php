<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ]);
    }

    public function test_registration_validates_input_hashes_password_and_starts_a_session(): void
    {
        $this->postJson('/api/v1/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ADA@example.com',
            'password' => 'secure-password-123',
            'password_confirmation' => 'secure-password-123',
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Ada Lovelace')
            ->assertJsonPath('data.email', 'ada@example.com')
            ->assertJsonMissingPath('data.password');

        $user = User::query()->where('email', 'ada@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('secure-password-123', $user->password));
        $this->getJson('/api/v1/user')->assertOk()->assertJsonPath('data.name', 'Ada Lovelace');
    }

    public function test_registration_rejects_invalid_fields_and_duplicate_emails(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        $this->assertStringContainsString('O campo nome', $response->json('errors.name.0'));

        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/register', [
            'name' => 'Another User',
            'email' => 'TAKEN@example.com',
            'password' => 'secure-password-123',
            'password_confirmation' => 'secure-password-123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_authenticates_valid_credentials_and_preserves_session_across_requests(): void
    {
        $user = User::factory()->create([
            'email' => 'ada@example.com',
            'password' => 'secure-password-123',
        ]);

        $this->postJson('/api/v1/login', [
            'email' => 'ADA@example.com',
            'password' => 'secure-password-123',
        ])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->getJson('/api/v1/user')
            ->assertOk()
            ->assertJsonPath('data.email', 'ada@example.com');

        $this->getJson('/api/v1/resumes')->assertOk();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'ada@example.com',
            'password' => 'secure-password-123',
        ]);

        $this->postJson('/api/v1/login', [
            'email' => 'ada@example.com',
            'password' => 'incorrect-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_logout_invalidates_the_authenticated_session(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.com',
            'password' => 'secure-password-123',
        ]);
        $this->postJson('/api/v1/login', [
            'email' => 'logout@example.com',
            'password' => 'secure-password-123',
        ])->assertOk();

        $this->postJson('/api/v1/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout realizado com sucesso.');

        $this->getJson('/api/v1/user')->assertUnauthorized();
        $this->getJson('/api/v1/resumes')->assertUnauthorized();
    }

    public function test_account_and_resume_routes_require_authentication(): void
    {
        $this->getJson('/api/v1/user')->assertUnauthorized();
        $this->getJson('/api/v1/resumes')->assertUnauthorized();
        $this->postJson('/api/v1/resumes', [
            'name' => 'Ada',
            'role' => 'Designer',
            'style' => 'classic',
        ])->assertUnauthorized();
    }
}
