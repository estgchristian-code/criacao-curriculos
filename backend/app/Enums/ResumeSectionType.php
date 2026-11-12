<?php

namespace App\Enums;

/**
 * Supported resume section types.
 *
 * The value is persisted inside the resume document, so new cases may only be
 * added (never renamed) to keep previously stored documents renderable.
 */
enum ResumeSectionType: string
{
    case Summary = 'summary';
    case Experience = 'experience';
    case Education = 'education';
    case Skills = 'skills';
    case Languages = 'languages';
    case Certifications = 'certifications';
    case Courses = 'courses';
    case Projects = 'projects';
    case Awards = 'awards';
    case Volunteer = 'volunteer';
    case Publications = 'publications';
    case References = 'references';
    case Custom = 'custom';
}
