# NurseCare - Frontend 🏥

Application Vue 3 + TypeScript pour la gestion des soins infirmiers.

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# L'application sera sur http://localhost:5173
```

## 🔑 Identifiants de Test

Pour tester l'application, utilisez :
- **Email** : directeur@nursecare.com (ou secretaire@/infirmier@)
- **Mot de passe** : [à définir dans votre backend]

## 📦 Technologies

- **Vue 3** + Composition API
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **Pinia** - Gestion d'état
- **Vue Router 4** - Routage avec guards
- **Element Plus** - Composants UI
- **Tailwind CSS v4.1** - Styling
- **ApexCharts** - Graphiques
- **FullCalendar** - Calendriers
- **Axios** - HTTP client avec JWT

## 👥 Rôles

### DIRECTEUR
- Graphiques analytiques
- Calendrier stages/écoles
- Accès complet

### SECRETAIRE
- Gestion RDV
- Assignation infirmiers
- Gestion appels

### INFIRMIER
- Calendrier personnel
- Évaluation stagiaires
- Marquer RDV réalisés

## 📋 Modules Disponibles

✅ Authentification (JWT)
✅ Patients (CRUD)
✅ Stagiaires (CRUD)
✅ Prestations (CRUD)
✅ Rendez-vous (CRUD + Calendrier)
✅ Écoles (CRUD)
✅ Catégories (CRUD)
✅ 3 Dashboards par rôle

## 📁 Structure

```
src/
├── components/   # Composants réutilisables
├── services/     # API et auth
├── stores/       # Pinia stores
├── types/        # Types TypeScript
├── views/        # Pages
└── router/       # Routes protégées
```

## 🛠️ Scripts

```bash
npm run dev       # Développement
npm run build     # Production
npm run preview   # Prévisualiser build
```

## 🔐 API Backend

Base URL: `http://localhost:3000/api`

L'application utilise :
- JWT avec refresh token auto
- Intercepteurs Axios
- Guards de navigation par rôle

## 📝 Guide Développement

Voir le fichier README complet pour :
- Structure détaillée
- Conventions de code
- Ajout de nouveaux modules
- Débogage

## 📄 Licence

© 2025 NurseCare
