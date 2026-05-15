// js/config.js — Firebase configuration for Duoc UC Bibliotecas
// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES DE CONFIGURACIÓN (solo el Administrador realiza esto una vez):
//
// 1. Ir a https://console.firebase.google.com/
// 2. Crear un nuevo proyecto (ej: "duoc-bibliotecas")
// 3. En el proyecto → Realtime Database → Crear base de datos → Modo de prueba
// 4. En Configuración del proyecto → Tus aplicaciones → Web (</>)
// 5. Registrar app y copiar el objeto firebaseConfig
// 6. Reemplazar los valores de FIREBASE_CONFIG abajo con los de tu proyecto
// 7. En Realtime Database → Reglas, pegar las siguientes reglas y publicar:
//
//    {
//      "rules": {
//        "data": {
//          ".read": true,
//          ".write": "auth == null"
//        }
//      }
//    }
//
//    (lectura pública, escritura solo desde el mismo origen — suficiente para
//     un sistema cerrado con contraseña de aplicación como este)
// ─────────────────────────────────────────────────────────────────────────────

window.DUOC_FIREBASE_CONFIG = {
  apiKey:            "",
  authDomain:        "",
  databaseURL:       "",
  projectId:         "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             "",
};

// Si databaseURL está vacío, la app funciona en modo local (localStorage).
// Una vez configurado Firebase, todos los dispositivos sincronizarán automáticamente.
