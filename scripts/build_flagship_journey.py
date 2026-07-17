#!/usr/bin/env python3
"""Build src/data/m2f_flagship_journey.json — the day-based flagship engine.

Every integer 1..252 is one program day. Weekday templates map source
training workouts (from m2f_training_programs.json, keyed by preg week + day
index 1..5) into training days; other weekdays become active-recovery,
mobility, optional-training, or rest days per the M2F stage spec.
"""
import json
from pathlib import Path

SRC = Path("src/data/m2f_training_programs.json")
OUT = Path("src/data/m2f_flagship_journey.json")

data = json.loads(SRC.read_text())
pre = data["programs"]["preBirth"]
post = data["programs"]["postBirth"]

# preg week -> {day_index: workout}
by_week = {}
for prog in pre:
    for w in prog["workouts"]:
        by_week.setdefault(w["week"], {})[w["day"]] = w

STAGES = [
    # id, name, program_day_start, program_day_end, preg_week_start, preg_week_end
    ("prebirth-foundation", "Foundation", 1, 70, 4, 13),
    ("prebirth-framing", "Framing", 71, 133, 14, 22),
    ("prebirth-durability", "Durability", 134, 196, 23, 31),
    ("prebirth-staging", "Staging", 197, 224, 32, 35),
    ("prebirth-mission-mode", "Mission Mode", 225, 252, 36, 39),
]

POST_STAGES = [
    ("postbirth-survival", "New Dad Survival", 1, 35),
    ("postbirth-foundation", "New Dad Foundation", 36, 84),
    ("postbirth-father-athlete", "Father Athlete", 85, None),
]

# Weekday templates by stage: list of 7 dicts, one per weekday (1..7 = Mon..Sun)
# each entry has: "kind" and optionally "src_day" (index into by_week[preg_week])
FOUNDATION_TPL = [
    {"kind": "training", "src_day": 1, "title_hint": "Upper A"},
    {"kind": "training", "src_day": 2, "title_hint": "Lower A"},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 3, "title_hint": "Upper B"},
    {"kind": "training", "src_day": 4, "title_hint": "Lower B"},
    {"kind": "training", "src_day": 5, "title_hint": "Pump & Athletic"},
    {"kind": "rest"},
]
FRAMING_TPL = [
    {"kind": "training", "src_day": 1, "title_hint": "Upper Strength"},
    {"kind": "training", "src_day": 2, "title_hint": "Lower Strength"},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 3, "title_hint": "Upper Strength + Grip"},
    {"kind": "training", "src_day": 4, "title_hint": "Lower Strength + Carries"},
    {"kind": "training", "src_day": 5, "title_hint": "Upper Pump + Athletic"},
    {"kind": "rest"},
]
DURABILITY_TPL = [
    {"kind": "training", "src_day": 1, "title_hint": "Upper Strength"},
    {"kind": "training", "src_day": 2, "title_hint": "Lower Strength"},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 3, "title_hint": "Upper Durability"},
    {"kind": "training", "src_day": 4, "title_hint": "Lower Durability"},
    {"kind": "optional-training", "title_hint": "Zone 2 + Core"},
    {"kind": "rest"},
]
STAGING_TPL = [
    {"kind": "training", "src_day": 1, "title_hint": "Full Body A"},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 2, "title_hint": "Full Body B"},
    {"kind": "mobility"},
    {"kind": "training", "src_day": 3, "title_hint": "Full Body C"},
    {"kind": "training", "src_day": 4, "title_hint": "Short Pump + Carries"},
    {"kind": "rest"},
]
MISSION_TPL = [
    {"kind": "training", "src_day": 1, "title_hint": "Full Body A"},
    {"kind": "rest", "title_hint": "Rest or Walk"},
    {"kind": "training", "src_day": 2, "title_hint": "Full Body B"},
    {"kind": "mobility", "title_hint": "Mobility or Rest"},
    {"kind": "training", "src_day": 3, "title_hint": "Full Body C"},
    {"kind": "optional-training", "title_hint": "Optional Walk"},
    {"kind": "rest"},
]

STAGE_TEMPLATES = {
    "prebirth-foundation": FOUNDATION_TPL,
    "prebirth-framing": FRAMING_TPL,
    "prebirth-durability": DURABILITY_TPL,
    "prebirth-staging": STAGING_TPL,
    "prebirth-mission-mode": MISSION_TPL,
}


