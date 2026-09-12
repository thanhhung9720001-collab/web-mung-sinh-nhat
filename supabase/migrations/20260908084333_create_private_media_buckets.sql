-- Separate buckets keep image and video validation independent. Both buckets are
-- private; trusted server-side code will upload objects and issue signed URLs.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'wish-avatars',
    'wish-avatars',
    false,
    5242880,
    array[
      'image/jpeg',
      'image/png',
      'image/webp'
    ]::text[]
  ),
  (
    'wish-videos',
    'wish-videos',
    false,
    31457280,
    array[
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]::text[]
  );

-- No storage.objects policies are created intentionally. Supabase Storage denies
-- browser-facing roles by default when no matching RLS policy exists.
