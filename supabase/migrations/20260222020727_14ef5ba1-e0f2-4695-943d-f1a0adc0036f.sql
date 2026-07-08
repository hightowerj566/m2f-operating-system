
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('coach', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  height_inches NUMERIC,
  weight_lbs NUMERIC,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  goal TEXT CHECK (goal IN ('muscle_gain', 'fat_loss', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User maxes (1RM)
CREATE TABLE public.user_maxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  weight_lbs NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_name)
);
ALTER TABLE public.user_maxes ENABLE ROW LEVEL SECURITY;

-- Workout logs (exercise history)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]',
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Macro targets
CREATE TABLE public.macro_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  calories INTEGER NOT NULL DEFAULT 2000,
  protein_g INTEGER NOT NULL DEFAULT 150,
  carbs_g INTEGER NOT NULL DEFAULT 250,
  fat_g INTEGER NOT NULL DEFAULT 65,
  set_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.macro_targets ENABLE ROW LEVEL SECURITY;

-- Daily weight entries
CREATE TABLE public.daily_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_lbs NUMERIC NOT NULL,
  weigh_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, weigh_date)
);
ALTER TABLE public.daily_weights ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_maxes_updated_at BEFORE UPDATE ON public.user_maxes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_macro_targets_updated_at BEFORE UPDATE ON public.macro_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- user_roles: users see own, coaches see their clients
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users cannot modify roles" ON public.user_roles FOR INSERT WITH CHECK (false);

-- profiles: own profile CRUD, coaches can view clients
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'coach'));

-- user_maxes: own data
CREATE POLICY "Users can view own maxes" ON public.user_maxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own maxes" ON public.user_maxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own maxes" ON public.user_maxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own maxes" ON public.user_maxes FOR DELETE USING (auth.uid() = user_id);

-- workout_logs: own data
CREATE POLICY "Users can view own logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- macro_targets: own data, coaches can update
CREATE POLICY "Users can view own targets" ON public.macro_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own targets" ON public.macro_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own targets" ON public.macro_targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can update client targets" ON public.macro_targets FOR UPDATE USING (public.has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches can view client targets" ON public.macro_targets FOR SELECT USING (public.has_role(auth.uid(), 'coach'));

-- daily_weights: own data
CREATE POLICY "Users can view own weights" ON public.daily_weights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weights" ON public.daily_weights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weights" ON public.daily_weights FOR UPDATE USING (auth.uid() = user_id);
