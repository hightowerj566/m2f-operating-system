#!/usr/bin/env python3
"""Build src/data/m2f_flagship_journey.json — the day-based flagship engine.

Source of truth: src/data/m2f_all_training_programs.json, which contains
seven programs (four pre-birth blocks + three post-birth blocks). Each of
the 252 pre-birth program days and 365 post-birth days is mapped to a
weekday template, then a training day pulls the correct workout for its
stage-relative week + day index. Stage weeks that exceed the source
program's week count wrap to the final available week (deload)."""

import json
import re
import unicodedata
from pathlib import Path

SRC = Path("src/data/m2f_all_training_programs.json")
OUT = Path("src/data/m2f_flagship_journey.json")
LIB = Path("src/data/m2f_exercise_library.json")

data = json.loads(SRC.read_text())
library = json.loads(LIB.read_text())
pre = data["pre_birth"]
post = data["post_birth"]

program_by_slug = {p["slug"]: p for p in pre + post}


def normalized_name(value):
    """Stable lookup key for human exercise names; never used as a fuzzy match."""
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def slugify(value):
    return normalized_name(value).replace(" ", "-")


def parse_rest_seconds(value):
    if not value:
        return 60
    match = re.search(r"(\d+)", str(value))
    if not match:
        return 60
    amount = int(match.group(1))
    return amount * 60 if "min" in str(value).lower() else amount


def parse_effort(value, label):
    match = re.search(rf"{label}\s*(\d+(?:\.\d+)?)", str(value or ""), re.I)
    return float(match.group(1)) if match else None


def classify_exercise(name):
    n = normalized_name(name)
    if any(x in n for x in ("walk", "bike", "conditioning", "interval", "run", "zone 2")):
        return "conditioning", "conditioning", ["Cardiovascular system"]
    if any(x in n for x in ("mobility", "cat cow", "hold", "plank", "dead bug", "rotation")):
        return "mobility" if "mobility" in n or "cat cow" in n else "core", "mobility", ["Core"]
    if any(x in n for x in ("row", "pull", "chin")):
        return "strength", "pull", ["Back", "Biceps"]
    if any(x in n for x in ("press", "push up", "extension")):
        return "strength", "push", ["Chest", "Shoulders", "Triceps"]
    if any(x in n for x in ("squat", "lunge", "deadlift", "hinge", "carry")):
        return "strength", "lower body", ["Glutes", "Legs", "Core"]
    return "strength", "accessory", ["Full body"]


def infer_equipment(name):
    n = normalized_name(name)
    equipment = []
    for needle, label in (
        ("barbell", "Barbell"), ("dumbbell", "Dumbbells"),
        ("band", "Resistance band"), ("cable", "Cable"),
        ("bike", "Bike"), ("rower", "Rower"), ("sled", "Sled"),
    ):
        if needle in n:
            equipment.append(label)
    return equipment or ["Bodyweight or available load"]


def make_library_exercise(name, samples):
    category, pattern, muscles = classify_exercise(name)
    cue = next((s.get("cue") for s in samples if s.get("cue")), "Move with control through a pain-free range.")
    tempo = next((s.get("tempo") for s in samples if s.get("tempo")), "controlled")
    rest = next((parse_rest_seconds(s.get("rest")) for s in samples if s.get("rest")), 60)
    rpe = next((parse_effort(s.get("effort"), "RPE") for s in samples if parse_effort(s.get("effort"), "RPE") is not None), 7)
    rir = next((parse_effort(s.get("effort"), "RIR") for s in samples if parse_effort(s.get("effort"), "RIR") is not None), max(0, 10 - rpe))
    return {
        "id": slugify(name),
        "name": name,
        "displayName": name,
        "aliases": [],
        "category": category,
        "exerciseType": "compound" if pattern in ("push", "pull", "lower body") else category,
        "movementPattern": pattern,
        "laterality": "bilateral",
        "planeOfMotion": "sagittal",
        "primaryMuscles": muscles,
        "secondaryMuscles": ["Core"],
        "equipment": infer_equipment(name),
        "difficulty": "Intermediate",
        "defaultTempo": tempo,
        "defaultRestSeconds": rest,
        "defaultRPE": rpe,
        "defaultPrescription": {
            "tempo": tempo,
            "restSeconds": rest,
            "targetRPE": rpe,
            "targetRIR": rir,
        },
        "instructions": [
            cue,
            "Use a controlled range of motion and maintain stable positioning.",
            "Stop the set when technique breaks down or pain occurs.",
        ],
        "coachingCues": [cue],
        "commonMistakes": ["Rushing the movement", "Using a load that changes the intended technique"],
        "regressions": [],
        "progressions": [],
        "substitutions": [],
        "safetyNotes": [
            "Use a pain-free range of motion.",
            "Stop if sharp pain, dizziness, or unusual symptoms occur.",
        ],
        "media": {"videoUrl": "", "thumbnailUrl": ""},
        "tags": [category, pattern] + muscles,
        "sourceCue": cue,
    }


