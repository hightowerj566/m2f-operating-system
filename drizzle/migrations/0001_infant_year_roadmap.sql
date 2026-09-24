ALTER TABLE public.build_milestones DROP CONSTRAINT build_milestones_phase_check;
ALTER TABLE public.build_milestones ADD CONSTRAINT build_milestones_phase_check CHECK ((phase BETWEEN 1 AND 6) OR (phase BETWEEN 11 AND 14));

UPDATE public.build_milestones SET is_active = false WHERE phase = 6;

INSERT INTO public.build_milestones (category_id, phase, title, detail, why_it_matters, points, priority, required, recommended_week, est_minutes, sort_order, is_active) VALUES
-- SURVIVAL (0–6 wks)
(3,11,'Add baby to your health insurance','Most plans give you 30 days from birth.','Miss the window and you may wait until open enrollment.',2,'critical',true,1,20,1,true),
(3,11,'Get the birth certificate and Social Security number started','Usually filed at the hospital — confirm it went through.','You need both for insurance, taxes, and benefits.',2,'critical',true,1,15,2,true),
(3,11,'Attend the first pediatrician visit','Typically 3–5 days after birth. Bring your questions.','Weight and jaundice checks happen here.',2,'critical',true,1,60,3,true),
(5,11,'Set a night-shift plan with her','Split nights so each of you gets one 4–5 hour block.','Protected sleep is what keeps you both functional.',2,'critical',true,1,15,4,true),
(5,11,'Set and enforce the visitor plan','Who comes, when, how long. You deliver the message.','Her recovery comes before anyone''s visit.',2,'standard',true,1,10,5,true),
(5,11,'Learn the warning signs of postpartum depression','Know them for her and for you.','Early help changes everything.',2,'critical',true,2,15,6,true),
(4,11,'Stock a two-week supply of meals and diapers','Freezer meals, grocery delivery, diapers in the next size up.','Removes the daily scramble.',1,'standard',true,2,45,7,true),
(5,11,'Go with her to her 6-week checkup','Drive, hold the baby, take notes.','She''s cleared to start recovering — be part of that.',2,'standard',true,6,90,8,true),
(1,11,'Walk 20 minutes a day for 7 days','With the stroller counts.','Keeps you sane and your body moving.',1,'bonus',false,3,20,9,true),
-- FOUNDATION (6–12 wks)
(7,12,'Start a simple bedtime routine','Bath, feed, book, bed — same order every night.','Babies sleep better with predictable cues.',2,'critical',true,7,20,1,true),
(3,12,'Keep the 2-month checkup and shots','Book it now if you haven''t.','First round of vaccines happens here.',2,'critical',true,8,60,2,true),
(6,12,'Plan childcare for return to work','Daycare, family, or nanny — decided and confirmed.','Waiting lists are long.',2,'critical',true,7,60,3,true),
(5,12,'Hold your first date night at home','Baby asleep, phones down, one hour.','You''re still a couple first.',2,'standard',true,9,60,4,true),
(1,12,'Get back to 3 workouts a week','Structured training returns. Short is fine.','You need energy for a year of this.',2,'standard',true,8,45,5,true),
(4,12,'Set up a weekly house reset','One hour on the weekend: laundry, groceries, meal plan.','Systems beat willpower.',1,'standard',true,10,60,6,true),
(3,12,'Take an infant CPR refresher','Online or in person.','Babies get more active every week.',1,'bonus',false,10,60,7,true),
-- RHYTHM (3–6 mos)
(6,13,'Update your will and name a guardian','Name who raises your child if both of you are gone.','Without one, a court decides.',3,'critical',true,13,60,1,true),
(6,13,'Get term life insurance','10–12x your income is a common target.','Protects them if you''re not here.',3,'critical',true,14,45,2,true),
(3,13,'Keep the 4-month checkup and shots','Ask about sleep and rolling.','Next round of vaccines.',2,'critical',true,17,60,3,true),
(5,13,'Start a weekly check-in with her','20 minutes, phones down: how are we doing?','Small problems stay small.',2,'standard',true,14,20,4,true),
(6,13,'Open a college savings account','Even $25 a month adds up over 18 years.','Time is the biggest factor.',1,'standard',true,18,30,5,true),
(7,13,'Read to the baby every day for 2 weeks','Any book, 10 minutes.','Your voice builds their language.',1,'standard',true,16,10,6,true),
(3,13,'Keep the 6-month checkup and shots','Ask about starting solid foods.','Plan the next stage with your pediatrician.',2,'critical',true,26,60,7,true),
-- GROWTH (6–12 mos)
(4,14,'Baby-proof the house','Outlet covers, cabinet locks, anchor furniture, stair gates.','Crawling starts fast.',3,'critical',true,27,120,1,true),
(3,14,'Start solid foods together','Follow your pediatrician''s plan. Introduce common allergens early as advised.','Feeding becomes a family routine.',2,'standard',true,26,30,2,true),
(3,14,'Keep the 9-month checkup','Ask about development milestones.','Catch anything early.',2,'critical',true,39,60,3,true),
(5,14,'Plan a night out without the baby','Book the sitter.','She needs to know you still pursue her.',2,'standard',true,32,180,4,true),
(7,14,'Start one family tradition','Weekly walk, Sunday breakfast, bedtime prayer.','Traditions become their memories.',1,'standard',true,36,30,5,true),
(1,14,'Hit 12 weeks of consistent training','3+ workouts a week for 12 straight weeks.','Carry them strong for years.',2,'standard',true,40,45,6,true),
(3,14,'Plan the 12-month checkup and first birthday','Book the visit, keep the party small.','Close out year one on purpose.',1,'bonus',false,50,30,7,true);