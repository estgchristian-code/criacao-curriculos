<?php

namespace App\Enums;

enum ResumeStyle: string
{
    case Editorial = 'editorial';
    case Classic = 'classic';
    case Modern = 'modern';
    case Minimal = 'minimal';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
