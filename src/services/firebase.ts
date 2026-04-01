import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD41mdsV4H7NRITOBiacrH0vvJun7b-BQg',
  authDomain: 'brew-pick.firebaseapp.com',
  projectId: 'brew-pick',
  storageBucket: 'brew-pick.firebasestorage.app',
  messagingSenderId: '909126011826',
  appId: '1:909126011826:web:c3dd61ace9add238d3b2ab',
  measurementId: 'G-M35X5R8GE8',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
