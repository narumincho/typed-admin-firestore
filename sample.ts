import * as f from "./index";
import * as firestore from "@google-cloud/firestore";

const firestoreInstance = {} as f.Firestore<{
  user: {
    doc: User;
    col: {};
  };
  data: {
    doc: Data;
    col: {};
  };
}>;

type User = {
  name: string;
  age: number;
  openIdConnect: {
    providerName: string;
    idInProvider: string;
  };
  playlist: Array<string>;
  createdAt: firestore.Timestamp;
};
type Data = {
  value: number;
};

type UserOrData = { doc: User; col: {} } | { doc: Data; col: {} };

new firestoreInstance({ setting: "setting" })
  .getAll<UserOrData>(
    firestoreInstance.collection<"user" | "data">("user").doc("feaw"),
    firestoreInstance.collection<"user" | "data">("data").doc("feaw")
  )
  .then(e => {
    e.map(k => k.data());
  });
