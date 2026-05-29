from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

def get_free_slots(db: Session, user_id: int, start_date: datetime, end_date: datetime):
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

def calculate_priority(task):
    score = int(task.related_class.difficulty)

    required_sessions = 2
    if task.type == models.TaskType.exam:
        score += 5
        required_sessions = 5

    days_until = (task.deadline - datetime.now()).days
    if days_until < 0:
        days_until = 0

    # the closer the deadline, the higher the importance
    urgency_bonus = 20 / (days_until + 1)

    if days_until <= 2:
        required_sessions += 2

    final_score = score + urgency_bonus
    return final_score, required_sessions

def generate_plan(db: Session, user_id: int, sleep_start: int = 23, sleep_end: int = 8, max_sessions_per_day: int = 3, days_to_plan: int = 7):
    start_date = datetime.now()
    end_date = start_date + timedelta(days=days_to_plan)

    slots = get_free_slots(db, user_id, start_date, end_date)

    tasks = db.query(models.Task).join(models.Class).filter(
        models.Task.user_id == user_id,
        models.Task.is_completed == False
    ).all()

    task_pool = []
    for t in tasks:
        priority, sessions_needed = calculate_priority(t)
        task_pool.append({
            "model": t,
            "priority": priority,
            "sessions_left": sessions_needed
        })

    # sort by priority (highest first)
    task_pool.sort(key=lambda x: x["priority"], reverse=True)

    recommendations = []
    current_slot_idx = 0
    daily_session_counts = {}

    while current_slot_idx < len(slots):
        slot = slots[current_slot_idx]
        study_start = slot["start"]
        study_end_estimate = study_start + timedelta(minutes=90)
        day_key = study_start.date().isoformat()

        if study_start > end_date:
            break

        if day_key not in daily_session_counts:
            daily_session_counts[day_key] = 0

        if study_end_estimate.hour >= sleep_start or study_start.hour < sleep_end:
            if study_start.hour >= sleep_start:
                next_morning = study_start.replace(hour=sleep_end, minute=0, second=0, microsecond=0) + timedelta(days=1)
            else:
                next_morning = study_start.replace(hour=sleep_end, minute=0, second=0, microsecond=0)

            time_skipped = (next_morning - study_start).total_seconds() / 60
            slot["start"] = next_morning
            slot["duration_minutes"] -= time_skipped
            continue

        if daily_session_counts[day_key] >= max_sessions_per_day:
            next_morning = study_start.replace(hour=sleep_end, minute=0, second=0, microsecond=0) + timedelta(days=1)
            time_skipped = (next_morning - study_start).total_seconds() / 60
            slot["start"] = next_morning
            slot["duration_minutes"] -= time_skipped
            continue

        # search for the most important task, which still needs sesh
        current_task = None
        for t_info in task_pool:
            if t_info["sessions_left"] > 0 and study_start < t_info["model"].deadline:
                current_task = t_info
                break

        if not current_task:
            break

        if slot["duration_minutes"] >= 90:
            study_end = slot["start"] + timedelta(minutes=90)

            rec_start = slot["start"].isoformat() if hasattr(slot["start"], "isoformat") else slot["start"]
            rec_end = study_end.isoformat() if hasattr(study_end, "isoformat") else study_end

            task_model = current_task["model"]
            recommendations.append({
                "task_id": task_model.id,
                "task_title": task_model.title,
                "class_name": task_model.related_class.name,
                "start": rec_start,
                "end": rec_end,
                "message": f"Recommended study session for '{task_model.title}' from class '{task_model.related_class.name}'"
            })

            daily_session_counts[day_key] += 1
            current_task["sessions_left"] -= 1

            slot["start"] = study_end + timedelta(minutes=10)
            slot["duration_minutes"] -= (90 + 10)
        else:
            current_slot_idx += 1

    return recommendations

def save_planned_sessions(db: Session, user_id: int, recommendations: list):
    # delete old unaccepted sessions before saving new ones
    db.query(models.PlannedSession).filter(
        models.PlannedSession.user_id == user_id,
        models.PlannedSession.is_accepted == False
    ).delete()

    for rec in recommendations:
        new_session = models.PlannedSession(
            user_id=user_id,
            task_id=rec['task_id'],
            start_time=rec['start'],
            end_time=rec['end'],
            is_accepted=False
        )
        db.add(new_session)

    db.commit()
