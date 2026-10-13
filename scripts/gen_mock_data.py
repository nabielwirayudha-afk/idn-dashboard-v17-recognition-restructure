"""
Generates mock CSV data for the Employee Experience Dashboard, matching the
schema described in the Flow Process Design document (IDN Club, IDN Academy
Interactive In-Class Learning, IDN Academy Internal Internship, IDN Kudos,
Timmy of the Month, Employee [Active], Employee [Non-Active]).

This is SAMPLE data only, meant to stand in for the real Google Sheets /
CSV exports until they are swapped in (see src/lib/dataSource.ts).
"""
import csv
import random
from datetime import date, timedelta

random.seed(42)

DEPARTMENTS = [
    "Content & Editorial", "Sales & Partnership", "Product & Technology",
    "People & Culture", "Marketing & Brand", "Finance", "Video Production",
    "Business Development",
]
LOCATIONS = ["Jakarta HQ", "Bandung", "Surabaya", "Remote"]
EMP_TYPES = ["Permanent", "Contract", "Probation"]
POSITION_LEVELS = ["Staff", "Senior Staff", "Supervisor", "Manager", "Senior Manager", "Head"]
FIRST_NAMES = ["Andi","Bimo","Citra","Dewi","Eka","Fajar","Gita","Hana","Indra","Joko",
    "Kirana","Lestari","Made","Nadia","Oki","Putri","Rangga","Sari","Tegar","Utami",
    "Vino","Wulan","Yoga","Zahra","Agus","Bella","Chandra","Dian","Erlangga","Farah",
    "Galih","Hesti","Ivan","Jihan","Krisna","Laras","Miko","Nabila","Omar","Prita"]
LAST_NAMES = ["Saputra","Wijaya","Kusuma","Pratama","Setiawan","Rahayu","Nugroho","Hidayat",
    "Permadi","Anggraini","Wibowo","Santoso","Puspita","Iriana","Gunawan","Yulianti",
    "Kurniawan","Utomo","Sari","Prasetyo"]

def rand_date(start, end):
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

def quarter_of(m):
    return (m - 1) // 3 + 1

# ---------------------------------------------------------------------------
# Employee master (Active + Non-Active)
# ---------------------------------------------------------------------------
employees = []
used_emails = set()
N_ACTIVE = 72
N_NONACTIVE = 14

def make_employee(idx, status):
    fn = random.choice(FIRST_NAMES)
    ln = random.choice(LAST_NAMES)
    name = f"{fn} {ln}"
    base_email = f"{fn.lower()}.{ln.lower()}"
    email = f"{base_email}@idnmedia.com"
    suffix = 1
    while email in used_emails:
        suffix += 1
        email = f"{base_email}{suffix}@idnmedia.com"
    used_emails.add(email)
    dept = random.choice(DEPARTMENTS)
    location = random.choice(LOCATIONS)
    emp_type = random.choices(EMP_TYPES, weights=[75, 18, 7])[0]
    level = random.choices(POSITION_LEVELS, weights=[30, 22, 18, 16, 9, 5])[0]
    join_idn = rand_date(date(2016, 1, 1), date(2026, 5, 1))
    join_pt = join_idn
    working_days = (date(2026, 7, 28) - join_idn).days
    years = working_days / 365
    if years < 1:
        tenure = "< 1 year"
    elif years < 3:
        tenure = "1-3 years"
    elif years < 5:
        tenure = "3-5 years"
    else:
        tenure = "5+ years"
    manager_pool_name = random.choice(FIRST_NAMES) + " " + random.choice(LAST_NAMES)
    return {
        "Name": name,
        "Email": email,
        "DEPARTMENT": dept,
        "LOCATION": location,
        "EMPLOYENT TYPE": emp_type,
        "POSITION LEVEL": level,
        "Job Grade": f"G{random.randint(1,9)}",
        "Job Role": f"{level} - {dept.split(' ')[0]}",
        "Position Name": f"{level} {dept}",
        "DIRECT REPORT": manager_pool_name,
        "JOIN DATE (to each PT)": join_pt.isoformat(),
        "JOIN DATE (to IDN)": join_idn.isoformat(),
        "WORKING PERIOD": f"{years:.1f} years",
        "TENURE CATEGORY": tenure,
        "STATUS EMPLOYMENT": status,
    }

