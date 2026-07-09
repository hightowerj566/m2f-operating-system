export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessment_category_scores: {
        Row: {
          assessment_id: string
          category_id: number
          score: number
        }
        Insert: {
          assessment_id: string
          category_id: number
          score: number
        }
        Update: {
          assessment_id?: string
          category_id?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_category_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_category_scores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "readiness_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_options: {
        Row: {
          id: string
          label: string
          points: number | null
          question_id: string
          routing_value: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          label: string
          points?: number | null
          question_id: string
          routing_value?: string | null
          sort_order: number
        }
        Update: {
          id?: string
          label?: string
          points?: number | null
          question_id?: string
          routing_value?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          category_id: number | null
          code: string
          id: string
          is_active: boolean
          kind: string
          prompt: string
          sort_order: number
        }
        Insert: {
          category_id?: number | null
          code: string
          id?: string
          is_active?: boolean
          kind: string
          prompt: string
          sort_order: number
        }
        Update: {
          category_id?: number | null
          code?: string
          id?: string
          is_active?: boolean
          kind?: string
          prompt?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "readiness_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          answers: Json
          id: string
          taken_at: string
          total_score: number
          user_id: string
          weeks_remaining: number | null
        }
        Insert: {
          answers?: Json
          id?: string
          taken_at?: string
          total_score: number
          user_id: string
          weeks_remaining?: number | null
        }
        Update: {
          answers?: Json
          id?: string
          taken_at?: string
          total_score?: number
          user_id?: string
          weeks_remaining?: number | null
        }
        Relationships: []
      }
      build_milestones: {
        Row: {
          category_id: number
          created_at: string
          detail: string | null
          id: string
          is_active: boolean
          phase: number
          points: number
          sort_order: number
          title: string
        }
        Insert: {
          category_id: number
          created_at?: string
          detail?: string | null
          id?: string
          is_active?: boolean
          phase: number
          points?: number
          sort_order?: number
          title: string
        }
        Update: {
          category_id?: number
          created_at?: string
          detail?: string | null
          id?: string
          is_active?: boolean
          phase?: number
          points?: number
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_milestones_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "readiness_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_feedback: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          rating: number
          reason: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          rating: number
          reason: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          rating?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      cohort_posts: {
        Row: {
          cohort_month: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cohort_month: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cohort_month?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          actual_calories: number | null
          actual_carbs_g: number | null
          actual_fat_g: number | null
          actual_protein_g: number | null
          check_date: string
          compliance: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          actual_calories?: number | null
          actual_carbs_g?: number | null
          actual_fat_g?: number | null
          actual_protein_g?: number | null
          check_date?: string
          compliance: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          actual_calories?: number | null
          actual_carbs_g?: number | null
          actual_fat_g?: number | null
          actual_protein_g?: number | null
          check_date?: string
          compliance?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_standards: {
        Row: {
          completions: Json
          created_at: string
          family_time: boolean
          hydration_hit: boolean
          id: string
          no_phone_at_dinner: boolean
          protein_hit: boolean
          scripture_read: boolean
          standard_date: string
          steps_hit: boolean
          updated_at: string
          user_id: string
          wake_on_time: boolean
          workout_completed: boolean
        }
        Insert: {
          completions?: Json
          created_at?: string
          family_time?: boolean
          hydration_hit?: boolean
          id?: string
          no_phone_at_dinner?: boolean
          protein_hit?: boolean
          scripture_read?: boolean
          standard_date?: string
          steps_hit?: boolean
          updated_at?: string
          user_id: string
          wake_on_time?: boolean
          workout_completed?: boolean
        }
        Update: {
          completions?: Json
          created_at?: string
          family_time?: boolean
          hydration_hit?: boolean
          id?: string
          no_phone_at_dinner?: boolean
          protein_hit?: boolean
          scripture_read?: boolean
          standard_date?: string
          steps_hit?: boolean
          updated_at?: string
          user_id?: string
          wake_on_time?: boolean
          workout_completed?: boolean
        }
        Relationships: []
      }
      daily_weights: {
        Row: {
          created_at: string
          id: string
          user_id: string
          weigh_date: string
          weight_lbs: number
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          weigh_date?: string
          weight_lbs: number
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          weigh_date?: string
          weight_lbs?: number
        }
        Relationships: []
      }
      due_date_passes: {
        Row: {
          expires_at: string
          id: string
          purchased_at: string
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          purchased_at?: string
          stripe_session_id: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          purchased_at?: string
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      father_athlete_leads: {
        Row: {
          archetype_type: string
          category_scores: Json | null
          created_at: string
          due_date: string | null
          email: string
          id: string
          name: string
          phone: string
          quiz_answers: Json
          source: string
          total_score: number | null
          weakest_category: string | null
        }
        Insert: {
          archetype_type: string
          category_scores?: Json | null
          created_at?: string
          due_date?: string | null
          email: string
          id?: string
          name: string
          phone: string
          quiz_answers?: Json
          source?: string
          total_score?: number | null
          weakest_category?: string | null
        }
        Update: {
          archetype_type?: string
          category_scores?: Json | null
          created_at?: string
          due_date?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
          quiz_answers?: Json
          source?: string
          total_score?: number | null
          weakest_category?: string | null
        }
        Relationships: []
      }
      learn_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_viewed_at: string
          lesson_slug: string
          saved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          lesson_slug: string
          saved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          lesson_slug?: string
          saved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      macro_adjustments: {
        Row: {
          actual_rate_lb_per_week: number
          applied_calories: number | null
          applied_carbs_g: number | null
          applied_fat_g: number | null
          applied_protein_g: number | null
          avg_daily_calories: number
          coach_id: string | null
          compliance_pct: number
          created_at: string
          current_carbs_g: number
          current_fat_g: number
          current_protein_g: number
          days_tracked: number
          defer_reason: string | null
          energy_error_kcal_day: number
          energy_error_kcal_week: number
          explanation: string | null
          goal_rate_lb_per_week: number
          id: string
          last_week_avg_weight: number
          rate_error_g: number
          rate_error_lb: number
          resolved_at: string | null
          status: string
          suggested_calorie_change: number
          suggested_calories: number
          suggested_carbs_g: number
          suggested_fat_g: number
          suggested_protein_g: number
          this_week_avg_weight: number
          user_id: string
        }
        Insert: {
          actual_rate_lb_per_week: number
          applied_calories?: number | null
          applied_carbs_g?: number | null
          applied_fat_g?: number | null
          applied_protein_g?: number | null
          avg_daily_calories: number
          coach_id?: string | null
          compliance_pct?: number
          created_at?: string
          current_carbs_g: number
          current_fat_g: number
          current_protein_g: number
          days_tracked?: number
          defer_reason?: string | null
          energy_error_kcal_day: number
          energy_error_kcal_week: number
          explanation?: string | null
          goal_rate_lb_per_week: number
          id?: string
          last_week_avg_weight: number
          rate_error_g: number
          rate_error_lb: number
          resolved_at?: string | null
          status?: string
          suggested_calorie_change: number
          suggested_calories: number
          suggested_carbs_g: number
          suggested_fat_g: number
          suggested_protein_g: number
          this_week_avg_weight: number
          user_id: string
        }
        Update: {
          actual_rate_lb_per_week?: number
          applied_calories?: number | null
          applied_carbs_g?: number | null
          applied_fat_g?: number | null
          applied_protein_g?: number | null
          avg_daily_calories?: number
          coach_id?: string | null
          compliance_pct?: number
          created_at?: string
          current_carbs_g?: number
          current_fat_g?: number
          current_protein_g?: number
          days_tracked?: number
          defer_reason?: string | null
          energy_error_kcal_day?: number
          energy_error_kcal_week?: number
          explanation?: string | null
          goal_rate_lb_per_week?: number
          id?: string
          last_week_avg_weight?: number
          rate_error_g?: number
          rate_error_lb?: number
          resolved_at?: string | null
          status?: string
          suggested_calorie_change?: number
          suggested_calories?: number
          suggested_carbs_g?: number
          suggested_fat_g?: number
          suggested_protein_g?: number
          this_week_avg_weight?: number
          user_id?: string
        }
        Relationships: []
      }
      macro_targets: {
        Row: {
          calories: number
          carbs_g: number
          fat_g: number
          id: string
          protein_g: number
          set_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          fat_g?: number
          id?: string
          protein_g?: number
          set_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          fat_g?: number
          id?: string
          protein_g?: number
          set_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      max_history: {
        Row: {
          exercise_name: string
          id: string
          recorded_at: string
          user_id: string
          weight_lbs: number
        }
        Insert: {
          exercise_name: string
          id?: string
          recorded_at?: string
          user_id: string
          weight_lbs: number
        }
        Update: {
          exercise_name?: string
          id?: string
          recorded_at?: string
          user_id?: string
          weight_lbs?: number
        }
        Relationships: []
      }
      missions: {
        Row: {
          category_id: number
          created_at: string
          difficulty: number
          directive: string
          id: string
          is_active: boolean
          proof_hint: string | null
          sort_order: number
          title: string
        }
        Insert: {
          category_id: number
          created_at?: string
          difficulty?: number
          directive: string
          id?: string
          is_active?: boolean
          proof_hint?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          category_id?: number
          created_at?: string
          difficulty?: number
          directive?: string
          id?: string
          is_active?: boolean
          proof_hint?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "readiness_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avg_daily_steps: number | null
          baby_arrived_at: string | null
          baby_name: string | null
          biggest_fear: string | null
          body_composition_category: string | null
          body_fat_pct: number | null
          conditioning_level: string | null
          created_at: string
          display_name: string | null
          due_date: string | null
          equipment_access: string | null
          faith_practicing: boolean | null
          first_child: boolean | null
          goal: string | null
          goal_rate_lb_per_week: number | null
          gym_access: string | null
          height_inches: number | null
          id: string
          job_type: string | null
          journey: string | null
          last_assessment_id: string | null
          onboarding_complete: boolean
          partner_name: string | null
          session_length_min: number | null
          sex: string | null
          training_days: number | null
          training_days_per_week: number | null
          training_experience: string | null
          training_profile_complete: boolean
          updated_at: string
          user_id: string
          weekly_checkin_day: number | null
          weight_lbs: number | null
        }
        Insert: {
          age?: number | null
          avg_daily_steps?: number | null
          baby_arrived_at?: string | null
          baby_name?: string | null
          biggest_fear?: string | null
          body_composition_category?: string | null
          body_fat_pct?: number | null
          conditioning_level?: string | null
          created_at?: string
          display_name?: string | null
          due_date?: string | null
          equipment_access?: string | null
          faith_practicing?: boolean | null
          first_child?: boolean | null
          goal?: string | null
          goal_rate_lb_per_week?: number | null
          gym_access?: string | null
          height_inches?: number | null
          id?: string
          job_type?: string | null
          journey?: string | null
          last_assessment_id?: string | null
          onboarding_complete?: boolean
          partner_name?: string | null
          session_length_min?: number | null
          sex?: string | null
          training_days?: number | null
          training_days_per_week?: number | null
          training_experience?: string | null
          training_profile_complete?: boolean
          updated_at?: string
          user_id: string
          weekly_checkin_day?: number | null
          weight_lbs?: number | null
        }
        Update: {
          age?: number | null
          avg_daily_steps?: number | null
          baby_arrived_at?: string | null
          baby_name?: string | null
          biggest_fear?: string | null
          body_composition_category?: string | null
          body_fat_pct?: number | null
          conditioning_level?: string | null
          created_at?: string
          display_name?: string | null
          due_date?: string | null
          equipment_access?: string | null
          faith_practicing?: boolean | null
          first_child?: boolean | null
          goal?: string | null
          goal_rate_lb_per_week?: number | null
          gym_access?: string | null
          height_inches?: number | null
          id?: string
          job_type?: string | null
          journey?: string | null
          last_assessment_id?: string | null
          onboarding_complete?: boolean
          partner_name?: string | null
          session_length_min?: number | null
          sex?: string | null
          training_days?: number | null
          training_days_per_week?: number | null
          training_experience?: string | null
          training_profile_complete?: boolean
          updated_at?: string
          user_id?: string
          weekly_checkin_day?: number | null
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_assessment_id_fkey"
            columns: ["last_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      program_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          current_day: number
          id: string
          is_active: boolean
          program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          current_day?: number
          id?: string
          is_active?: boolean
          program_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          current_day?: number
          id?: string
          is_active?: boolean
          program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_days: {
        Row: {
          created_at: string
          day_number: number
          exercises: Json
          id: string
          label: string | null
          program_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          exercises?: Json
          id?: string
          label?: string | null
          program_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          exercises?: Json
          id?: string
          label?: string | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          published_through_day: number | null
          total_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_published?: boolean
          name: string
          published_through_day?: number | null
          total_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          published_through_day?: number | null
          total_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      readiness_categories: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      standard_definitions: {
        Row: {
          created_at: string
          created_by: string
          emoji: string
          id: string
          is_active: boolean
          is_global: boolean
          key: string
          label: string
          sort_order: number
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          emoji?: string
          id?: string
          is_active?: boolean
          is_global?: boolean
          key: string
          label: string
          sort_order?: number
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          emoji?: string
          id?: string
          is_active?: boolean
          is_global?: boolean
          key?: string
          label?: string
          sort_order?: number
          target_user_id?: string | null
        }
        Relationships: []
      }
      subscription_settings: {
        Row: {
          amount_cents: number
          coach_id: string
          id: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          coach_id: string
          id?: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          coach_id?: string
          id?: string
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_exercise_swaps: {
        Row: {
          created_at: string
          day_number: number | null
          id: string
          original_exercise: string
          program_id: string | null
          replacement_detail: string
          replacement_name: string
          scope: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_number?: number | null
          id?: string
          original_exercise: string
          program_id?: string | null
          replacement_detail?: string
          replacement_name: string
          scope?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_number?: number | null
          id?: string
          original_exercise?: string
          program_id?: string | null
          replacement_detail?: string
          replacement_name?: string
          scope?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_swaps_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_maxes: {
        Row: {
          exercise_name: string
          id: string
          updated_at: string
          user_id: string
          weight_lbs: number
        }
        Insert: {
          exercise_name: string
          id?: string
          updated_at?: string
          user_id: string
          weight_lbs: number
        }
        Update: {
          exercise_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          weight_lbs?: number
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          completed_at: string
          milestone_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          milestone_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          milestone_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "build_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          note: string | null
          status: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          note?: string | null
          status?: string
          user_id: string
          week_start: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          note?: string | null
          status?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_standard_prefs: {
        Row: {
          enabled: boolean
          standard_definition_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          standard_definition_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          standard_definition_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_standard_prefs_standard_definition_id_fkey"
            columns: ["standard_definition_id"]
            isOneToOne: false
            referencedRelation: "standard_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          current_period_end: string | null
          id: string
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_feedback: {
        Row: {
          created_at: string
          day_number: number
          difficulty: string
          id: string
          phase: number
          program_id: string
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          day_number: number
          difficulty: string
          id?: string
          phase: number
          program_id: string
          user_id: string
          workout_date?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          difficulty?: string
          id?: string
          phase?: number
          program_id?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_feedback_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          notes: string | null
          sets: Json
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          notes?: string | null
          sets?: Json
          user_id: string
          workout_date?: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          sets?: Json
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
      workout_programs: {
        Row: {
          block: string | null
          created_at: string
          day: string | null
          exercise: string
          id: string
          notes: string | null
          phase: string | null
          program_id: string | null
          program_name: string
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          tempo: string | null
          user_id: string
          week: number | null
        }
        Insert: {
          block?: string | null
          created_at?: string
          day?: string | null
          exercise: string
          id?: string
          notes?: string | null
          phase?: string | null
          program_id?: string | null
          program_name: string
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          tempo?: string | null
          user_id: string
          week?: number | null
        }
        Update: {
          block?: string | null
          created_at?: string
          day?: string | null
          exercise?: string
          id?: string
          notes?: string | null
          phase?: string | null
          program_id?: string | null
          program_name?: string
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          tempo?: string | null
          user_id?: string
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      year_one_waitlist: {
        Row: {
          email: string
          joined_at: string
          user_id: string
        }
        Insert: {
          email: string
          joined_at?: string
          user_id: string
        }
        Update: {
          email?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "coach" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coach", "user"],
    },
  },
} as const
