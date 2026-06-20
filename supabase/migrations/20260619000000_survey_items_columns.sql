-- Add columns missing from the initial migration
alter table survey_items add column if not exists sku  text;
alter table survey_items add column if not exists qty  integer default 0;
alter table survey_items add column if not exists oos  boolean default false;