def enrich_training_content():
    """Normalize source prescriptions to stable library references.

    The uploaded seven-program file is intentionally presentation-oriented and
    originally contained names only. This migration keeps it as the program
    source while producing one strict runtime schema for the app.
    """
    samples_by_name = {}
    for program in pre + post:
        for workout in program["workouts"]:
            for spec in workout["versions"].values():
                for exercise in spec["exercises"]:
                    samples_by_name.setdefault(exercise["name"], []).append(exercise)
                    substitution = exercise.get("substitution")
                    if substitution:
                        for option in re.split(r"\s+or\s+", substitution, flags=re.I):
                            samples_by_name.setdefault(option.strip(), []).append({"name": option.strip()})

    by_name = {normalized_name(e["name"]): e for e in library["exercises"]}
    ids = {e["id"] for e in library["exercises"]}
    for name, samples in samples_by_name.items():
        key = normalized_name(name)
        if key in by_name:
            continue
        created = make_library_exercise(name, samples)
        base = created["id"]
        suffix = 2
        while created["id"] in ids:
            created["id"] = f"{base}-{suffix}"
            suffix += 1
        library["exercises"].append(created)
        by_name[key] = created
        ids.add(created["id"])

    for program in pre + post:
        for workout in program["workouts"]:
            for version, spec in workout["versions"].items():
                for index, exercise in enumerate(spec["exercises"], start=1):
                    resolved = by_name.get(normalized_name(exercise["name"]))
                    if not resolved:
                        raise ValueError(f'Exercise "{exercise["name"]}" could not be resolved')
                    exercise["exerciseId"] = resolved["id"]
                    exercise["prescriptionId"] = f'{workout["slug"]}:{version}:{index}'
                    exercise["order"] = index
                    exercise["restSeconds"] = parse_rest_seconds(exercise.get("rest"))
                    exercise["targetRPE"] = parse_effort(exercise.get("effort"), "RPE")
                    exercise["targetRIR"] = parse_effort(exercise.get("effort"), "RIR")
                    substitution = exercise.get("substitution")
                    exercise["substitutionIds"] = [] if not substitution else [
                        by_name[normalized_name(option.strip())]["id"]
                        for option in re.split(r"\s+or\s+", substitution, flags=re.I)
                    ]
                    exercise["tracking"] = {
                        "trackLoad": True,
                        "trackReps": True,
                        "trackRpe": True,
                    }

    library["exercises"].sort(key=lambda exercise: exercise["id"])
    library["exerciseCount"] = len(library["exercises"])


enrich_training_content()


def index_program(prog_slug, week_offset=0):
    """Return { (stageWeek, day): workout } where stageWeek starts at 1.
    week_offset lets Mission Mode reuse transform-staging weeks 5..8 as
    stage weeks 1..4."""
    out = {}
    p = program_by_slug[prog_slug]
    for w in p["workouts"]:
        stage_week = w["week"] - week_offset
        if stage_week < 1:
            continue
        out[(stage_week, w["day"])] = w
    return out


