-- Sorteios
create table public.sorteios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  quantidade_numeros int not null default 30,
  preco_centavos int not null default 500,
  data_sorteio date,
  ativo boolean not null default true,
  created_at timestamptz default now()
);

-- Participantes
create table public.participantes (
  id uuid primary key default gen_random_uuid(),
  sorteio_id uuid references public.sorteios(id) on delete cascade,
  numeros text not null,
  nome text not null,
  telefone text not null,
  email text not null,
  cpf text,
  total_reais text,
  checkout_id text,
  created_at timestamptz default now()
);

-- Números vendidos por sorteio
create table public.numeros_vendidos (
  id uuid primary key default gen_random_uuid(),
  sorteio_id uuid references public.sorteios(id) on delete cascade,
  numero int not null,
  participante_id uuid references public.participantes(id),
  created_at timestamptz default now(),
  unique(sorteio_id, numero)
);

-- Acesso público para leitura de sorteios ativos e números vendidos
alter table public.sorteios enable row level security;
alter table public.participantes enable row level security;
alter table public.numeros_vendidos enable row level security;

create policy "sorteios publicos" on public.sorteios for select using (true);
create policy "numeros publicos" on public.numeros_vendidos for select using (true);
create policy "inserir participantes" on public.participantes for insert with check (true);
create policy "inserir numeros" on public.numeros_vendidos for insert with check (true);
create policy "admin tudo participantes" on public.participantes for all using (auth.role() = 'authenticated');
create policy "admin tudo numeros" on public.numeros_vendidos for all using (auth.role() = 'authenticated');
create policy "admin tudo sorteios" on public.sorteios for all using (auth.role() = 'authenticated');
