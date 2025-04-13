import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyB7Rss9c-jT7H0QgA2UO55sx74ASEoQa0w",
	authDomain: "aess-a56c8.firebaseapp.com",
	projectId: "aess-a56c8",
	storageBucket: "aess-a56c8.firebasestorage.app",
	messagingSenderId: "345526809181",
	appId: "1:345526809181:web:3efb943685b388967cd3b4",
	measurementId: "G-MYPTSH9V48",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
