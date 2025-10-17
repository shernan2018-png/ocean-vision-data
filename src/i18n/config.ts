import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      nav: {
        dashboard: 'Panel',
        explorer: 'Explorador',
        forecast: 'Pronóstico',
        alerts: 'Alertas',
        settings: 'Configuración',
      },
      common: {
        loading: 'Cargando...',
        error: 'Error',
        save: 'Guardar',
        cancel: 'Cancelar',
        export: 'Exportar CSV',
        filter: 'Filtrar',
        search: 'Buscar',
        login: 'Iniciar sesión',
        signup: 'Registrarse',
        logout: 'Cerrar sesión',
      },
      explorer: {
        title: 'Explorador de Datos Comerciales',
        filters: 'Filtros',
        reporter: 'País Reportero',
        partner: 'País Socio',
        hsCode: 'Código HS',
        flow: 'Flujo',
        frequency: 'Frecuencia',
        period: 'Periodo',
        results: 'Resultados',
        saveQuery: 'Guardar Consulta',
      },
      auth: {
        welcome: 'Bienvenido a Ocean Vision Data',
        signIn: 'Iniciar Sesión',
        signUp: 'Crear Cuenta',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?',
        noAccount: '¿No tienes cuenta?',
        hasAccount: '¿Ya tienes cuenta?',
      },
      premium: {
        title: 'Funciones Premium',
        upgrade: 'Actualizar a Premium',
        forecast: 'Pronóstico con IA',
        alerts: 'Alertas de Precio',
        unlock: 'Desbloquear Premium',
      },
    },
  },
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        explorer: 'Explorer',
        forecast: 'Forecast',
        alerts: 'Alerts',
        settings: 'Settings',
      },
      common: {
        loading: 'Loading...',
        error: 'Error',
        save: 'Save',
        cancel: 'Cancel',
        export: 'Export CSV',
        filter: 'Filter',
        search: 'Search',
        login: 'Log in',
        signup: 'Sign up',
        logout: 'Log out',
      },
      explorer: {
        title: 'Trade Data Explorer',
        filters: 'Filters',
        reporter: 'Reporter Country',
        partner: 'Partner Country',
        hsCode: 'HS Code',
        flow: 'Trade Flow',
        frequency: 'Frequency',
        period: 'Period',
        results: 'Results',
        saveQuery: 'Save Query',
      },
      auth: {
        welcome: 'Welcome to Ocean Vision Data',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
      },
      premium: {
        title: 'Premium Features',
        upgrade: 'Upgrade to Premium',
        forecast: 'AI Forecast',
        alerts: 'Price Alerts',
        unlock: 'Unlock Premium',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
