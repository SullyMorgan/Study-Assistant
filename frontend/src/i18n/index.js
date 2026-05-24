import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  hu: {
    translation: {
      "appName": "Study Assistant",
      "subtitle": "A személyes tanulmányi asszisztensed",
      "joinToday": "Csatlakozz a Study Assistant-hez még ma",
      "login": "Bejelentkezés",
      "register": "Regisztráció",
      "createAccount": "Fiók létrehozása",
      "noAccount": "Még nincs fiókod? Regisztrálj itt!",
      "alreadyAccount": "Már van fiókod? Jelentkezz be!",
      "save": "Mentés",

      "namePlace": "Név",
      "emailPlace": "Email cím",
      "passwordPlace": "Jelszó",
      "confirmPasswordPlace": "Jelszó megerősítése",

      "myProfile": "Saját Fiókom",
      "changePassword": "Jelszó megváltoztatása",
      "changeLanguage": "Nyelv / Language",
      "logout": "Kijelentkezés",

      "errorTitle": "Hiba",
      "successTitle": "Siker",
      "fillAllFields": "Kérlek tölts ki minden mezőt!",
      "fillEmailPass": "Kérlek add meg az email címedet és a jelszavadat!",
      "passNotMatch": "A két jelszó nem egyezik!",
      "regSuccess": "Sikeres regisztráció! Most már bejelentkezhetsz.",
      "loginFailed": "Bejelentkezési hiba",
      "incorrectCreds": "Hibás email cím vagy jelszó.",
      "logoutConfirmTitle": "Kijelentkezés",
      "logoutConfirmMsg": "Biztosan ki szeretnél jelentkezni a fiókodból?",
      "cancel": "Mégse",
      "underDevelopment": "Fejlesztés alatt",
      "regFailed": "Regisztrációs hiba",

      "dashboard": "Kezdőlap",
      "materials": "Tananyagok",
      "calendar": "Naptár",
      "profile": "Profil",
      
      "currentPasswordPlace": "Jelenlegi jelszó",
      "newPasswordPlace": "Új jelszó",
      "confirmNewPasswordPlace": "Új jelszó megerősítése",
      "passChangedSuccess": "A jelszó sikeresen megváltoztatva!",
      "taskTitlePlace": "Feladat címe",

      "urgentDeadlines": "Sürgős határidők",
      "yourTasks": "Feladataid",
      "hello": "Szia",
      "noUrgentTasks": "Nincsenek sürgős határidők",
      "noTasks": "Nincsenek feladataid",
      "user": "Felhasználó",

      "exam": "Vizsga",
      "assignment": "Házi feladat",
      "project": "Projekt",
      "other": "Egyéb",

      "addNewTask": "Új feladat hozzáadása",
      "taskTitle": "Feladat címe",
      "taskType": "Feladat típusa",
      "selectClass": "Tantárgy kiválasztása",

      "classes": "Tantárgyak",
      "noClasses": "Még nem adtál hozzá egy tantárgyat sem. Kattints a '+' gombra a kezdéshez!",
      "myClasses": "Tantárgyaim",
      "classSubtitle": "Itt találod az összes regisztrált tantárgyadat.",
      "addNewClass": "Új tantárgy hozzáadása",
      "className": "Tantárgy neve",
      "classNamePlace": "Írd be a tantárgy nevét",
      "difficulty": "Nehézség (1-10)",

      // calendar screen
      "endTimeError": "A befejezés időpontjának a kezdés után kell lennie",
      "whichDay": "Melyik nap?",
      "whatTime": "Mikor? (Órák)",
      "scheduleCreateFailed": "Nem sikerült létrehozni. Kérlek próbáld újra.",
      "setYourSchedule": "Állítsd be a programjaidat",
      "yourEvents": "Eseményeid",
      "noEvents": "Nincsenek ütemezett eseményeid.",
      "startTime": "Kezdés",
      "endTime": "Befejezés",
      "createSchedule": "Esemény hozzáadása a programodhoz",
      "calendar": "Naptár",
    }
  },
  en: {
    translation: {
      "appName": "Study Assistant",
      "subtitle": "Your personal study companion",
      "joinToday": "Join Study Assistant today",
      "login": "Login",
      "register": "Register",
      "createAccount": "Create Account",
      "noAccount": "Don't have an account? Register here.",
      "alreadyAccount": "Already have an account? Log in",
      "save": "Save",
      
      "namePlace": "Name",
      "emailPlace": "Email",
      "passwordPlace": "Password",
      "confirmPasswordPlace": "Confirm Password",

      "myProfile": "My Profile",
      "changePassword": "Change Password",
      "changeLanguage": "Language / Nyelv",
      "logout": "Logout",

      "errorTitle": "Error",
      "successTitle": "Success",
      "fillAllFields": "Please fill in all fields",
      "fillEmailPass": "Please enter both email and password",
      "passNotMatch": "Passwords do not match",
      "regSuccess": "Registration successful. Please log in.",
      "loginFailed": "Login Failed",
      "incorrectCreds": "Incorrect email or password.",
      "logoutConfirmTitle": "Logout",
      "logoutConfirmMsg": "Are you sure you want to log out of your account?",
      "cancel": "Cancel",
      "underDevelopment": "Under development",
      "regFailed": "Registration failed. Please try again.",

      "dashboard": "Dashboard",
      "materials": "Materials",
      "calendar": "Calendar",
      "profile": "Profile",

      "currentPasswordPlace": "Current password",
      "newPasswordPlace": "New password",
      "confirmNewPasswordPlace": "Confirm new password",
      "passChangedSuccess": "Password changed successfully!",
      "taskTitlePlace": "Task title",

      "urgentDeadlines": "Urgent Deadlines",
      "yourTasks": "Your Tasks",
      "hello": "Hello",
      "noUrgentTasks": "No urgent deadlines",
      "noTasks": "You have no tasks",
      "user": "User",

      "exam": "Exam",
      "assignment": "Assignment",
      "project": "Project",
      "other": "Other",

      "addNewTask": "Add New Task",
      "taskTitle": "Task Title",
      "taskType": "Task Type",
      "selectClass": "Select Class",
      "createTask": "Create Task",

      "noClasses": "You haven't added any courses yet. Click '+' to get started!",
      "myClasses": "My Courses",
      "classSubtitle": "Here are all your registered courses.",
      "addNewClass": "Add New Course",
      "className": "Course Name",
      "classNamePlace": "Enter course name",
      "difficulty": "Difficulty (1-10)",

      // calendar screen
      "endTimeError": "End time must be after start time",
      "whichDay": "Which day?",
      "whatTime": "What Time? (Hours)",
      "scheduleCreateFailed": "Failed to create schedule. Please try again.",
      "setYourSchedule": "Set Your Schedule",
      "yourEvents": "Your Events",
      "noEvents": "You have no events scheduled.",
      "startTime": "Starts",
      "endTime": "Ends",
      "createSchedule": "Add an event to your schedule",
      "calendar": "Calendar",
    }
  },
  ro: {
    translation: {
      "appName": "Study Assistant",
      "subtitle": "Asistentul tău personal de studiu",
      "joinToday": "Alătură-te Study Assistant astăzi",
      "login": "Autentificare",
      "register": "Înregistrare",
      "createAccount": "Creare cont",
      "noAccount": "Nu ai cont? Înregistrează-te aici.",
      "alreadyAccount": "Ai deja un cont? Autentifică-te",
      "save": "Salvează",
      
      "namePlace": "Nume",
      "emailPlace": "Email",
      "passwordPlace": "Parolă",
      "confirmPasswordPlace": "Confirmare parolă",
      "taskTitlePlace": "Titlu sarcină",

      "myProfile": "Profilul Meu",
      "changePassword": "Schimbare parolă",
      "changeLanguage": "Limbă / Language",
      "logout": "Deconectare",

      "errorTitle": "Eroare",
      "successTitle": "Succes",
      "fillAllFields": "Vă rugăm să completați toate câmpurile",
      "fillEmailPass": "Vă rugăm să introduceți emailul și parola",
      "passNotMatch": "Parolele nu se potrivesc",
      "regSuccess": "Înregistrare reușită. Vă rugăm să vă autentificați.",
      "loginFailed": "Autentificare eșuată",
      "incorrectCreds": "Email sau parolă incorectă.",
      "logoutConfirmTitle": "Deconectare",
      "logoutConfirmMsg": "Sigur dorești să te deconectezi din cont?",
      "cancel": "Anulare",
      "underDevelopment": "În curs de dezvoltare",
      "regFailed": "Înregistrare eșuată. Vă rugăm să încercați din nou.",

      "dashboard": "Pagina principală",
      "materials": "Materiale",
      "calendar": "Calendar",
      "profile": "Profil",

      "currentPasswordPlace": "Parola actuală",
      "newPasswordPlace": "Parola nouă",
      "confirmNewPasswordPlace": "Confirmare parola nouă",
      "passChangedSuccess": "Parola a fost schimbată cu succes!",

      "urgentDeadlines": "Termene limită urgente",
      "yourTasks": "Sarcinile tale",
      "hello": "Salut",
      "noUrgentTasks": "Nu există termene limită urgente",
      "noTasks": "Nu ai sarcini",
      "user": "Utilizator",

      "exam": "Examen",
      "assignment": "Temă",
      "project": "Proiect",
      "other": "Altele",

      "addNewTask": "Adaugă sarcină nouă",
      "taskTitle": "Titlu sarcină",
      "taskType": "Tipul sarcinii",
      "selectClass": "Selectează materia",
      "createTask": "Creează sarcină",

      "noClasses": "Nu ai adăugat încă niciun curs. Apasă '+' pentru a începe!",
      "myClasses": "Cursurile mele",
      "classSubtitle": "Aici sunt toate cursurile tale înregistrate.",
      "addNewClass": "Adaugă curs nou",
      "className": "Numele cursului",
      "classNamePlace": "Introduceți numele cursului",
      "difficulty": "Dificultate (1-10)",

      "endTimeError": "Ora de sfârșit trebuie să fie după ora de început",
      "whichDay": "În ce zi?",
      "whatTime": "La ce oră? (Ore)",
      "scheduleCreateFailed": "Nu s-a putut crea programarea. Vă rugăm să încercați din nou.",
      "setYourSchedule": "Setează-ți programul",
      "yourEvents": "Evenimentele tale",
      "noEvents": "Nu ai evenimente programate.",
      "startTime": "Începe",
      "endTime": "Se termină",
      "createSchedule": "Adaugă un eveniment în programul tău",
      "calendar": "Calendar",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
