import * as admin from "firebase-admin";
import type * as typedAdminFirestore from "./index";

const app = admin.initializeApp();
const firestoreInstance = (app.firestore() as unknown) as typedAdminFirestore.Firestore<{
  user: { key: UserId; value: User; subCollections: {} };
  music: { key: MusicId; value: Music; subCollections: {} };
  withSubcollection: {
    key: string;
    value: never;
    subCollections: {
      subcollection:
        | {
            key: "subcollectionDoc1";
            value: SubcollectionDoc1;
            subCollections: {};
          }
        | {
            key: "subcollectionDoc2";
            value: SubcollectionDoc2;
            subCollections: {};
          };
    };
  };
}>;

type UserId = string & { _userId: never };

type User = {
  name: string;
  age: number;
  openIdConnect: {
    providerName: string;
    idInProvider: string;
  };
  likedMusics: Array<MusicId>;
  createdAt: admin.firestore.Timestamp;
};

type MusicId = string & { _musicId: never };

type Music = {
  title: string;
  artist: UserId;
};

type SubcollectionDoc1 = {
  field1: string;
};

type SubcollectionDoc2 = {
  field2: string;
};

(async () => {
  const userQuerySnapshotArray = await firestoreInstance
    .collection("user")
    .where("age", "<=", 20)
    .get();

  for (const userQueryDocumentSnapshot of userQuerySnapshotArray.docs) {
    const data = userQueryDocumentSnapshot.data();
    console.log("name", data.name); // Type hint !!!!!
    console.log("providerName", data.openIdConnect.providerName); // Type hint !!!!!

    for (const likedMusicId of data.likedMusics) {
      firestoreInstance.collection("music").doc(likedMusicId); // no error !!!
      firestoreInstance.collection("user").doc(likedMusicId); // error !!!
    }
  }

  const doc = await firestoreInstance
    .collection("withSubcollection") // autocomplete
    .doc("id" as string)
    .collection("subcollection") // autocomplete
    .doc("subcollectionDoc1") // autocomplete
    .get(); // returns DocumentSnapshot of SubcollectionDoc1
})();
