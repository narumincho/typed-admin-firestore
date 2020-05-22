# typed-admin-firestore

[![npm version](https://badge.fury.io/js/typed-admin-firestore.svg)](https://badge.fury.io/js/typed-admin-firestore)
[![NPM](https://nodei.co/npm/typed-admin-firestore.png)](https://nodei.co/npm/typed-admin-firestore/)

type support for firebase admin firestore.

[type-firestore](https://github.com/narumincho/typed-firestore)

## admin

```ts
import * as admin from "firebase-admin";
import type * as typedFirestore from "typed-firestore";

const app = admin.initializeApp();
const firestore = (app.firestore() as unknown) as typedFirestore.Firestore<{
  user: {
    doc: {
      name: string;
      age: number;
      openIdConnect: {
        providerName: string;
        idInProvider: string;
      };
      playlist: Array<string>;
      createdAt: firestore.Timestamp;
    };
    col: {}; // sub collection
  };
}>;
// Type hint !!!!!
const user = firestore.collection("user");
(async () => {
  const userQuerySnapshotArray = await firestore
    .collection("user")
    .where("age", "<=", 20)
    .get();
  for (const userQueryDocumentSnapshot of userQuerySnapshotArray.docs) {
    // Type hint !!!!!
    console.log("name", userQueryDocumentSnapshot.data().name);
  }
})();
```
