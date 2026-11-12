<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the versioned resume document as a nullable JSON column.
 *
 * Impact: existing rows remain valid (NULL means "no structured document yet"),
 * so no backfill is required. MySQL 8.4 adds the nullable column in place.
 * The column is intentionally not indexed because it is never queried by value.
 *
 * `down()` drops the column and permanently discards every stored document, so
 * a rollback must be planned together with a backup.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resumes', function (Blueprint $table) {
            $table->json('document')->nullable()->after('style');
        });
    }

    public function down(): void
    {
        Schema::table('resumes', function (Blueprint $table) {
            $table->dropColumn('document');
        });
    }
};
