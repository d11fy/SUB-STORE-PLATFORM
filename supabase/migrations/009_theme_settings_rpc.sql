-- ============================================================
-- Saba Store — Migration 009: Theme Settings Atomic RPC
-- ============================================================

-- 1. Create update_theme_settings_jsonb RPC function for deep path updates (e.g. AI content save)
CREATE OR REPLACE FUNCTION public.update_theme_settings_jsonb(
  p_store_id UUID,
  p_path TEXT[],
  p_value JSONB
)
RETURNS VOID AS $$
DECLARE
  v_settings JSONB;
  i INT;
  v_temp_path TEXT[];
BEGIN
  -- Get existing settings or insert if not exists
  SELECT COALESCE(settings, '{}'::jsonb) INTO v_settings
  FROM public.store_theme_settings
  WHERE store_id = p_store_id;

  IF NOT FOUND THEN
    INSERT INTO public.store_theme_settings (store_id, theme_id, settings)
    SELECT id, current_theme_id, '{}'::jsonb
    FROM public.stores
    WHERE id = p_store_id
    ON CONFLICT (store_id) DO NOTHING;
    
    v_settings := '{}'::jsonb;
  END IF;

  -- Ensure all parent objects in path exist
  IF array_length(p_path, 1) > 1 THEN
    FOR i IN 1 .. (array_length(p_path, 1) - 1) LOOP
      v_temp_path := p_path[1:i];
      IF v_settings #> v_temp_path IS NULL OR jsonb_typeof(v_settings #> v_temp_path) != 'object' THEN
        v_settings := jsonb_set(v_settings, v_temp_path, '{}'::jsonb, true);
      END IF;
    END LOOP;
  END IF;

  -- Set value at path
  v_settings := jsonb_set(v_settings, p_path, p_value, true);

  -- Also set draft_saved_at if we are updating draft_config
  IF p_path[1] = 'draft_config' THEN
    v_settings := jsonb_set(v_settings, '{draft_saved_at}', to_jsonb(to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')), true);
  END IF;

  -- Save back
  UPDATE public.store_theme_settings
  SET settings = v_settings,
      updated_at = NOW()
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create merge_theme_settings RPC function for root-level atomic merges with key deletion support
CREATE OR REPLACE FUNCTION public.merge_theme_settings(
  p_store_id UUID,
  p_settings JSONB
)
RETURNS VOID AS $$
DECLARE
  v_settings JSONB;
  v_key TEXT;
  v_val JSONB;
BEGIN
  -- Get existing settings or insert if not exists
  SELECT COALESCE(settings, '{}'::jsonb) INTO v_settings
  FROM public.store_theme_settings
  WHERE store_id = p_store_id;

  IF NOT FOUND THEN
    INSERT INTO public.store_theme_settings (store_id, theme_id, settings)
    SELECT id, current_theme_id, '{}'::jsonb
    FROM public.stores
    WHERE id = p_store_id
    ON CONFLICT (store_id) DO NOTHING;
    
    v_settings := '{}'::jsonb;
  END IF;

  -- Loop through settings keys and merge or delete if null
  FOR v_key, v_val IN SELECT * FROM jsonb_each(p_settings) LOOP
    IF v_val IS NULL OR jsonb_typeof(v_val) = 'null' THEN
      v_settings := v_settings - v_key;
    ELSE
      v_settings := jsonb_set(v_settings, ARRAY[v_key], v_val, true);
    END IF;
  END LOOP;

  -- Save back
  UPDATE public.store_theme_settings
  SET settings = v_settings,
      updated_at = NOW()
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
