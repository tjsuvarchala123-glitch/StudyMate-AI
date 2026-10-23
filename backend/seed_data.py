import json
import uuid
from datetime import datetime, date, timedelta
from database import get_connection, init_db

def seed_sample_data(force=False):
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    if not force:
        cursor.execute("SELECT COUNT(*) FROM tasks")
        count = cursor.fetchone()[0]
        if count > 0:
            conn.close()
            return {"status": "already_seeded", "message": "Database already contains data"}

    # Clear existing if force
    if force:
        cursor.execute("DELETE FROM tasks")
        cursor.execute("DELETE FROM study_plans")
        cursor.execute("DELETE FROM quiz_results")
        cursor.execute("DELETE FROM activity_logs")

    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    in_two_days = (date.today() + timedelta(days=2)).isoformat()

    # 1. Sample Tasks with status, resource URLs, and completion evidence
    tasks = [
        (
            "task-1",
            "Practice Two-Pointer Array problems",
            "Solve 3 medium LeetCode questions on Two Sum II and Container With Most Water",
            "Data Structures",
            today,
            "18:00",
            "High",
            "In progress",
            0,
            "https://leetcode.com/tag/two-pointers/",
            None,
            None,
            None,
            "Targeting two pointers and sliding window patterns",
            datetime.now().isoformat()
        ),
        (
            "task-2",
            "Review Java Polymorphism & Interfaces",
            "Revise abstract classes vs interface default methods in Java 8+",
            "Java OOP",
            today,
            "20:00",
            "Medium",
            "Completed",
            1,
            "https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html",
            datetime.now().isoformat(),
            "self_reported",
            "Reviewed default method diamond problem and dynamic dispatch mechanism",
            "Revise abstract classes vs interface default methods in Java 8+",
            datetime.now().isoformat()
        ),
        (
            "task-3",
            "Revise DBMS SQL joins and normalization",
            "1NF, 2NF, 3NF, BCNF rules and practice left/right outer joins",
            "DBMS",
            tomorrow,
            "16:30",
            "Medium",
            "Not started",
            0,
            "https://www.postgresql.org/docs/current/tutorial-join.html",
            None,
            None,
            None,
            "1NF, 2NF, 3NF, BCNF rules and practice left/right outer joins",
            datetime.now().isoformat()
        ),
        (
            "task-4",
            "OS Process Scheduling Algorithms",
            "Compare FCFS, SJF, SRTF, and Round Robin Gantt charts",
            "Operating Systems",
            in_two_days,
            "19:00",
            "Low",
            "Not started",
            0,
            "https://en.wikipedia.org/wiki/Scheduling_(computing)",
            None,
            None,
            None,
            "Compare FCFS, SJF, SRTF, and Round Robin Gantt charts",
            datetime.now().isoformat()
        ),
        (
            "task-5",
            "Binary Search Edge Cases",
            "Reviewed upper bound, lower bound, and integer overflow handling",
            "Data Structures",
            yesterday,
            "17:00",
            "High",
            "Completed",
            1,
            "https://leetcode.com/explore/learn/card/binary-search/",
            yesterday + "T17:00:00",
            "evidence_submitted",
            "Implemented template 1 and template 2 with mid = left + (right - left) / 2 to avoid overflow",
            "Reviewed upper bound, lower bound, and integer overflow handling",
            yesterday + "T17:00:00"
        )
    ]

    cursor.executemany("""
    INSERT INTO tasks (
        id, title, description, subject, due_date, due_time, priority,
        status, completed, resource_url, completed_at, completion_type, completion_evidence, notes, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tasks)

    # 2. Sample 5-day DSA Study Plan
    dsa_days = [
        {
            "day": 1,
            "title": "Arrays & Two Pointers",
            "hours": 2,
            "topics": ["Dynamic Arrays", "Prefix Sums", "Two Pointers Technique"],
            "tasks": [
                {"id": "d1-t1", "title": "Solve 2Sum & 3Sum with 2 pointers", "completed": True},
                {"id": "d1-t2", "title": "Implement Sliding Window maximum", "completed": True}
            ]
        },
        {
            "day": 2,
            "title": "Binary Search & Sorting",
            "hours": 2,
            "topics": ["Binary Search in Rotated Array", "Merge Sort", "Quick Select"],
            "tasks": [
                {"id": "d2-t1", "title": "Search in Rotated Sorted Array", "completed": True},
                {"id": "d2-t2", "title": "Find Kth Largest Element using Quickselect", "completed": False}
            ]
        },
        {
            "day": 3,
            "title": "Stacks & Queues",
            "hours": 2,
            "topics": ["Monotonic Stack", "Queue using Stacks", "Min Stack Design"],
            "tasks": [
                {"id": "d3-t1", "title": "Implement Daily Temperatures problem", "completed": False},
                {"id": "d3-t2", "title": "Valid Parentheses with edge cases", "completed": False}
            ]
        },
        {
            "day": 4,
            "title": "Linked Lists & Fast/Slow Pointer",
            "hours": 2,
            "topics": ["Floyd's Cycle Detection", "Reverse Linked List", "Merge K Sorted Lists"],
            "tasks": [
                {"id": "d4-t1", "title": "Detect & remove loop in linked list", "completed": False},
                {"id": "d4-t2", "title": "Palindrome linked list in O(1) space", "completed": False}
            ]
        },
        {
            "day": 5,
            "title": "Trees & Binary Search Trees (BST)",
            "hours": 2,
            "topics": ["Tree Traversals (BFS & DFS)", "Validate BST", "Lowest Common Ancestor"],
            "tasks": [
                {"id": "d5-t1", "title": "Level order traversal using Queue", "completed": False},
                {"id": "d5-t2", "title": "Lowest Common Ancestor in BST", "completed": False}
            ]
        }
    ]

    sample_plan = (
        "plan-dsa-5day",
        "5-Day DSA Master Plan (Sample)",
        "Data Structures & Algorithms",
        5,
        2.0,
        json.dumps(["Arrays & Two Pointers", "Binary Search", "Stacks & Queues", "Linked Lists", "Trees & BST"]),
        json.dumps(dsa_days),
        1, # is_sample
        datetime.now().isoformat()
    )

    cursor.execute("""
    INSERT INTO study_plans (id, title, subject, duration_days, daily_hours, topics, days, is_sample, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_plan)

    # 3. Sample Quiz Results
    quiz_results = [
        (
            "quiz-1",
            "Java",
            "Java OOP & Concurrency",
            4,
            5,
            80.0,
            (datetime.now() - timedelta(days=2)).isoformat()
        ),
        (
            "quiz-2",
            "Data Structures",
            "Arrays & Time Complexity",
            5,
            5,
            100.0,
            (datetime.now() - timedelta(days=1)).isoformat()
        )
    ]

    cursor.executemany("""
    INSERT INTO quiz_results (id, subject, topic, score, total_questions, percentage, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, quiz_results)

    # 4. Activity Logs
    logs = [
        ("log-1", "plan_created", "Created 5-day DSA Master Plan", (datetime.now() - timedelta(days=3)).isoformat()),
        ("log-2", "quiz_completed", "Scored 100% on Arrays & Time Complexity Quiz", (datetime.now() - timedelta(days=1)).isoformat()),
        ("log-3", "task_completed", "Marked 'Review Java Polymorphism' as completed", datetime.now().isoformat())
    ]

    cursor.executemany("""
    INSERT INTO activity_logs (id, activity_type, description, timestamp)
    VALUES (?, ?, ?, ?)
    """, logs)

    conn.commit()
    conn.close()
    return {"status": "success", "message": "Sample data seeded successfully"}

if __name__ == "__main__":
    res = seed_sample_data(force=True)
    print(res)
