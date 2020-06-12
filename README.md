# typed-admin-firestore

[![npm version](https://badge.fury.io/js/typed-admin-firestore.svg)](https://badge.fury.io/js/typed-admin-firestore)
[![NPM](https://nodei.co/npm/typed-admin-firestore.png)](https://nodei.co/npm/typed-admin-firestore/)

type support for firebase admin firestore.

[type-firestore](https://github.com/narumincho/typed-firestore)

## admin

```ts
import * as admin from "firebase-admin";
import type * as typedAdminFirestore from "typed-admin-firestore";

const app = admin.initializeApp();
const firestoreInstance = (app.firestore() as unknown) as typedAdminFirestore.Firestore<{
  user: { key: UserId; value: User; subCollections: {} };
  music: { key: MusicId; value: Music; subCollections: {} };
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
})();
```
