-- Official music and finale video are private gift assets. They are never
-- exposed through public object URLs; /gift issues short-lived signed URLs
-- only after validating the recipient session.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gift-assets',
  'gift-assets',
  false,
  52428800,
  array[
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
);

-- No storage.objects policy is created. Only trusted server-side requests can
-- upload objects or create signed URLs for this bucket.
