import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Language } from '../types';

type TranslationKey =
  | 'browse' | 'dashboard' | 'myProperty' | 'contracts' | 'maintenance'
  | 'signIn' | 'getStarted' | 'signOut' | 'settings' | 'admin' | 'superAdmin'
  | 'available' | 'occupied' | 'perMonth' | 'bookProperty' | 'loginToBook'
  | 'contactOwner' | 'sendMessage' | 'messageSent' | 'amenities' | 'about'
  | 'location' | 'back' | 'loading' | 'noProperties' | 'searchLocation'
  | 'search' | 'filters' | 'clearFilters' | 'availableProperties'
  | 'propertiesFound' | 'propertyFound' | 'bookingRequest' | 'bookingMessage'
  | 'submitBooking' | 'bookingSuccess' | 'category' | 'type' | 'subcategory'
  | 'minPrice' | 'maxPrice' | 'anyCategory' | 'anyType' | 'anySubcategory'
  | 'applyFilters' | 'reset' | 'longTermRentals' | 'heroTitle' | 'heroSub'
  | 'name' | 'email' | 'password' | 'language' | 'saveChanges' | 'userSettings'
  | 'changePassword' | 'newPassword' | 'confirmPassword' | 'profileUpdated'
  | 'passwordUpdated' | 'english' | 'french' | 'kinyarwanda' | 'forgotPassword'
  | 'sendResetLink' | 'resetEmailSent' | 'backToLogin' | 'resetPassword' | 'prev' | 'next' | 'messages'
  | 'propertyLocation' | 'openInMap' | 'profileInformation' | 'home';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    browse: 'Browse', dashboard: 'Dashboard', myProperty: 'My Property',
    contracts: 'Contracts', maintenance: 'Maintenance', signIn: 'Sign in',
    getStarted: 'Get started', signOut: 'Sign out', settings: 'Settings',
    admin: 'Admin', superAdmin: 'Super Admin', available: 'Available',
    occupied: 'Occupied', perMonth: '/month', bookProperty: 'Book this Property',
    loginToBook: 'Sign in to book', contactOwner: 'Contact Owner',
    sendMessage: 'Send Message', messageSent: 'Message sent ✓',
    amenities: 'Amenities', about: 'About this property', location: 'Location',
    back: '← Back', loading: 'Loading...', noProperties: 'No properties found',
    searchLocation: 'Search by location...', search: 'Search',
    filters: 'Filters', clearFilters: 'Clear filters',
    availableProperties: 'Available Properties',
    propertiesFound: 'properties found', propertyFound: 'property found',
    bookingRequest: 'Book / Rent this Property',
    bookingMessage: 'Tell the owner why you want to rent this property...',
    submitBooking: 'Submit Booking Request', bookingSuccess: 'Booking request sent!',
    category: 'Category', type: 'Type', subcategory: 'Subcategory',
    minPrice: 'Min price', maxPrice: 'Max price',
    anyCategory: 'Any category', anyType: 'Any type', anySubcategory: 'Any subcategory',
    applyFilters: 'Apply filters', reset: 'Reset',
    longTermRentals: 'Long-term rentals',
    heroTitle: 'Find your place. Stay a while.',
    heroSub: 'Browse verified long-term rental properties — apartments, houses, studios and more.',
    name: 'Full Name', email: 'Email', password: 'Password', language: 'Language',
    saveChanges: 'Save Changes', userSettings: 'Account Settings',
    changePassword: 'Change Password', newPassword: 'New Password',
    confirmPassword: 'Confirm Password', profileUpdated: 'Profile updated!',
    passwordUpdated: 'Password updated!', english: 'English', french: 'French',
    kinyarwanda: 'Kinyarwanda', forgotPassword: 'Forgot password?',
    sendResetLink: 'Send Reset Link', resetEmailSent: 'Reset link sent! Check your email.',
    backToLogin: 'Back to Login', resetPassword: 'Reset Password',
    prev: 'Prev', next: 'Next', messages: 'Messages',
    propertyLocation: 'Property Location', openInMap: 'Open in Full Map',
    profileInformation: 'Profile Information',
    home: 'Home',
  },
  fr: {
    browse: 'Parcourir', dashboard: 'Tableau de bord', myProperty: 'Ma Propriété',
    contracts: 'Contrats', maintenance: 'Maintenance', signIn: 'Se connecter',
    getStarted: 'Commencer', signOut: 'Se déconnecter', settings: 'Paramètres',
    admin: 'Admin', superAdmin: 'Super Admin', available: 'Disponible',
    occupied: 'Occupé', perMonth: '/mois', bookProperty: 'Réserver cette propriété',
    loginToBook: 'Connexion pour réserver', contactOwner: 'Contacter le propriétaire',
    sendMessage: 'Envoyer', messageSent: 'Message envoyé ✓',
    amenities: 'Équipements', about: 'À propos de ce bien', location: 'Localisation',
    back: '← Retour', loading: 'Chargement...', noProperties: 'Aucune propriété trouvée',
    searchLocation: 'Rechercher par lieu...', search: 'Rechercher',
    filters: 'Filtres', clearFilters: 'Effacer les filtres',
    availableProperties: 'Propriétés disponibles',
    propertiesFound: 'propriétés trouvées', propertyFound: 'propriété trouvée',
    bookingRequest: 'Réserver / Louer ce bien',
    bookingMessage: 'Dites au propriétaire pourquoi vous souhaitez louer ce bien...',
    submitBooking: 'Envoyer la demande', bookingSuccess: 'Demande envoyée!',
    category: 'Catégorie', type: 'Type', subcategory: 'Sous-catégorie',
    minPrice: 'Prix min', maxPrice: 'Prix max',
    anyCategory: 'Toute catégorie', anyType: 'Tout type', anySubcategory: 'Toute sous-catégorie',
    applyFilters: 'Appliquer les filtres', reset: 'Réinitialiser',
    longTermRentals: 'Locations longue durée',
    heroTitle: 'Trouvez votre chez-vous. Restez un moment.',
    heroSub: 'Parcourez des propriétés locatives vérifiées — appartements, maisons, studios et plus.',
    name: 'Nom complet', email: 'Email', password: 'Mot de passe', language: 'Langue',
    saveChanges: 'Enregistrer', userSettings: 'Paramètres du compte',
    changePassword: 'Changer le mot de passe', newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe', profileUpdated: 'Profil mis à jour!',
    passwordUpdated: 'Mot de passe mis à jour!', english: 'Anglais', french: 'Français',
    kinyarwanda: 'Kinyarwanda', forgotPassword: 'Mot de passe oublié ?',
    sendResetLink: 'Envoyer le lien', resetEmailSent: 'Lien envoyé ! Vérifiez vos emails.',
    backToLogin: 'Retour à la connexion', resetPassword: 'Réinitialiser',
    prev: 'Précédent', next: 'Suivant', messages: 'Messages',
    propertyLocation: 'Localisation du bien', openInMap: 'Ouvrir la carte',
    profileInformation: 'Informations du profil',
    home: 'Accueil',
  },
  rw: {
    browse: 'Reba', dashboard: 'Ikibaho', myProperty: 'Inzu Yanjye',
    contracts: 'Amasezerano', maintenance: 'Isanura', signIn: 'Injira',
    getStarted: 'Tangira', signOut: 'Sohoka', settings: 'Igenamiterere',
    admin: 'Ubuyobozi', superAdmin: 'Ubuyobozi Bukuru', available: 'Iboneka',
    occupied: 'Yuzuye', perMonth: '/ukwezi', bookProperty: 'Fata ino nzu',
    loginToBook: 'Injira kufata', contactOwner: 'Vugisha nyir\'inzu',
    sendMessage: 'Ohereza', messageSent: 'Ubutumwa bwoherejwe ✓',
    amenities: 'Ibikoresho', about: 'Ibyerekeye inzu iyi', location: 'Aho iherereye',
    back: '← Subira', loading: 'Gutegereza...', noProperties: 'Nta nzu ibonetse',
    searchLocation: 'Shakisha aho...', search: 'Shakisha',
    filters: 'Gutoranya', clearFilters: 'Siba gutoranya',
    availableProperties: 'Inzu Zibonetse',
    propertiesFound: 'inzu zibonetse', propertyFound: 'inzu ibonetse',
    bookingRequest: 'Fata / Hire iyi nzu',
    bookingMessage: 'Bwira nyir\'inzu impamvu ushaka gutuza ino nzu...',
    submitBooking: 'Ohereza gufata', bookingSuccess: 'Ubusabe bwoherejwe!',
    category: 'Icyiciro', type: 'Ubwoko', subcategory: 'Icyiciro gito',
    minPrice: 'Igiciro cyo hasi', maxPrice: 'Igiciro cyo hejuru',
    anyCategory: 'Icyiciro cyose', anyType: 'Ubwoko bwose', anySubcategory: 'Icyiciro cyose',
    applyFilters: 'Shyira gutoranya', reset: 'Subira aho',
    longTermRentals: 'Kugurisha igihe kirekire',
    heroTitle: 'Shaka aho utuye. Tiga igihe.',
    heroSub: 'Reba inzu zizwi zo gukodesha igihe kirekire — amazu, amazu manini, studio na byinshi.',
    name: 'Amazina yuzuye', email: 'Imeyili', password: 'Ijambo ry\'ibanga', language: 'Ururimi',
    saveChanges: 'Bika impinduka', userSettings: 'Igenamiterere ry\'konti',
    changePassword: 'Hindura ijambo ry\'ibanga', newPassword: 'Ijambo ry\'ibanga rishya',
    confirmPassword: 'Emeza ijambo ry\'ibanga', profileUpdated: 'Umwirondoro wasuzumwe!',
    passwordUpdated: 'Ijambo ry\'ibanga ryahindutse!', english: 'Icyongereza', french: 'Igifaransa',
    kinyarwanda: 'Kinyarwanda', forgotPassword: 'Wibagiwe ijambo ry\'ibanga?',
    sendResetLink: 'Ohereza ihuzanshu', resetEmailSent: 'Ihuza ryo guhindura ryoherejwe! Reba imeyili yawe.',
    backToLogin: 'Subira aho winjirira', resetPassword: 'Hindura ijambo ry\'ibanga',
    prev: 'Ibanze', next: 'Imbere', messages: 'Ubutumwa',
    propertyLocation: 'Aho inzu iherereye', openInMap: 'Fungura ikarita',
    profileInformation: 'Amakuru y\'umwirondoro',
    home: 'Ahabanza',
  },
};

interface LangContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (k) => k,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLang] = useState<Language>(() => {
    return (localStorage.getItem('hive_lang') as Language) || 'en';
  });

  const setLanguage = (l: Language) => {
    setLang(l);
    localStorage.setItem('hive_lang', l);
  };

  const t = (key: TranslationKey) => translations[language][key] ?? key;

  return (
    <LangContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
