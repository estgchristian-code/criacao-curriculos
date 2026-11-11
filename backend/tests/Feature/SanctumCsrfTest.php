<?php

namespace Tests\Feature;

use Tests\TestCase;

class SanctumCsrfTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Accept' => 'application/json',
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ]);
    }

    public function test_csrf_cookie_endpoint_starts_a_stateful_session_for_the_spa(): void
    {
        $response = $this->get('/sanctum/csrf-cookie');

        $response->assertNoContent();
        $response->assertCookie('XSRF-TOKEN');
        $response->assertCookie((string) config('session.cookie'));
    }

    public function test_xsrf_cookie_can_be_read_by_the_frontend_javascript(): void
    {
        $response = $this->get('/sanctum/csrf-cookie');

        $xsrfCookie = collect($response->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === 'XSRF-TOKEN');

        $this->assertNotNull($xsrfCookie);
        $this->assertFalse($xsrfCookie->isHttpOnly());
    }
}
