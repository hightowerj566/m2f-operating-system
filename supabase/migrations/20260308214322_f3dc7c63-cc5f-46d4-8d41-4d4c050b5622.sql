
-- Seed 2 weeks of daily weights for Jason Hightower (user_id: c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad)
-- Last week: ~166 lbs, This week: ~164.5 lbs (losing ~1.5 lb/week on fat_loss)
INSERT INTO daily_weights (user_id, weigh_date, weight_lbs) VALUES
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-02-23', 167.2),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-02-24', 166.8),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-02-25', 166.5),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-02-26', 166.0),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-02-27', 165.8),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-02-28', 166.2),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-01', 165.5),
  -- This week
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-02', 165.0),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-03', 164.6),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-04', 164.8),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-05', 164.2),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-06', 164.0),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-07', 164.4),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-08', 164.5)
ON CONFLICT DO NOTHING;

-- Seed daily check-ins for this week
INSERT INTO daily_check_ins (user_id, check_date, compliance, actual_calories, actual_protein_g, actual_carbs_g, actual_fat_g) VALUES
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-02', 'at', 1950, 175, 200, 58),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-03', 'at', 1975, 180, 195, 60),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-04', 'below', 1800, 170, 180, 52),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-05', 'at', 1960, 178, 198, 59),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-06', 'above', 2200, 175, 240, 70),
  ('c19b7b7b-90b0-4b5b-8c01-c82984d6c4ad', '2026-03-07', 'at', 1940, 176, 196, 58)
ON CONFLICT DO NOTHING;