# id, name, program_day_start, program_day_end, preg_week_start, preg_week_end,
# program_slug, week_offset, days_per_week, template
STAGES = [
    {
        "id": "prebirth-foundation",
        "name": "Foundation",
        "start": 1, "end": 70,
        "pw_start": 4, "pw_end": 13,
        "program": "transform-foundation",
        "week_offset": 0,
        "days_per_week": 5,
    },
    {
        "id": "prebirth-framing",
        "name": "Framing",
        "start": 71, "end": 133,
        "pw_start": 14, "pw_end": 22,
        "program": "transform-framing",
        "week_offset": 0,
        "days_per_week": 5,
    },
    {
        "id": "prebirth-durability",
        "name": "Durability",
        "start": 134, "end": 196,
        "pw_start": 23, "pw_end": 31,
        "program": "transform-durability",
        "week_offset": 0,
        "days_per_week": 4,
    },
    {
        "id": "prebirth-staging",
        "name": "Staging",
        "start": 197, "end": 224,
        "pw_start": 32, "pw_end": 35,
        "program": "transform-staging",
        "week_offset": 0,
        "days_per_week": 4,
    },
    {
        "id": "prebirth-mission-mode",
        "name": "Mission Mode",
        "start": 225, "end": 252,
        "pw_start": 36, "pw_end": 39,
        "program": "transform-staging",
        "week_offset": 4,  # reuse weeks 5..8 as stage weeks 1..4
        "days_per_week": 3,
    },
]

# Weekday templates by days_per_week.
# 5-day (Mon..Sun): T, T, active-recovery, T, T, T, rest → src_day 1..5
TPL_5 = [
    {"kind": "training", "src_day": 1},
    {"kind": "training", "src_day": 2},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 3},
    {"kind": "training", "src_day": 4},
    {"kind": "training", "src_day": 5},
    {"kind": "rest"},
]
# 4-day: T, T, active-recovery, T, T, optional-training, rest
TPL_4 = [
    {"kind": "training", "src_day": 1},
    {"kind": "training", "src_day": 2},
    {"kind": "active-recovery"},
    {"kind": "training", "src_day": 3},
    {"kind": "training", "src_day": 4},
    {"kind": "optional-training"},
    {"kind": "rest"},
]
# 3-day: T, rest, T, mobility, T, optional, rest
TPL_3 = [
    {"kind": "training", "src_day": 1},
    {"kind": "rest"},
    {"kind": "training", "src_day": 2},
    {"kind": "mobility"},
    {"kind": "training", "src_day": 3},
    {"kind": "optional-training"},
    {"kind": "rest"},
]
TEMPLATES = {5: TPL_5, 4: TPL_4, 3: TPL_3}

POST_STAGES = [
    ("new-dad-survival", "New Dad Survival", 1, 35),
    ("new-dad-foundation", "New Dad Foundation", 36, 84),
    ("father-athlete", "Father Athlete", 85, None),
]


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


def optional_activities():
    return {
        "activities": [
            {"type": "zone2", "target": "20–30 minutes", "intensity": "moderate"},
            {"type": "core", "target": "5–10 minutes", "intensity": "moderate"},
        ],
        "completionCriteria": ["Optional. Complete if life allows."],
        "completionMessage": "Optional work banked.",
        "estimatedDurationMinutes": 30,
    }


def max_source_week(program_slug, week_offset):
    weeks = {w["week"] - week_offset for w in program_by_slug[program_slug]["workouts"] if w["week"] - week_offset >= 1}
    return max(weeks) if weeks else 1


days_out = []
workouts_out = {}
stage_day_counters = {s["id"]: 0 for s in STAGES}
program_indexes = {}