for i in range(N_ACTIVE):
    employees.append(make_employee(i, "Active"))
for i in range(N_NONACTIVE):
    employees.append(make_employee(i, "Non-Active"))

active_emails = [e["Email"] for e in employees if e["STATUS EMPLOYMENT"] == "Active"]
nonactive_emails = [e["Email"] for e in employees if e["STATUS EMPLOYMENT"] == "Non-Active"]
all_emails = active_emails + nonactive_emails
email_to_emp = {e["Email"]: e for e in employees}

def write_csv(filename, fieldnames, rows):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

active_fields = ["Name","Email","DEPARTMENT","LOCATION","EMPLOYENT TYPE","POSITION LEVEL",
    "Job Grade","Job Role","Position Name","DIRECT REPORT","JOIN DATE (to each PT)",
    "JOIN DATE (to IDN)","WORKING PERIOD","TENURE CATEGORY","STATUS EMPLOYMENT"]

write_csv("employee_active.csv", active_fields, [e for e in employees if e["STATUS EMPLOYMENT"] == "Active"])
write_csv("employee_nonactive.csv", active_fields, [e for e in employees if e["STATUS EMPLOYMENT"] == "Non-Active"])

DATE_START = date(2025, 1, 1)
DATE_END = date(2026, 7, 28)

# ---------------------------------------------------------------------------
# IDN Club
# ---------------------------------------------------------------------------
CLUBS = ["Futsal Club","Photography Club","Book Club","Badminton Club","Music Club",
    "Running Club","Gaming Club","Cooking Club"]
club_rows = []
for i in range(420):
    email = random.choice(all_emails)
    emp = email_to_emp[email]
    d = rand_date(DATE_START, DATE_END)
    club_rows.append({
        "Name": emp["Name"],
        "Email": email,
        "Dep": emp["DEPARTMENT"],
        "Location": emp["LOCATION"],
        "Club": random.choice(CLUBS),
        "Date": d.isoformat(),
        "Year": d.year,
        "Month": d.month,
        "Quarter": quarter_of(d.month),
        "Status": random.choices(["Attended","Registered","Cancelled"], weights=[80,14,6])[0],
    })
write_csv("idn_club.csv", ["Name","Email","Dep","Location","Club","Date","Year","Month","Quarter","Status"], club_rows)

# ---------------------------------------------------------------------------
# IDN Academy - Interactive In-Class Learning
# ---------------------------------------------------------------------------
COURSES = ["Effective Communication","Data Storytelling","Leadership Foundations",
    "Design Thinking","Negotiation Skills","Content Strategy","Excel for Analysts",
    "Project Management Essentials","Public Speaking","People Management 101"]
academy_class_rows = []
for i in range(380):
    email = random.choice(all_emails)
    emp = email_to_emp[email]
    d = rand_date(DATE_START, DATE_END)
    hours = random.choice([1,1.5,2,2,3,4])
    academy_class_rows.append({
        "Name": emp["Name"],
        "Email": email,
        "Dep": emp["DEPARTMENT"],
        "Location": emp["LOCATION"],
        "Direct Report": emp["DIRECT REPORT"],
        "Course": random.choice(COURSES),
        "Date": d.isoformat(),
        "Year": d.year,
        "Month": d.month,
        "Quarter": quarter_of(d.month),
        "Learning Hours": hours,
        "Status": random.choices(["Completed","In Progress","No Show"], weights=[78,14,8])[0],
    })
write_csv("idn_academy_inclass.csv",
    ["Name","Email","Dep","Location","Direct Report","Course","Date","Year","Month","Quarter","Learning Hours","Status"],
    academy_class_rows)

