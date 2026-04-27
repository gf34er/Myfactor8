// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA0NYofLM70IA7cTbwR_jMaxxpDmsoGCyo",
  authDomain: "myfactor-7bd68.firebaseapp.com",
  projectId: "myfactor-7bd68",
  storageBucket: "myfactor-7bd68.firebasestorage.app",
  messagingSenderId: "93673990627",
  appId: "1:93673990627:web:7a763173c4bbba31f958d6"
});

const messaging = firebase.messaging();

// Логика отображения баннера, когда приложение закрыто
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});