import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "my_complaints": "My Complaints",
      "todays_menu": "Today's Menu",
      "all_complaints": "All Complaints",
      "manage_users": "Manage Users",
      "manage_menu": "Manage Menu",
      "my_tasks": "My Tasks",
      "logout": "Logout",
      "submit_complaint": "Submit a Complaint",
      "recent_complaints": "Recent Complaints",
      "title": "Title",
      "category": "Category",
      "description": "Description",
      "submit": "Submit"
    }
  },
  es: {
    translation: {
      "dashboard": "Panel",
      "my_complaints": "Mis Quejas",
      "todays_menu": "Menú de Hoy",
      "all_complaints": "Todas las Quejas",
      "manage_users": "Administrar Usuarios",
      "manage_menu": "Administrar Menú",
      "my_tasks": "Mis Tareas",
      "logout": "Cerrar sesión",
      "submit_complaint": "Presentar una Queja",
      "recent_complaints": "Quejas Recientes",
      "title": "Título",
      "category": "Categoría",
      "description": "Descripción",
      "submit": "Enviar"
    }
  },
  hi: {
    translation: {
      "dashboard": "डैशबोर्ड",
      "my_complaints": "मेरी शिकायतें",
      "todays_menu": "आज का मेनू",
      "all_complaints": "सभी शिकायतें",
      "manage_users": "उपयोगकर्ता प्रबंधित करें",
      "manage_menu": "मेनू प्रबंधित करें",
      "my_tasks": "मेरे कार्य",
      "logout": "लॉग आउट",
      "submit_complaint": "शिकायत दर्ज करें",
      "recent_complaints": "हाल की शिकायतें",
      "title": "शीर्षक",
      "category": "श्रेणी",
      "description": "विवरण",
      "submit": "जमा करें"
    }
  },
  te: {
    translation: {
      "dashboard": "డాష్‌బోర్డ్",
      "my_complaints": "నా ఫిర్యాదులు",
      "todays_menu": "నేటి మెను",
      "all_complaints": "అన్ని ఫిర్యాదులు",
      "manage_users": "వినియోగదారులను నిర్వహించండి",
      "manage_menu": "మెనుని నిర్వహించండి",
      "my_tasks": "నా పనులు",
      "logout": "లాగ్ అవుట్",
      "submit_complaint": "ఫిర్యాదు ఇవ్వండి",
      "recent_complaints": "ఇటీవలి ఫిర్యాదులు",
      "title": "శీర్షిక",
      "category": "వర్గం",
      "description": "వివరణ",
      "submit": "సమర్పించు"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