# ---------------------------------------------------------------------------
# IDN Academy - Internal Internship
# ---------------------------------------------------------------------------
internship_rows = []
interns = random.sample(active_emails, 22)
for email in interns:
    emp = email_to_emp[email]
    host = random.choice([d for d in DEPARTMENTS if d != emp["DEPARTMENT"]])
    start = rand_date(DATE_START, date(2026, 5, 1))
    hours = random.randint(20, 120)
    internship_rows.append({
        "Name": emp["Name"],
        "Email": email,
        "Home Department": emp["DEPARTMENT"],
        "Host Department": host,
        "Date": start.isoformat(),
        "Year": start.year,
        "Month": start.month,
        "Quarter": quarter_of(start.month),
        "Learning Hours": hours,
        "Status": random.choices(["Completed","Ongoing","Withdrawn"], weights=[60,32,8])[0],
    })
write_csv("idn_academy_internship.csv",
    ["Name","Email","Home Department","Host Department","Date","Year","Month","Quarter","Learning Hours","Status"],
    internship_rows)

# ---------------------------------------------------------------------------
# IDN Kudos
# ---------------------------------------------------------------------------
KUDOS_VALUES = ["Collaboration","Ownership","Innovation","Speed","Integrity","Customer Obsession"]
kudos_rows = []
for i in range(500):
    sender = random.choice(active_emails)
    receiver = random.choice([e for e in active_emails if e != sender])
    s_emp = email_to_emp[sender]
    r_emp = email_to_emp[receiver]
    created = rand_date(DATE_START, DATE_END)
    decision_days = random.choice([0,0,1,1,2,3,5,7])
    modified = created + timedelta(days=decision_days)
    status = random.choices(["Approved","Rejected","Pending"], weights=[82,6,12])[0]
    kudos_rows.append({
        "Sender": s_emp["Name"],
        "Email (from Sender)": sender,
        "Department (from Sender) 2": s_emp["DEPARTMENT"],
        "To": r_emp["Name"],
        "Email (from To)": receiver,
        "Department (from To) 2": r_emp["DEPARTMENT"],
        "Value": random.choice(KUDOS_VALUES),
        "Message": "Great teamwork on the recent project!",
        "created": created.isoformat(),
        "Last Modified": modified.isoformat(),
        "Year": created.year,
        "Month": created.month,
        "Quarter": quarter_of(created.month),
        "Manager Validation": random.choices(["Validated","Not Required","Pending"], weights=[55,35,10])[0],
        "Status": status,
    })
write_csv("idn_kudos.csv",
    ["Sender","Email (from Sender)","Department (from Sender) 2","To","Email (from To)",
     "Department (from To) 2","Value","Message","created","Last Modified","Year","Month",
     "Quarter","Manager Validation","Status"],
    kudos_rows)

# ---------------------------------------------------------------------------
# Timmy of the Month
# ---------------------------------------------------------------------------
totm_rows = []
months_seq = []
y, m = 2025, 1
while (y, m) <= (2026, 7):
    months_seq.append((y, m))
    m += 1
    if m > 12:
        m = 1
        y += 1
for (y, m) in months_seq:
    winners = random.sample(active_emails, 2)
    for email in winners:
        emp = email_to_emp[email]
        totm_rows.append({
            "Name": emp["Name"],
            "Email": email,
            "Job Position": emp["Position Name"],
            "Current Dept.": emp["DEPARTMENT"],
            "Year": y,
            "Month": m,
            "Quarter": quarter_of(m),
            "Status": "Winner",
        })
write_csv("timmy_of_the_month.csv",
    ["Name","Email","Job Position","Current Dept.","Year","Month","Quarter","Status"],
    totm_rows)

print("Generated mock data files:")
import os
for f in sorted(os.listdir(".")):
    if f.endswith(".csv"):
        print(" -", f)
