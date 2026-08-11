-- Bu SQL komutunu Supabase SQL Editor'de çalıştırarak expenses tablosuna telegram_message_id kolonunu ekleyin.

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS telegram_message_id TEXT UNIQUE;

-- Ayrıca, güvenlik kurallarında (RLS - Row Level Security) eğer sıkıntı çıkarsa 
-- bu kolon için özel bir ayar gerekmez, mevcut kurallar geçerli olur.
