from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

SESSION_DURATION = 90
BREAK_DURATION = 20

def get_free_slots(
    db: Session,
    user_id: int,
    start_date: datetime,
    end_date: datetime
):
    busy_events = db.query(models.UserSchedule).filter(
        models.UserSchedule.user_id == user_id,
        models.UserSchedule.start_time >= start_date,
        models.UserSchedule.end_time <= end_date
    ).order_by(models.UserSchedule.start_time).all()

    free_slots = []
    current_time = start_date

    for event in busy_events:
        if event.start_time > current_time:
            free_slots.append({
                "start": current_time,
                "end": event.start_time,
                "duration_minutes": (event.start_time - current_time).total_seconds() / 60
            })
        current_time = max(current_time, event.end_time)

    if current_time < end_date:
        free_slots.append({
            "start": current_time,
            "end": end_date,
            "duration_minutes": (end_date - current_time).total_seconds() / 60
        })

    return free_slots

# how many sessions are needed for a task
def get_required_sessions(task):
    difficulty = int(task.related_class.difficulty)

    sessions = 2 + difficulty

    if task.type == models.TaskType.exam:
        sessions += 2

    elif task.type == models.TaskType.project:
        sessions += 1

    return sessions

# earliest day to start studying for a task based on its type
def get_study_window_days(task):
    if task.type == models.TaskType.exam:
        return 7
    elif task.type == models.TaskType.project:
        return 5
    
    return 3

def calculate_priority(task, reference_date):
    difficulty = int(task.related_class.difficulty)

    score = difficulty

    if task.type == models.TaskType.exam:
        score += 5
    elif task.type == models.TaskType.project:
        score += 3

    days_until = (
        task.deadline - reference_date
    ).total_seconds() / 86400

    if days_until < 0:
        return -9999
    
    urgency_bonus = 20 / (days_until + 1)

    return score + urgency_bonus

def can_study_task(task, study_date):
    window_days = get_study_window_days(task)

    earliest_study_date = task.deadline - timedelta(days=window_days)

    return study_date >= earliest_study_date

def get_best_task(task_pool, study_start):
    candidates = []

    for task_info in task_pool:
        if task_info["sessions_left"] <= 0:
            continue

        task = task_info["model"]

        if study_start >= task.deadline:
            continue

        if not can_study_task(task, study_start):
            continue

        priority = calculate_priority(task, study_start)

        candidates.append({
            "task_info": task_info,
            "priority": priority
        })

    if not candidates:
        return None
    
    candidates.sort(
        key=lambda x: x["priority"],
        reverse=True
    )

    return candidates[0]["task_info"]

def generate_plan(
    db: Session,
    user_id: int,
    sleep_start: int = 23,
    sleep_end: int = 8,
    max_sessions_per_day: int = 3,
    days_to_plan: int = 7
):
    start_date = datetime.now()
    end_date = start_date + timedelta(days=days_to_plan)

    slots = get_free_slots(
        db,
        user_id,
        start_date,
        end_date
    )

    tasks = db.query(models.Task).join(models.Class).filter(
        models.Task.user_id == user_id,
        models.Task.is_completed == False
    ).all()

    task_pool = []

    for task in tasks:
        task_pool.append({
            "model": task,
            "sessions_left": get_required_sessions(task)
        })

    recommendations = []
    daily_session_counts = {}

    current_slot_idx = 0

    while current_slot_idx < len(slots):
        slot = slots[current_slot_idx]

        study_start = slot["start"]

        if study_start > end_date:
            break

        day_key = study_start.date().isoformat()

        if day_key not in daily_session_counts:
            daily_session_counts[day_key] = 0

        study_end_estimate = (
            study_start +
            timedelta(minutes=SESSION_DURATION)
        )

        # handle sleep hours
        if (study_end_estimate.hour >= sleep_start or study_start.hour < sleep_end):
            if study_start.hour >= sleep_start:
                next_morning = (
                    study_start.replace(
                        hour=sleep_end,
                        minute=0,
                        second=0,
                        microsecond=0
                    ) + timedelta(days=1)
                )
            else:
                next_morning = study_start.replace(
                    hour=sleep_end,
                    minute=0,
                    second=0,
                    microsecond=0
                )

            skipped = (next_morning - study_start).total_seconds() / 60

            slot["start"] = next_morning
            slot["duration_minutes"] -= skipped

            if slot["duration_minutes"] < SESSION_DURATION:
                current_slot_idx += 1

            continue

        # daily limit
        if daily_session_counts[day_key] >= max_sessions_per_day:
            next_morning = (study_start.replace(
                hour=sleep_end,
                minute=0,
                second=0,
                microsecond=0
            ) + timedelta(days=1)
            )

            skipped = (next_morning - study_start).total_seconds() / 60

            slot["start"] = next_morning
            slot["duration_minutes"] -= skipped

            if slot["duration_minutes"] < SESSION_DURATION:
                current_slot_idx += 1

            continue

        if slot["duration_minutes"] < SESSION_DURATION:
            current_slot_idx += 1
            continue

        current_task = get_best_task(task_pool, study_start)

        if not current_task:
            current_slot_idx += 1
            continue

        task_model = current_task["model"]

        study_end = (study_start + timedelta(minutes=SESSION_DURATION))

        recommendations.append({
            "id": 0,
            "user_id": user_id,
            "task_id": task_model.id,
            "class_id": task_model.class_id,
            "task_title": task_model.title,
            "class_name": task_model.related_class.name,
            "start_time": study_start,
            "end_time": study_end,
            "duration": SESSION_DURATION,
            "status": "planned",
            "message": f"Recommended study session for task '{task_model.title}' from class '{task_model.related_class.name}' starting at {study_start}."
        })

        current_task["sessions_left"] -= 1

        daily_session_counts[day_key] += 1

        slot["start"] = (study_end + timedelta(minutes=BREAK_DURATION))

        slot["duration_minutes"] -= (SESSION_DURATION + BREAK_DURATION)

    return recommendations

def save_planned_sessions(db: Session, user_id: int, recommendations: list):
    # delete old unaccepted sessions before saving new ones
    db.query(models.StudySession).filter(
        models.StudySession.user_id == user_id,
        models.StudySession.status == "planned"
    ).delete()

    for rec in recommendations:
        new_session = models.StudySession(
            user_id=user_id,
            class_id=rec['class_id'],
            task_id=rec['task_id'],
            start_time=rec['start_time'],
            end_time=rec['end_time'],
            duration=90,
            status="planned"
        )
        db.add(new_session)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving planned sessions: {e}")
        raise e
