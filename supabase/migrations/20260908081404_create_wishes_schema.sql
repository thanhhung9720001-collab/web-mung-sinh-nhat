-- The application accepts either a text wish or a video wish.
create type public.wish_content_type as enum ('text', 'video');

-- Every new submission must be moderated before it can appear in the gift.
create type public.wish_status as enum ('pending', 'approved', 'rejected');

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  avatar_path text,
  content_type public.wish_content_type not null,
  message_text text,
  video_path text,
  video_mime_type text,
  video_size_bytes bigint,
  video_duration_seconds numeric(6, 3),
  status public.wish_status not null default 'pending',
  display_order integer,
  consent_given_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,

  constraint wishes_sender_name_length_check
    check (char_length(btrim(sender_name)) between 1 and 80),
  constraint wishes_avatar_path_check
    check (
      avatar_path is null
      or char_length(btrim(avatar_path)) between 1 and 1024
    ),
  constraint wishes_display_order_check
    check (display_order is null or display_order >= 0),
  constraint wishes_content_check
    check (
      (
        content_type = 'text'
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
        and char_length(btrim(video_path)) between 1 and 1024
        and char_length(btrim(video_mime_type)) between 1 and 100
        and video_size_bytes between 1 and 31457280
        and video_duration_seconds > 0
        and video_duration_seconds <= 60
      )
    ),
  constraint wishes_review_state_check
    check (
      (status = 'pending' and reviewed_at is null)
      or
      (status in ('approved', 'rejected') and reviewed_at is not null)
    ),
  constraint wishes_reviewed_at_check
    check (reviewed_at is null or reviewed_at >= created_at)
);

comment on table public.wishes is
  'Private birthday wishes. All access is performed by trusted server-side code.';

comment on column public.wishes.avatar_path is
  'Object path in private storage, never a permanent public URL.';

comment on column public.wishes.video_path is
  'Object path in private storage, never a permanent public URL.';

comment on column public.wishes.display_order is
  'Optional zero-based position for approved wishes; null values sort last.';

comment on column public.wishes.consent_given_at is
  'Timestamp recording acceptance of the private-gift media consent notice.';

create index wishes_moderation_queue_idx
  on public.wishes (status, created_at);

create index wishes_gift_order_idx
  on public.wishes (display_order asc nulls last, created_at)
  where status = 'approved';

create function public.set_wishes_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_wishes_updated_at
before update on public.wishes
for each row
execute function public.set_wishes_updated_at();

-- This exposed-schema table is intentionally server-only. No browser-facing role
-- receives a policy or table grant; service_role bypasses RLS in trusted code.
alter table public.wishes enable row level security;

revoke all on table public.wishes from public, anon, authenticated;
revoke execute on function public.set_wishes_updated_at() from public, anon, authenticated;
