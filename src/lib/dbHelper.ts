import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Room, StudentSubmission } from '../types';

let useLocalStorageOnly = false;

export const setLocalStorageOnly = (val: boolean) => {
  useLocalStorageOnly = val;
};

export const isLocalStorageOnly = () => useLocalStorageOnly;

// 1. Get Rooms
export const getRoomsHelper = async (): Promise<Room[]> => {
  if (useLocalStorageOnly) {
    return getLocalRooms();
  }
  try {
    const snap = await getDocs(query(collection(db, 'rooms')));
    const list: Room[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Room));
    return list;
  } catch (err) {
    console.warn("Firestore getRooms failed, switching to LocalStorage:", err);
    useLocalStorageOnly = true;
    return getLocalRooms();
  }
};

// 2. Add Room
export const addRoomHelper = async (room: Omit<Room, 'id'>): Promise<string> => {
  if (useLocalStorageOnly) {
    return addLocalRoom(room);
  }
  try {
    const docRef = await addDoc(collection(db, 'rooms'), room);
    return docRef.id;
  } catch (err) {
    console.warn("Firestore addRoom failed, switching to LocalStorage:", err);
    useLocalStorageOnly = true;
    return addLocalRoom(room);
  }
};

// 3. Find Room by Code
export const findRoomByCodeHelper = async (code: string): Promise<Room | null> => {
  if (useLocalStorageOnly) {
    const rooms = getLocalRooms();
    const found = rooms.find(r => r.room_code === code.toUpperCase());
    return found || null;
  }
  try {
    const q = query(collection(db, 'rooms'), where('room_code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Room;
    }
    return null;
  } catch (err) {
    console.warn("Firestore findRoomByCode failed, switching to LocalStorage:", err);
    useLocalStorageOnly = true;
    const rooms = getLocalRooms();
    const found = rooms.find(r => r.room_code === code.toUpperCase());
    return found || null;
  }
};

// 4. Get Submissions
export const getSubmissionsHelper = async (roomCode: string): Promise<StudentSubmission[]> => {
  if (useLocalStorageOnly) {
    return getLocalSubmissions(roomCode);
  }
  try {
    const q = query(collection(db, 'submissions'), where('room_code', '==', roomCode.toUpperCase()));
    const snap = await getDocs(q);
    const list: StudentSubmission[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as StudentSubmission));
    return list;
  } catch (err) {
    console.warn("Firestore getSubmissions failed, switching to LocalStorage:", err);
    useLocalStorageOnly = true;
    return getLocalSubmissions(roomCode);
  }
};

// 5. Get Single Submission
export const getSubmissionHelper = async (roomCode: string, studentName: string): Promise<StudentSubmission | null> => {
  if (useLocalStorageOnly) {
    const subs = getLocalSubmissions(roomCode);
    const found = subs.find(s => s.student_name === studentName);
    return found || null;
  }
  try {
    const q = query(
      collection(db, 'submissions'),
      where('room_code', '==', roomCode.toUpperCase()),
      where('student_name', '==', studentName)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as StudentSubmission;
    }
    return null;
  } catch (err) {
    console.warn("Firestore getSubmission failed, switching to LocalStorage:", err);
    useLocalStorageOnly = true;
    const subs = getLocalSubmissions(roomCode);
    const found = subs.find(s => s.student_name === studentName);
    return found || null;
  }
};

// 6. Save or Update Submission
export const saveSubmissionHelper = async (
  id: string | null,
  submission: Omit<StudentSubmission, 'id'>
): Promise<string> => {
  if (useLocalStorageOnly) {
    return saveLocalSubmission(id, submission);
  }
  try {
    if (id) {
      await updateDoc(doc(db, 'submissions', id), submission);
      return id;
    } else {
      const docRef = await addDoc(collection(db, 'submissions'), submission);
      return docRef.id;
    }
  } catch (err) {
    console.warn("Firestore saveSubmission failed, switching to LocalStorage:", err);
    useLocalStorageOnly = true;
    return saveLocalSubmission(id, submission);
  }
};

// LocalStorage Native operations
function getLocalRooms(): Room[] {
  const rooms = localStorage.getItem('jamclass_rooms');
  return rooms ? JSON.parse(rooms) : [];
}

function addLocalRoom(room: Omit<Room, 'id'>): string {
  const rooms = getLocalRooms();
  const id = 'local_' + Math.random().toString(36).substr(2, 9);
  const newRoom = { id, ...room };
  rooms.push(newRoom);
  localStorage.setItem('jamclass_rooms', JSON.stringify(rooms));
  return id;
}

function getLocalSubmissions(roomCode: string): StudentSubmission[] {
  const subs = localStorage.getItem('jamclass_submissions');
  const allSubs: StudentSubmission[] = subs ? JSON.parse(subs) : [];
  return allSubs.filter(s => s.room_code === roomCode.toUpperCase());
}

function saveLocalSubmission(id: string | null, submission: Omit<StudentSubmission, 'id'>): string {
  const subsStr = localStorage.getItem('jamclass_submissions');
  const allSubs: StudentSubmission[] = subsStr ? JSON.parse(subsStr) : [];
  
  if (id) {
    const idx = allSubs.findIndex(s => s.id === id);
    if (idx !== -1) {
      allSubs[idx] = { id, ...submission };
    }
  } else {
    id = 'local_sub_' + Math.random().toString(36).substr(2, 9);
    allSubs.push({ id, ...submission });
  }
  
  localStorage.setItem('jamclass_submissions', JSON.stringify(allSubs));
  return id;
}