for program_day in range(1, 253):
    stage = next(s for s in STAGES if s["start"] <= program_day <= s["end"])
    stage_day_counters[stage["id"]] += 1
    stage_day = stage_day_counters[stage["id"]]
    program_week = ((program_day - 1) // 7) + 1
    weekday = ((program_day - 1) % 7) + 1
    week_in_stage = ((stage_day - 1) // 7) + 1

    preg_week = stage["pw_start"] + week_in_stage - 1
    if preg_week > stage["pw_end"]:
        preg_week = stage["pw_end"]

    # cap source week to available
    key = (stage["program"], stage["week_offset"])
    if key not in program_indexes:
        program_indexes[key] = index_program(stage["program"], stage["week_offset"])
    idx = program_indexes[key]
    max_wk = max_source_week(stage["program"], stage["week_offset"])
    src_week = min(week_in_stage, max_wk)

    tpl = TEMPLATES[stage["days_per_week"]][weekday - 1]
    kind = tpl["kind"]

    entry = {
        "programDay": program_day,
        "relativeDaysToDueDate": 252 - program_day + 1,
        "stageId": stage["id"],
        "stageName": stage["name"],
        "stageDay": stage_day,
        "weekNumber": program_week,
        "dayOfWeekInCycle": weekday,
        "pregnancyWeek": preg_week,
        "dayType": kind,
        "isRequired": kind != "optional-training" and not (
            stage["id"] == "prebirth-mission-mode" and preg_week >= 38
        ),
    }

    if kind == "training":
        src = idx.get((src_week, tpl["src_day"]))
        if src is None:
            # try later day indexes at same week; else fall back to prior week
            fallback = None
            for d in sorted({d for (w, d) in idx.keys() if w == src_week}):
                fallback = idx[(src_week, d)]
                if fallback:
                    break
            src = fallback
        if src is None:
            entry["dayType"] = "rest"
            entry["title"] = "Rest Day"
            entry["objective"] = "Recover from the training week."
            entry.update(rest_activities())
        else:
            entry["workoutId"] = src["slug"]
            entry["title"] = src["name"]
            entry["objective"] = src.get("objective", "")
            entry["estimatedDurationMinutes"] = 45
            workouts_out[src["slug"]] = src
    elif kind == "active-recovery":
        entry["title"] = "Active Recovery"
        entry["objective"] = "Easy movement to recover from training."
        entry.update(recovery_activities())
    elif kind == "mobility":
        entry["title"] = "Mobility"
        entry["objective"] = "Restore range of motion and prep the next session."
        entry.update(mobility_activities())
    elif kind == "optional-training":
        entry["title"] = "Optional Session"
        entry["objective"] = "Optional low-intensity conditioning."
        entry.update(optional_activities())
    elif kind == "rest":
        entry["title"] = "Full Rest"
        entry["objective"] = "Recover and prepare for the next cycle."
        entry.update(rest_activities())

    days_out.append(entry)


# ---------- Post-birth ----------
def postpartum_stage(day):
    if day <= 35:
        return "new-dad-survival", "New Dad Survival"
    if day <= 84:
        return "new-dad-foundation", "New Dad Foundation"
    return "father-athlete", "Father Athlete"


# Index each post-birth program by (week, day). Weeks are relative to program start.
post_indexes = {}
for prog in post:
    m = {}
    weeks_present = sorted({w["week"] for w in prog["workouts"]})
    base_week = min(weeks_present) if weeks_present else 1
    for w in prog["workouts"]:
        m[(w["week"] - base_week + 1, w["day"])] = w
    post_indexes[prog["slug"]] = m


def stage_days_per_week(stage_id):
    return {"new-dad-survival": 3, "new-dad-foundation": 4, "father-athlete": 5}[stage_id]


def stage_max_week(stage_id):
    keys = post_indexes[stage_id].keys()
    return max(k[0] for k in keys) if keys else 1


post_days = []
stage_day_counter_pb = {s[0]: 0 for s in POST_STAGES}

for postpartum_day in range(1, 366):
    stage_id, stage_name = postpartum_stage(postpartum_day)
    stage_day_counter_pb[stage_id] += 1
    sd = stage_day_counter_pb[stage_id]
    weekday = ((postpartum_day - 1) % 7) + 1
    dpw = stage_days_per_week(stage_id)
    tpl = TEMPLATES[dpw][weekday - 1]

    entry = {
        "postpartumDay": postpartum_day,
        "stageId": stage_id,
        "stageName": stage_name,
        "dayOfWeekInCycle": weekday,
        "isRequired": False if stage_id == "new-dad-survival" and postpartum_day <= 14 else tpl["kind"] != "optional-training",
        "dayType": tpl["kind"],
    }

    if postpartum_day <= 14:
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
        week_in_stage = ((sd - 1) // 7) + 1
        max_wk = stage_max_week(stage_id)
        src_week = ((week_in_stage - 1) % max_wk) + 1  # loop father-athlete indefinitely
        src = post_indexes[stage_id].get((src_week, tpl["src_day"]))
        if src is None:
            # fallback: any available day for this week
            for d in sorted({d for (w, d) in post_indexes[stage_id].keys() if w == src_week}):
                src = post_indexes[stage_id][(src_week, d)]
                break
        if src:
            entry["workoutId"] = src["slug"]
            entry["title"] = src["name"]
            entry["objective"] = src.get("objective", "")
            entry["estimatedDurationMinutes"] = 35
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
    elif tpl["kind"] == "mobility":
        entry["title"] = "Mobility"
        entry["objective"] = "Restore range of motion."
        entry.update(mobility_activities())
    elif tpl["kind"] == "optional-training":
        entry["title"] = "Optional Session"
        entry["objective"] = "Optional conditioning if life allows."
        entry.update(optional_activities())
    else:
        entry["title"] = "Full Rest"
        entry["objective"] = "Recover and be present."
        entry.update(rest_activities())
    post_days.append(entry)

out = {
    "schemaVersion": "3.0.0",
    "programId": "m2f-flagship-guided-journey",
    "name": "M2F Flagship Guided Journey",
    "preBirthJourneyLengthDays": 252,
    "stages": [
        {
            "id": s["id"], "name": s["name"],
            "programDayStart": s["start"], "programDayEnd": s["end"],
            "pregnancyWeekStart": s["pw_start"], "pregnancyWeekEnd": s["pw_end"],
        }
        for s in STAGES
    ],
    "postBirthStages": [
        {"id": s[0], "name": s[1], "postpartumDayStart": s[2], "postpartumDayEnd": s[3]}
        for s in POST_STAGES
    ],
    "days": days_out,
    "postBirthDays": post_days,
    "workouts": list(workouts_out.values()),
    "sourceMeta": data.get("meta", {}),
}

OUT.write_text(json.dumps(out, indent=2))
LIB.write_text(json.dumps(library, indent=2))
print(f"Wrote {OUT} · days={len(days_out)} postDays={len(post_days)} workouts={len(workouts_out)}")
print(f"Wrote {LIB} · exercises={len(library['exercises'])}")

seen = [d["programDay"] for d in days_out]
assert seen == list(range(1, 253)), "programDay not contiguous 1..252"
seen_pb = [d["postpartumDay"] for d in post_days]
assert seen_pb == list(range(1, 366)), "postpartumDay not contiguous 1..365"
# Every training day must resolve to a workout that exists
by_id = {w["slug"] for w in workouts_out.values()}
missing = [d for d in days_out + post_days if d.get("workoutId") and d["workoutId"] not in by_id]
assert not missing, f"missing workoutId refs: {missing[:3]}"
library_ids = {exercise["id"] for exercise in library["exercises"]}
missing_exercises = [
    (workout["slug"], version, exercise.get("exerciseId"))
    for workout in workouts_out.values()
    for version, spec in workout["versions"].items()
    for exercise in spec["exercises"]
    if not exercise.get("exerciseId") or exercise["exerciseId"] not in library_ids
]
assert not missing_exercises, f"missing exerciseId refs: {missing_exercises[:3]}"
print("OK: 252 pre-birth + 365 post-birth days contiguous, all workout refs valid")