def recovery_activities():
    return {
        "activities": [
            {"type": "walking", "target": "20–30 minutes", "intensity": "easy"},
            {"type": "mobility", "target": "5–10 minutes", "intensity": "easy"},
        ],
        "completionCriteria": ["Complete an easy walk or intentionally rest."],
        "completionMessage": "Recovery supports the work you are doing.",
        "estimatedDurationMinutes": 30,
    }


def mobility_activities():
    return {
        "activities": [
            {"type": "mobility", "target": "10–15 minutes", "intensity": "easy"},
            {"type": "breathwork", "target": "5 minutes", "intensity": "easy"},
        ],
        "completionCriteria": ["Complete the mobility flow."],
        "completionMessage": "Mobility keeps the joints ready for the next block.",
        "estimatedDurationMinutes": 20,
    }


def rest_activities():
    return {
        "activities": [{"type": "rest", "target": "full rest", "intensity": "none"}],
        "completionCriteria": ["Take a full rest day."],
        "completionMessage": "Rest is part of the plan.",
        "estimatedDurationMinutes": 0,
    }


def optional_activities(hint):
    return {
        "activities": [
            {"type": "zone2", "target": "20–30 minutes", "intensity": "moderate"},
            {"type": "core", "target": "5–10 minutes", "intensity": "moderate"},
        ],
        "completionCriteria": ["Optional. Complete if life allows."],
        "completionMessage": "Optional work banked.",
        "estimatedDurationMinutes": 30,
    }


days_out = []
workouts_out = {}
stage_day_counters = {s[0]: 0 for s in STAGES}

