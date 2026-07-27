// src/services/dbService.ts
// Mesma "interface" de antes, agora rodando no Firebase (Firestore + Auth + Storage).
// As telas do app continuam iguais — só o motor por baixo mudou.
import { auth, db, storage } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  type User as FbUser,
} from "firebase/auth";
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User } from "../../types";

// "payments" no app corresponde à coleção asaas_payments
const collName = (table: string) => (table === "payments" ? "asaas_payments" : table);

const mapUser = (u: FbUser, profile?: any): User => ({
  id: u.uid,
  email: u.email || "",
  name: profile?.name || u.displayName || "Usuário",
  plan: profile?.plan || "free",
  subscriptionActive: profile?.subscriptionActive || false,
  document: profile?.document,
});

// Espera o Firebase dizer quem está logado (evita "null" no carregamento inicial)
const currentUserReady = (): Promise<FbUser | null> =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });

const readProfile = async (uid: string) => {
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
};

export const dbService = {
  async signup(email: string, password: string, name: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await fbUpdateProfile(cred.user, { displayName: name });
    const profile = { name, email, plan: "free", subscriptionActive: false };
    await setDoc(doc(db, "profiles", cred.user.uid), profile);
    return { user: mapUser(cred.user, profile), session: null };
  },

  async signin(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await readProfile(cred.user.uid);
    return { user: mapUser(cred.user, profile), session: null };
  },

  async getMe(): Promise<User | null> {
    const u = await currentUserReady();
    if (!u) return null;
    const profile = await readProfile(u.uid);
    return mapUser(u, profile);
  },

  async updateProfile(profile: any) {
    const u = auth.currentUser;
    if (!u) return false;
    try {
      await setDoc(doc(db, "profiles", u.uid), profile, { merge: true });
      return true;
    } catch {
      return false;
    }
  },

  async fetchData(table: string, userId?: string) {
    const uid = userId || auth.currentUser?.uid || (await currentUserReady())?.uid;
    if (!uid) return [];
    try {
      const q = query(collection(db, collName(table)), where("userId", "==", uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error(`[DB] Erro ao buscar ${table}:`, err);
      return [];
    }
  },

  async insert(table: string, item: any) {
    const u = auth.currentUser;
    if (!u) return null;
    const { id, userId, user_id, ...data } = item;
    const ref = await addDoc(collection(db, collName(table)), { ...data, userId: u.uid });
    return { id: ref.id, ...data, userId: u.uid };
  },

  async upsert(table: string, item: any) {
    const u = auth.currentUser;
    if (!u) return null;
    const { id, userId, user_id, ...data } = item;
    if (id) {
      await setDoc(doc(db, collName(table), id), { ...data, userId: u.uid }, { merge: true });
      return { id, ...data, userId: u.uid };
    }
    const ref = await addDoc(collection(db, collName(table)), { ...data, userId: u.uid });
    return { id: ref.id, ...data, userId: u.uid };
  },

  async update(table: string, id: string, updates: any) {
    if (!id) return false;
    const { id: _i, userId, user_id, ...clean } = updates;
    try {
      await updateDoc(doc(db, collName(table), id), clean);
      return true;
    } catch (err) {
      console.error(`[DB] Erro ao atualizar ${table}:`, err);
      return false;
    }
  },

  async delete(table: string, id: string) {
    if (!id) return false;
    try {
      await deleteDoc(doc(db, collName(table), id));
      return true;
    } catch {
      return false;
    }
  },

  // Documentos (contratos/RG) guardam só o caminho e geram link na hora de abrir.
  // Fotos de imóvel retornam o link direto.
  async uploadFile(bucket: string, path: string, file: File | Blob) {
    const fullPath = `${bucket}/${path}`;
    const storageRef = ref(storage, fullPath);
    await uploadBytes(storageRef, file);
    if (bucket === "documents") return fullPath;
    return await getDownloadURL(storageRef);
  },

  async getSignedUrl(_bucket: string, pathOrUrl: string): Promise<string | null> {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    try {
      return await getDownloadURL(ref(storage, pathOrUrl));
    } catch (err) {
      console.error("[DB] Erro ao gerar link do documento:", err);
      return null;
    }
  },

  async logout() {
    await signOut(auth);
  },
};
