# Atelier Aurelia

Configurateur de bague 3D open source construit avec React, TypeScript et React Three Fiber.

## Fonctionnalités

- Rendu 3D procédural et interactif, sans modèle externe
- Choix du métal, de la pierre, de la taille et du poids en carats
- Gravure personnalisée visible sur l’anneau
- Moteur de contraintes empêchant les collisions pierre, pavage et métal
- Estimation de prix instantanée
- Sauvegarde locale automatique
- Liens de configuration partageables
- Export PNG de la création
- Interface responsive et accessible au clavier

La construction 3D suit une architecture de joaillerie réelle. Les modèles CAD étudiés et les choix de licence sont documentés dans [CAD_SOURCES.md](./CAD_SOURCES.md).

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrez `http://localhost:5173`.

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : vérification TypeScript et build de production
- `npm run lint` : analyse statique
- `npm run preview` : aperçu du build

## Stack

React 19, TypeScript, Vite, Three.js, React Three Fiber, Drei et Lucide.

## Licence

MIT. Vous pouvez utiliser, modifier et distribuer ce projet librement.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
