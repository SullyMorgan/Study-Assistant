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

    score = difficulty * 2

    if task.type == models.TaskType.exam:
        score += 10
    elif task.type == models.TaskType.project:
        score += 5

    days_until = (
        task.deadline - reference_date
    ).total_seconds() / 86400

    if days_until < 0:
        return -9999
    
    urgency_bonus = 40 / (days_until + 0.5)

    return score + urgency_bonus

def can_study_task(task, study_date):
    window_days = get_study_window_days(task)

    earliest_study_date = task.deadline - timedelta(days=window_days)

    return study_date >= earliest_study_date or study_date < task.deadline
    #return earliest_study_date <= study_date < task.deadline

def get_best_task(task_pool, study_start):
    candidates = []

    upcoming_exams = []
    for task_info in task_pool:
        if task_info["sessions_left"] <= 0:
            continue
        t = task_info["model"]
        if t.type == models.TaskType.exam and t.deadline > study_start:
            upcoming_exams.append(t)

    upcoming_exams.sort(key=lambda x: x.deadline)

    upcoming_exam_class_id = None

    if upcoming_exams:
        next_exam = upcoming_exams[0]

        exam_day = next_exam.deadline.date()
        study_day = study_start.date()

        days_until_exam = (exam_day - study_day).days
        print(f"Days until next exam '{next_exam.title}': {days_until_exam}")
        if days_until_exam <= 1:
            upcoming_exam_class_id = next_exam.class_id

    
    for task_info in task_pool:
        if task_info["sessions_left"] <= 0:
            continue

        task = task_info["model"]

        if study_start >= task.deadline:
            continue

        if not can_study_task(task, study_start):
            continue

        if upcoming_exam_class_id is not None and task.class_id != upcoming_exam_class_id:
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

def get_best_task_backward(task_pool, study_start):
    candidates = []

    for task_info in task_pool:
        if task_info["sessions_left"] <= 0:
            continue

        task = task_info["model"]

        if task.type == models.TaskType.exam:
            latest_allowed_study_end = task.deadline - timedelta(hours=2)
        else:
            latest_allowed_study_end = task.deadline

        study_end_estimate = study_start + timedelta(minutes=SESSION_DURATION)
        if study_end_estimate > latest_allowed_study_end:
            continue

        time_until = task.deadline - study_start

        window_days = get_study_window_days(task)
        if time_until > timedelta(days=window_days):
            continue

        # the less time we have until the deadline, the higher the priority
        seconds_until = time_until.total_seconds()
        
        # very big bonus for exams that are due in the next 24 hours
        priority = int(task.related_class.difficulty) * 5 + (1000000 / (seconds_until + 1))

        candidates.append({
            "task_info": task_info,
            "priority": priority
        })

    if not candidates:
        return None

    candidates.sort(key=lambda x: x["priority"], reverse=True)
    return candidates[0]["task_info"]

def generate_plan(
    db: Session,
    user_id: int,
    sleep_start: int = 23,
    sleep_end: int = 8,
    max_sessions_per_day: int = 3,
    days_to_plan: int = 7
):
    tasks = db.query(models.Task).join(models.Class).filter(
        models.Task.user_id == user_id,
        models.Task.is_completed == False
    ).all()

    start_date = datetime.now() + timedelta(hours=1)

    if tasks:
        latest_deadline = max(task.deadline for task in tasks)
        end_date = latest_deadline + timedelta(days=1)
        actual_days_planned = (end_date - start_date).days
        print(f"Planning for {actual_days_planned} days based on latest task deadline.")
    else:
        end_date = start_date + timedelta(days=days_to_plan)
        print(f"No tasks found. Planning for {days_to_plan} days by default.")

    slots = get_free_slots(db, user_id, start_date, end_date)

    task_pool = []
    for task in tasks:
        task_pool.append({
            "model": task,
            "sessions_left": get_required_sessions(task)
        })

    concrete_slots = []
    daily_session_counts = {}
    current_slot_idx = 0

    buffer_after_wake = 1
    effective_sleep_start = (sleep_start - 1) % 24
    effective_sleep_end = (sleep_end + buffer_after_wake) % 24
    
    while current_slot_idx < len(slots):
        slot = slots[current_slot_idx]
        study_start = slot["start"]

        if study_start > end_date:
            break

        day_key = study_start.date().isoformat()
        if day_key not in daily_session_counts:
            daily_session_counts[day_key] = 0

        study_end_estimate = study_start + timedelta(minutes=SESSION_DURATION)

        is_sleeping = False
        if sleep_start > sleep_end:
            if study_end_estimate.hour >= effective_sleep_start or study_start.hour < effective_sleep_end:
                is_sleeping = True
        else:
            if effective_sleep_start <= study_start.hour < effective_sleep_end:
                is_sleeping = True

        if is_sleeping:
            if study_start.hour >= effective_sleep_start and effective_sleep_start > effective_sleep_end:
                next_morning = (study_start.replace(hour=effective_sleep_end, minute=0, second=0, microsecond=0) + timedelta(days=1))
            elif study_start.hour < effective_sleep_end:
                next_morning = study_start.replace(hour=effective_sleep_end, minute=0, second=0, microsecond=0)
            else:
                next_morning = study_start.replace(hour=effective_sleep_end, minute=0, second=0, microsecond=0)
                if study_start.hour >= effective_sleep_end:
                    next_morning += timedelta(days=1)
            
            skipped = (next_morning - study_start).total_seconds() / 60
            slot["start"] = next_morning
            slot["duration_minutes"] -= skipped
            if slot["duration_minutes"] < SESSION_DURATION:
                current_slot_idx += 1
            continue

        if daily_session_counts[day_key] >= max_sessions_per_day:
            next_morning = (study_start.replace(hour=effective_sleep_end, minute=0, second=0, microsecond=0) + timedelta(days=1))
            skipped = (next_morning - study_start).total_seconds() / 60
            slot["start"] = next_morning
            slot["duration_minutes"] -= skipped
            if slot["duration_minutes"] < SESSION_DURATION:
                current_slot_idx += 1
            continue

        if slot["duration_minutes"] < SESSION_DURATION:
            current_slot_idx += 1
            continue

        study_end = study_start + timedelta(minutes=SESSION_DURATION)
        concrete_slots.append({
            "start": study_start,
            "end": study_end,
            "day_key": day_key
        })

        daily_session_counts[day_key] += 1
        slot["start"] = study_end + timedelta(minutes=BREAK_DURATION)
        slot["duration_minutes"] -= (SESSION_DURATION + BREAK_DURATION)

    # fill backward to prioritize tasks with closer deadlines
    recommendations = []
    
    concrete_slots.reverse()

    for slot in concrete_slots:
        study_start = slot["start"]
        study_end = slot["end"]

        current_task = get_best_task_backward(task_pool, study_start)

        if not current_task:
            continue

        task_model = current_task["model"]

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
            "message": f"Recommended study session for task '{task_model.title}'."
        })

        current_task["sessions_left"] -= 1

    # return in chronological order
    recommendations.sort(key=lambda x: x["start_time"])
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
