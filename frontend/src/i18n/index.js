import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  hu: {
    translation: {
      // Login & Register
      "appName": "Study Assistant",
      "subtitle": "A személyes tanulmányi asszisztensed",
      "joinToday": "Csatlakozz a Study Assistant-hez még ma",
      "login": "Bejelentkezés",
      "register": "Regisztráció",
      "createAccount": "Fiók létrehozása",
      "noAccount": "Még nincs fiókod? Regisztrálj itt!",
      "alreadyAccount": "Már van fiókod? Jelentkezz be!",
      "save": "Mentés",

      // Mezők placeholders
      "namePlace": "Név",
      "emailPlace": "Email cím",
      "passwordPlace": "Jelszó",
      "confirmPasswordPlace": "Jelszó megerősítése",

      // Profil oldal
      "myProfile": "Saját Fiókom",
      "changePassword": "Jelszó megváltoztatása",
      "changeLanguage": "Nyelv / Language",
      "logout": "Kijelentkezés",

      // Felugró ablakok (Alerts) & Validációk
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

      // navigator
      "dashboard": "Kezdőlap",
      "materials": "Tananyagok",
      "calendar": "Naptár",
      "profile": "Profil",
      
      "currentPasswordPlace": "Jelenlegi jelszó",
      "newPasswordPlace": "Új jelszó",
      "confirmNewPasswordPlace": "Új jelszó megerősítése",
      "passChangedSuccess": "A jelszó sikeresen megváltoztatva!",
    }
  },
  en: {
    translation: {
      // Login & Register General
      "appName": "Study Assistant",
      "subtitle": "Your personal study companion",
      "joinToday": "Join Study Assistant today",
      "login": "Login",
      "register": "Register",
      "createAccount": "Create Account",
      "noAccount": "Don't have an account? Register here.",
      "alreadyAccount": "Already have an account? Log in",
      "save": "Save",
      
      // Field placeholders
      "namePlace": "Name",
      "emailPlace": "Email",
      "passwordPlace": "Password",
      "confirmPasswordPlace": "Confirm Password",

      // Profile page
      "myProfile": "My Profile",
      "changePassword": "Change Password",
      "changeLanguage": "Language / Nyelv",
      "logout": "Logout",

      // Alerts & Validations
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

      // navigator
      "dashboard": "Dashboard",
      "materials": "Materials",
      "calendar": "Calendar",
      "profile": "Profile",

      "currentPasswordPlace": "Current password",
      "newPasswordPlace": "New password",
      "confirmNewPasswordPlace": "Confirm new password",
      "passChangedSuccess": "Password changed successfully!",
    }
  },
  ro: {
    translation: {
      // Login & Register General
      "appName": "Study Assistant",
      "subtitle": "Asistentul tău personal de studiu",
      "joinToday": "Alătură-te Study Assistant astăzi",
      "login": "Autentificare",
      "register": "Înregistrare",
      "createAccount": "Creare cont",
      "noAccount": "Nu ai cont? Înregistrează-te aici.",
      "alreadyAccount": "Ai deja un cont? Autentifică-te",
      "save": "Salvează",
      
      // Field placeholders
      "namePlace": "Nume",
      "emailPlace": "Email",
      "passwordPlace": "Parolă",
      "confirmPasswordPlace": "Confirmare parolă",

      // Profile page
      "myProfile": "Profilul Meu",
      "changePassword": "Schimbare parolă",
      "changeLanguage": "Limbă / Language",
      "logout": "Deconectare",

      // Alerts & Validations
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

      // navigator
      "dashboard": "Pagina principală",
      "materials": "Materiale",
      "calendar": "Calendar",
      "profile": "Profil",

      "currentPasswordPlace": "Parola actuală",
      "newPasswordPlace": "Parola nouă",
      "confirmNewPasswordPlace": "Confirmare parola nouă",
      "passChangedSuccess": "Parola a fost schimbată cu succes!",
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
