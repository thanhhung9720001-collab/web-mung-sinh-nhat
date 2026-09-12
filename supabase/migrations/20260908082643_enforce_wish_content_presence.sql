-- PostgreSQL check constraints accept null results. Make every field required by
-- the selected content type explicit so an incomplete submission cannot pass.
alter table public.wishes
  drop constraint wishes_content_check;

alter table public.wishes
  add constraint wishes_content_check
  check (
    (
      content_type = 'text'
      and message_text is not null
      and char_length(btrim(message_text)) between 1 and 5000
      and video_path is null
      and video_mime_type is null
      and video_size_bytes is null
      and video_duration_seconds is null
    )
    or
    (
      content_type = 'video'
      and message_text is null
      and video_path is not null
      and char_length(btrim(video_path)) between 1 and 1024
      and video_mime_type is not null
      and char_length(btrim(video_mime_type)) between 1 and 100
      and video_size_bytes is not null
      and video_size_bytes between 1 and 31457280
      and video_duration_seconds is not null
      and video_duration_seconds > 0
      and video_duration_seconds <= 60
    )
  );
