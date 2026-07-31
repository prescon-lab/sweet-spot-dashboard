-- Enable Realtime for app_data so that CloudSync receives changes instantly
ALTER PUBLICATION supabase_realtime ADD TABLE app_data;
