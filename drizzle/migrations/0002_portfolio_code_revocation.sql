CREATE FUNCTION public.revoke_portfolio_download_code(_video_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.portfolio_videos v JOIN public.editor_profiles e ON e.id=v.editor_id WHERE v.id=_video_id AND e.user_id=auth.uid()) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
 DELETE FROM public.portfolio_download_codes WHERE video_id=_video_id;
END $$;
REVOKE ALL ON FUNCTION public.revoke_portfolio_download_code(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revoke_portfolio_download_code(uuid) TO authenticated;