for program_day in range(1, 253):
    # locate stage
    stage = next(s for s in STAGES if s[2] <= program_day <= s[3])
    stage_id, stage_name, s_start, s_end, pw_start, pw_end = stage
    stage_day_counters[stage_id] += 1
    stage_day = stage_day_counters[stage_id]

    program_week = ((program_day - 1) // 7) + 1
    weekday = ((program_day - 1) % 7) + 1  # 1..7

    # pregnancy week: within stage advance by 7-day blocks
    week_in_stage = ((stage_day - 1) // 7) + 1
    preg_week = pw_start + week_in_stage - 1
    if preg_week > pw_end:
        preg_week = pw_end

    tpl = STAGE_TEMPLATES[stage_id][weekday - 1]
    kind = tpl["kind"]
    hint = tpl.get("title_hint", "")

    entry = {
        "programDay": program_day,
        "relativeDaysToDueDate": 252 - program_day + 1,  # day 1 => 252 days to due
        "stageId": stage_id,
        "stageName": stage_name,
        "stageDay": stage_day,
        "weekNumber": program_week,
        "dayOfWeekInCycle": weekday,
        "pregnancyWeek": preg_week,
        "dayType": kind,
        "isRequired": kind not in ("optional-training",) and not (
            stage_id == "prebirth-mission-mode" and preg_week >= 38
        ),
    }

    if kind == "training":
        src = by_week.get(preg_week, {}).get(tpl["src_day"])
        if src is None:
            # fallback: closest available src_day in same preg week, else previous preg week
            wk_map = by_week.get(preg_week) or by_week.get(preg_week - 1) or {}
            if wk_map:
                src = wk_map[min(wk_map)]
        if src is None:
            # convert to rest if no source at all
            entry["dayType"] = "rest"
            entry["title"] = "Rest Day"
            entry["objective"] = "Recover from the training week."
            entry.update(rest_activities())
        else:
            workout_id = src["slug"]
            entry["workoutId"] = workout_id
            entry["title"] = f"{hint} · {src['name']}" if hint else src["name"]
            entry["objective"] = src.get("objective", "")
            entry["estimatedDurationMinutes"] = 45
            if workout_id not in workouts_out:
                workouts_out[workout_id] = src
    elif kind == "active-recovery":
        entry["title"] = "Active Recovery"
        entry["objective"] = "Easy movement to recover from training."
        entry.update(recovery_activities())
    elif kind == "mobility":
        entry["title"] = hint or "Mobility"
        entry["objective"] = "Restore range of motion and prep the next session."
        entry.update(mobility_activities())
    elif kind == "optional-training":
        entry["title"] = hint or "Optional Session"
        entry["objective"] = "Optional low-intensity conditioning."
        entry.update(optional_activities(hint))
    elif kind == "rest":
        entry["title"] = hint or "Full Rest"
        entry["objective"] = "Recover and prepare for the next cycle."
        entry.update(rest_activities())

    days_out.append(entry)

# Post-birth: reuse existing programs as-is, tile weekday template across days.
POST_TPL = [
    {"kind": "training", "src_day": 1},
    {"kind": "training", "src_day": 2},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 3},
    {"kind": "training", "src_day": 4},
    {"kind": "optional-training"},
    {"kind": "rest"},
]

post_by_stage = {}
for prog in post:
    # collapse workouts by their day field, keep first
    m = {}
    for w in prog["workouts"]:
        m.setdefault(w["day"], w)
    post_by_stage[prog["slug"]] = m


def postpartum_stage(day):
    if day <= 35:
        return "new-dad-survival", "New Dad Survival"
    if day <= 84:
        return "new-dad-foundation", "New Dad Foundation"
    return "father-athlete", "Father Athlete"


post_days = []
# Precompute survival first 14 days as recovery/walk only
for postpartum_day in range(1, 366):  # 1 year worth
    stage_id, stage_name = postpartum_stage(postpartum_day)
    weekday = ((postpartum_day - 1) % 7) + 1
    tpl = POST_TPL[weekday - 1]
    entry = {
        "postpartumDay": postpartum_day,
        "stageId": stage_id,
        "stageName": stage_name,
        "dayOfWeekInCycle": weekday,
        "isRequired": False if stage_id == "new-dad-survival" else tpl["kind"] != "optional-training",
        "dayType": tpl["kind"],
    }
    if postpartum_day <= 14:
        # bespoke: recovery + walks only
        entry["dayType"] = "post-birth-recovery" if weekday != 7 else "rest"
        entry["title"] = "Post-birth Recovery"
        entry["objective"] = "Walk as tolerated, sleep when possible, be present."
        entry["activities"] = [
            {"type": "walking", "target": "as tolerated", "intensity": "easy"},
            {"type": "rest", "target": "prioritize sleep", "intensity": "none"},
        ]
        entry["completionCriteria"] = ["Take care of your family and yourself."]
        entry["estimatedDurationMinutes"] = 15
    elif tpl["kind"] == "training":
        wmap = post_by_stage.get(stage_id, {})
        src = wmap.get(tpl["src_day"]) or (wmap[min(wmap)] if wmap else None)
        if src:
            entry["workoutId"] = src["slug"]
            entry["title"] = src["name"]
            entry["objective"] = src.get("objective", "")
            entry["estimatedDurationMinutes"] = 35
            if src["slug"] not in workouts_out:
                workouts_out[src["slug"]] = src
        else:
            entry["dayType"] = "active-recovery"
            entry["title"] = "Active Recovery"
            entry["objective"] = "Easy movement."
            entry.update(recovery_activities())
    elif tpl["kind"] == "active-recovery":
        entry["title"] = "Active Recovery"
        entry["objective"] = "Easy walk and mobility."
        entry.update(recovery_activities())
    elif tpl["kind"] == "optional-training":
        entry["title"] = "Optional Session"
        entry["objective"] = "Optional conditioning if life allows."
        entry.update(optional_activities(""))
    else:
        entry["title"] = "Full Rest"
        entry["objective"] = "Recover and be present."
        entry.update(rest_activities())
    post_days.append(entry)

out = {
    "schemaVersion": "2.0.0",
    "programId": "m2f-flagship-guided-journey",
    "name": "M2F Flagship Guided Journey",
    "preBirthJourneyLengthDays": 252,
    "stages": [
        {"id": s[0], "name": s[1], "programDayStart": s[2], "programDayEnd": s[3],
         "pregnancyWeekStart": s[4], "pregnancyWeekEnd": s[5]}
        for s in STAGES
    ],
    "postBirthStages": [
        {"id": s[0], "name": s[1], "postpartumDayStart": s[2], "postpartumDayEnd": s[3]}
        for s in POST_STAGES
    ],
    "days": days_out,
    "postBirthDays": post_days,
    "workouts": list(workouts_out.values()),
    "versionLabels": data.get("versionLabels", {}),
}

OUT.write_text(json.dumps(out, indent=2))
print(f"Wrote {OUT} · days={len(days_out)} postDays={len(post_days)} workouts={len(workouts_out)}")

# quick self-check
seen = [d["programDay"] for d in days_out]
assert seen == list(range(1, 253)), "programDay not contiguous 1..252"
print("OK: 252 unique contiguous program days")
