import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const debugCheckUserSlug = async (slug: string) => {
  console.log('Searching for slug:', slug);
  const q = query(collection(db, 'users'), where('ownerSettings.slug', '==', slug));
  const snap = await getDocs(q);
  console.log('Found docs:', snap.size);
  snap.forEach(d => {
    console.log('ID:', d.id, 'Data:', d.data());
  });
};
