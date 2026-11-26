DROP POLICY IF EXISTS "Portfolio files readable" ON storage.objects;
CREATE POLICY "Owners read portfolio files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = (select auth.uid()::text));
CREATE TABLE public.portfolio_download_codes (
 video_id uuid PRIMARY KEY REFERENCES public.portfolio_videos(id) ON DELETE CASCADE,
 code_hash text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.portfolio_download_codes TO service_role;
ALTER TABLE public.portfolio_download_codes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.portfolio_download_attempts (
 user_id uuid PRIMARY KEY,
 window_start timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.portfolio_download_attempts TO service_role;
ALTER TABLE public.portfolio_download_attempts ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.set_portfolio_download_code(_video_id uuid, _code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_path text; v_owner uuid;
BEGIN
 SELECT v.video_path,e.user_id INTO v_path,v_owner FROM public.portfolio_videos v JOIN public.editor_profiles e ON e.id=v.editor_id WHERE v.id=_video_id;
 IF auth.uid() IS NULL OR v_owner IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
 IF _code IS NULL THEN DELETE FROM public.portfolio_download_codes WHERE video_id=_video_id; RETURN; END IF;
 IF length(_code)<8 OR length(_code)>64 OR _code !~ '[A-Za-z]' OR _code !~ '[0-9]' THEN RAISE EXCEPTION 'Le code doit contenir 8 à 64 caractères, une lettre et un chiffre'; END IF;
 IF v_path IS NULL OR split_part(v_path,'/',1) <> auth.uid()::text THEN RAISE EXCEPTION 'Une vidéo hébergée dans votre portfolio est requise'; END IF;
 INSERT INTO public.portfolio_download_codes(video_id,code_hash) VALUES(_video_id,extensions.crypt(_code,extensions.gen_salt('bf',10))) ON CONFLICT(video_id) DO UPDATE SET code_hash=EXCLUDED.code_hash,updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.set_portfolio_download_code(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_portfolio_download_code(uuid,text) TO authenticated;
CREATE FUNCTION public.authorize_portfolio_download(_video_id uuid, _code text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_attempts integer; v_path text; v_hash text; v_owner uuid;
BEGIN
 IF auth.uid() IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.portfolio_download_attempts(user_id,window_start,attempts) VALUES(auth.uid(),now(),1)
 ON CONFLICT(user_id) DO UPDATE SET attempts=CASE WHEN portfolio_download_attempts.window_start <= now()-interval '15 minutes' THEN 1 ELSE portfolio_download_attempts.attempts+1 END,window_start=CASE WHEN portfolio_download_attempts.window_start <= now()-interval '15 minutes' THEN now() ELSE portfolio_download_attempts.window_start END RETURNING attempts INTO v_attempts;
 IF v_attempts>5 OR _code IS NULL OR length(_code)>64 THEN RETURN NULL; END IF;
 SELECT v.video_path,c.code_hash,e.user_id INTO v_path,v_hash,v_owner FROM public.portfolio_videos v JOIN public.editor_profiles e ON e.id=v.editor_id JOIN public.portfolio_download_codes c ON c.video_id=v.id WHERE v.id=_video_id AND e.published;
 IF v_path IS NULL OR v_hash IS NULL OR split_part(v_path,'/',1) IS DISTINCT FROM v_owner::text THEN RETURN NULL; END IF;
 IF extensions.crypt(_code,v_hash) IS DISTINCT FROM v_hash THEN RETURN NULL; END IF;
 RETURN v_path;
END $$;
REVOKE ALL ON FUNCTION public.authorize_portfolio_download(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.authorize_portfolio_download(uuid,text) TO authenticated;