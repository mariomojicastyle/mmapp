-- Create products table
create table products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  price numeric,
  sku text,
  glb_file_url text,
  assembly_file_url text,
  assembly_steps jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table products enable row level security;

-- Create policies
create policy "Users can view their own products"
  on products for select
  using (auth.uid() = user_id);

create policy "Users can insert their own products"
  on products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own products"
  on products for update
  using (auth.uid() = user_id);

create policy "Users can delete their own products"
  on products for delete
  using (auth.uid() = user_id);

-- Create storage bucket for product assets if it doesn't exist
-- Note: You might need to create the bucket manually in the Supabase dashboard if this script fails due to permissions,
-- but typically buckets are created via dashboard. This SQL sets up policies assuming the bucket 'product-assets' exists.
insert into storage.buckets (id, name, public)
values ('product-assets', 'product-assets', true)
on conflict (id) do nothing;

-- Storage policies for product-assets
create policy "Authenticated users can upload product assets"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'product-assets' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Authenticated users can update product assets"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'product-assets' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Authenticated users can delete product assets"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'product-assets' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Anyone can view product assets"
  on storage.objects for select
  to public
  using ( bucket_id = 'product-assets' );
