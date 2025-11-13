import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyD8N0KGQAaTLVLMGDoEUZ5t_GNhXhZYrdY",
    authDomain: "talkflow-b1c10.firebaseapp.com",
    projectId: "talkflow-b1c10",
    storageBucket: "talkflow-b1c10.firebasestorage.app",
    messagingSenderId: "32893931503",
    appId: "1:32893931503:web:0d2fa47fada0a394f6701a",
    measurementId: "G-57SHF3NLSM"
    };

    const app = firebase.initializeApp(firebaseConfig);
    export const db = firebase.firestore(app);
    export const auth = firebase.auth();