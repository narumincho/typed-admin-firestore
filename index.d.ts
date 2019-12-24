/**
 * @license
 * 2019 narumincho
 *
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as firestore from "@google-cloud/firestore";

type ValueOf<T> = T[keyof T & string];

type ObjectValueType<T extends DocumentData> = ValueOf<
  {
    [k0 in keyof T]:
      | T[k0]
      | (T[k0] extends DocumentData ? ObjectValueType<T[k0]> : never);
  }
>;

type DocumentData = {
  [field in string]:
    | firestorePrimitiveType
    | Array<firestorePrimitiveType>
    | ReadonlyArray<firestorePrimitiveType>;
};

type CollectionsData = {
  [key in string]: DocumentAndSubCollectionData;
};

type DocumentAndSubCollectionData = {
  key: string;
  value: DocumentData;
  subCollections: CollectionsData;
};

type GetIncludeDocument<col extends CollectionsData> = ValueOf<
  {
    [key in keyof col]:
      | col[key]["value"]
      | GetIncludeDocument<col[key]["subCollections"]>;
  }
>;

type firestorePrimitiveType =
  | boolean
  | Uint8Array
  | firestore.Timestamp
  | number
  | firestore.GeoPoint
  | {
      [field in string]:
        | firestorePrimitiveType
        | Array<firestorePrimitiveType>
        | ReadonlyArray<firestorePrimitiveType>;
    }
  | null
  | firestore.CollectionReference
  | firestore.DocumentReference
  | string;

type UpdateData<doc extends DocumentData> = Partial<
  { [key in keyof doc]: doc[key] | firestore.FieldValue }
>;

type SetData<doc extends DocumentData> = {
  [key in keyof doc]: doc[key] | firestore.FieldValue;
};

type SetDataMargeTrue<doc extends DocumentData> = Partial<
  {
    [key in keyof doc]:
      | (doc[key] extends DocumentData ? SetDataMargeTrue<doc[key]> : doc[key])
      | firestore.FieldValue;
  }
>;

/**
 * `Firestore` represents a Firestore Database and is the entry point for all
 * Firestore operations.
 */
type Firestore<col extends CollectionsData> = {
  /**
   * @param settings Configuration object. See [Firestore Documentation]
   * {@link https://firebase.google.com/docs/firestore/}
   */
  new (settings?: firestore.Settings): Firestore<col>;

  /**
   * Specifies custom settings to be used to configure the `Firestore`
   * instance. Can only be invoked once and before any other Firestore
   * method.
   *
   * If settings are provided via both `settings()` and the `Firestore`
   * constructor, both settings objects are merged and any settings provided
   * via `settings()` take precedence.
   *
   * @param {object} settings The settings to use for all Firestore
   * operations.
   */
  readonly settings: (settings: firestore.Settings) => void;

  /**
   * Gets a `CollectionReference` instance that refers to the collection at
   * the specified path.
   *
   * @param collectionPath A slash-separated path to a collection.
   * @return The `CollectionReference` instance.
   */
  readonly collection: <collectionPath extends keyof col>(
    collectionPath: collectionPath
  ) => CollectionReference<col[collectionPath]>;

  /**
   * Gets a `DocumentReference` instance that refers to the document at the
   * specified path.
   *
   * @param documentPath A slash-separated path to a document.
   * @return The `DocumentReference` instance.
   */
  readonly doc: <documentPath extends keyof col>(
    documentPath: string
  ) => DocumentReference<col[documentPath]>;

  /**
   * Creates and returns a new Query that includes all documents in the
   * database that are contained in a collection or subcollection with the
   * given collectionId.
   *
   * @param collectionId Identifies the collections to query over. Every
   * collection or subcollection with this ID as the last segment of its path
   * will be included. Cannot contain a slash.
   * @return The created Query.
   */
  readonly collectionGroup: (collectionId: string) => Query<any>;

  /**
   * Retrieves multiple documents from Firestore.
   *
   * The first argument is required and must be of type `DocumentReference`
   * followed by any additional `DocumentReference` documents. If used, the
   * optional `ReadOptions` must be the last argument.
   *
   * @param {Array.<DocumentReference|ReadOptions>} documentRefsOrReadOptions
   * The `DocumentReferences` to receive, followed by an optional field
   * mask.
   * @return A Promise that resolves with an array of resulting document
   * snapshots.
   */
  readonly getAll: <docAndSub extends DocumentAndSubCollectionData>(
    ...documentRefsOrReadOptions: Array<
      DocumentReference<docAndSub> | firestore.ReadOptions
    >
  ) => Promise<Array<DocumentSnapshot<docAndSub>>>;

  /**
   * Terminates the Firestore client and closes all open streams.
   *
   * @return A Promise that resolves when the client is terminated.
   */
  readonly terminate: () => Promise<void>;

  /**
   * Fetches the root collections that are associated with this Firestore
   * database.
   *
   * @returns A Promise that resolves with an array of CollectionReferences.
   */
  listCollections: () => Promise<
    Array<CollectionReference<ValueOf<{ [key in keyof col]: col[key] }>>>
  >;

  /**
   * Executes the given updateFunction and commits the changes applied within
   * the transaction.
   *
   * You can use the transaction object passed to 'updateFunction' to read and
   * modify Firestore documents under lock. Transactions are committed once
   * 'updateFunction' resolves and attempted up to five times on failure.
   *
   * @param updateFunction The function to execute within the transaction
   * context.
   * @param {object=} transactionOptions Transaction options.
   * @param {number=} transactionOptions.maxAttempts The maximum number of
   * attempts for this transaction.
   * @return If the transaction completed successfully or was explicitly
   * aborted (by the updateFunction returning a failed Promise), the Promise
   * returned by the updateFunction will be returned here. Else if the
   * transaction failed, a rejected Promise with the corresponding failure
   * error will be returned.
   */
  runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
    transactionOptions?: { maxAttempts?: number }
  ): Promise<T>;

  /**
   * Creates a write batch, used for performing multiple writes as a single
   * atomic operation.
   */
  batch(): WriteBatch;
};

/**
 * A reference to a transaction.
 * The `Transaction` object passed to a transaction's updateFunction provides
 * the methods to read and write data within the transaction context. See
 * `Firestore.runTransaction()`.
 */
type Transaction = {
  /**
   * Retrieves a query result. Holds a pessimistic lock on all returned
   * documents.
   *
   * @param query A query to execute.
   * @return A QuerySnapshot for the retrieved data.
   */
  get<doc extends DocumentData>(query: Query<doc>): Promise<QuerySnapshot<doc>>;

  /**
   * Reads the document referenced by the provided `DocumentReference.`
   * Holds a pessimistic lock on the returned document.
   *
   * @param documentRef A reference to the document to be read.
   * @return A DocumentSnapshot for the read data.
   */
  get<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>
  ): Promise<DocumentSnapshot<docAndSub["value"]>>;

  /**
   * Retrieves multiple documents from Firestore. Holds a pessimistic lock on
   * all returned documents.
   *
   * The first argument is required and must be of type `DocumentReference`
   * followed by any additional `DocumentReference` documents. If used, the
   * optional `ReadOptions` must be the last argument.
   *
   * @param {Array.<DocumentReference|ReadOptions>} documentRefsOrReadOptions
   * The `DocumentReferences` to receive, followed by an optional field
   * mask.
   * @return A Promise that resolves with an array of resulting document
   * snapshots.
   */
  readonly getAll: <docAndSub extends DocumentAndSubCollectionData>(
    ...documentRefsOrReadOptions: Array<
      DocumentReference<docAndSub> | firestore.ReadOptions
    >
  ) => Promise<Array<DocumentSnapshot<docAndSub>>>;

  /**
   * Create the document referred to by the provided `DocumentReference`.
   * The operation will fail the transaction if a document exists at the
   * specified location.
   *
   * @param documentRef A reference to the document to be create.
   * @param data The object data to serialize as the document.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  readonly create: <docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: docAndSub["value"]
  ) => Transaction;

  /**
   * Writes to the document referred to by the provided `DocumentReference`.
   * If the document does not exist yet, it will be created. If you pass
   * `SetOptions`, the provided data can be merged into the existing document.
   *
   * @param documentRef A reference to the document to be set.
   * @param data An object of the fields and values for the document.
   * @param options An object to configure the set behavior.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  set<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: SetDataMargeTrue<docAndSub["value"]>,
    options: { merge: true }
  ): Transaction;

  set<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: SetData<docAndSub["value"]>,
    options?: firestore.SetOptions
  ): Transaction;

  /**
   * Updates fields in the document referred to by the provided
   * `DocumentReference`. The update will fail if applied to a document that
   * does not exist.
   *
   * Nested fields can be updated by providing dot-separated field path
   * strings.
   *
   * @param documentRef A reference to the document to be updated.
   * @param data An object containing the fields and values with which to
   * update the document.
   * @param precondition A Precondition to enforce on this update.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  update<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: UpdateData<docAndSub["value"]>,
    precondition?: firestore.Precondition
  ): Transaction;

  /**
   * Updates fields in the document referred to by the provided
   * `DocumentReference`. The update will fail if applied to a document that
   * does not exist.
   *
   * Nested fields can be updated by providing dot-separated field path
   * strings or by providing FieldPath objects.
   *
   * A `Precondition` restricting this update can be specified as the last
   * argument.
   *
   * @param documentRef A reference to the document to be updated.
   * @param field The first field to update.
   * @param value The first value
   * @param fieldsOrPrecondition An alternating list of field paths and values
   * to update, optionally followed by a `Precondition` to enforce on this
   * update.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  update<
    docAndSub extends DocumentAndSubCollectionData,
    path extends keyof docAndSub["value"] & string
  >(
    documentRef: DocumentReference<docAndSub>,
    field: path,
    value: docAndSub["value"][path],
    ...fieldsOrPrecondition: any[]
  ): Transaction;

  update<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    field: firestore.FieldPath,
    value: ObjectValueType<docAndSub["value"]>,
    ...fieldsOrPrecondition: any[]
  ): Transaction;

  /**
   * Deletes the document referred to by the provided `DocumentReference`.
   *
   * @param documentRef A reference to the document to be deleted.
   * @param precondition A Precondition to enforce for this delete.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  readonly delete: (
    documentRef: firestore.DocumentReference,
    precondition?: firestore.Precondition
  ) => Transaction;
};

/**
 * A write batch, used to perform multiple writes as a single atomic unit.
 *
 * A `WriteBatch` object can be acquired by calling `Firestore.batch()`. It
 * provides methods for adding writes to the write batch. None of the
 * writes will be committed (or visible locally) until `WriteBatch.commit()`
 * is called.
 *
 * Unlike transactions, write batches are persisted offline and therefore are
 * preferable when you don't need to condition your writes on read data.
 */
type WriteBatch = {
  /**
   * Create the document referred to by the provided `DocumentReference`. The
   * operation will fail the batch if a document exists at the specified
   * location.
   *
   * @param documentRef A reference to the document to be created.
   * @param data The object data to serialize as the document.
   * @return This `WriteBatch` instance. Used for chaining method calls.
   */
  readonly create: <docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: docAndSub["value"]
  ) => WriteBatch;

  /**
   * Write to the document referred to by the provided `DocumentReference`.
   * If the document does not exist yet, it will be created. If you pass
   * `SetOptions`, the provided data can be merged into the existing document.
   *
   * @param documentRef A reference to the document to be set.
   * @param data An object of the fields and values for the document.
   * @param options An object to configure the set behavior.
   * @return This `WriteBatch` instance. Used for chaining method calls.
   */
  set<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: SetDataMargeTrue<docAndSub["value"]>,
    options: { merge: true }
  ): WriteBatch;

  set<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: SetData<docAndSub["value"]>,
    options?: firestore.SetOptions
  ): WriteBatch;

  /**
   * Update fields of the document referred to by the provided
   * `DocumentReference`. If the document doesn't yet exist, the update fails
   * and the entire batch will be rejected.
   *
   * Nested fields can be updated by providing dot-separated field path
   * strings.
   *
   * @param documentRef A reference to the document to be updated.
   * @param data An object containing the fields and values with which to
   * update the document.
   * @param precondition A Precondition to enforce on this update.
   * @return This `WriteBatch` instance. Used for chaining method calls.
   */
  update<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    data: UpdateData<docAndSub["value"]>,
    precondition?: firestore.Precondition
  ): WriteBatch;

  /**
   * Updates fields in the document referred to by the provided
   * `DocumentReference`. The update will fail if applied to a document that
   * does not exist.
   *
   * Nested fields can be updated by providing dot-separated field path
   * strings or by providing FieldPath objects.
   *
   * A `Precondition` restricting this update can be specified as the last
   * argument.
   *
   * @param documentRef A reference to the document to be updated.
   * @param field The first field to update.
   * @param value The first value
   * @param fieldsOrPrecondition An alternating list of field paths and values
   * to update, optionally followed a `Precondition` to enforce on this update.
   * @return This `WriteBatch` instance. Used for chaining method calls.
   */
  update<
    docAndSub extends DocumentAndSubCollectionData,
    path extends keyof docAndSub["value"] & string
  >(
    documentRef: DocumentReference<docAndSub>,
    field: path,
    value: docAndSub["value"][path],
    ...fieldsOrPrecondition: any[]
  ): WriteBatch;

  update<docAndSub extends DocumentAndSubCollectionData>(
    documentRef: DocumentReference<docAndSub>,
    field: firestore.FieldPath,
    value: ObjectValueType<docAndSub["value"]>,
    ...fieldsOrPrecondition: any[]
  ): WriteBatch;

  /**
   * Deletes the document referred to by the provided `DocumentReference`.
   *
   * @param documentRef A reference to the document to be deleted.
   * @param precondition A Precondition to enforce for this delete.
   * @return This `WriteBatch` instance. Used for chaining method calls.
   */
  readonly delete: (
    documentRef: firestore.DocumentReference,
    precondition?: firestore.Precondition
  ) => WriteBatch;

  /**
   * Commits all of the writes in this write batch as a single atomic unit.
   *
   * @return A Promise resolved once all of the writes in the batch have been
   * successfully written to the backend as an atomic unit.
   */
  readonly commit: () => Promise<Array<firestore.WriteResult>>;
};

/**
 * A `DocumentReference` refers to a document location in a Firestore database
 * and can be used to write, read, or listen to the location. The document at
 * the referenced location may or may not exist. A `DocumentReference` can
 * also be used to create a `CollectionReference` to a subcollection.
 */
type DocumentReference<docAndSub extends DocumentAndSubCollectionData> = {
  /** The identifier of the document within its collection. */
  readonly id: docAndSub["key"];

  /**
   * The `Firestore` for the Firestore database (useful for performing
   * transactions, etc.).
   */
  readonly firestore: Firestore<any>;

  /**
   * A reference to the Collection to which this DocumentReference belongs.
   */
  readonly parent: CollectionReference<docAndSub>;

  /**
   * A string representing the path of the referenced document (relative
   * to the root of the database).
   */
  readonly path: string;

  /**
   * Gets a `CollectionReference` instance that refers to the collection at
   * the specified path.
   *
   * @param collectionPath A slash-separated path to a collection.
   * @return The `CollectionReference` instance.
   */
  readonly collection: <
    collectionPath extends keyof docAndSub["subCollections"]
  >(
    collectionPath: collectionPath
  ) => CollectionReference<docAndSub["subCollections"][collectionPath]>;

  /**
   * Fetches the subcollections that are direct children of this document.
   *
   * @returns A Promise that resolves with an array of CollectionReferences.
   */
  readonly listCollections: () => Promise<
    Array<
      CollectionReference<
        ValueOf<
          {
            [key in keyof docAndSub["subCollections"]]: docAndSub["subCollections"][key];
          }
        >
      >
    >
  >;

  /**
   * Creates a document referred to by this `DocumentReference` with the
   * provided object values. The write fails if the document already exists
   *
   * @param data The object data to serialize as the document.
   * @return A Promise resolved with the write time of this create.
   */
  readonly create: (data: docAndSub["value"]) => Promise<firestore.WriteResult>;

  /**
   * Writes to the document referred to by this `DocumentReference`. If the
   * document does not yet exist, it will be created. If you pass
   * `SetOptions`, the provided data can be merged into an existing document.
   *
   * @param data A map of the fields and values for the document.
   * @param options An object to configure the set behavior.
   * @return A Promise resolved with the write time of this set.
   */
  set(
    data: SetDataMargeTrue<docAndSub["value"]>,
    options: { merge: true }
  ): Promise<firestore.WriteResult>;

  set(
    data: SetData<docAndSub["value"]>,
    options?: firestore.SetOptions
  ): Promise<firestore.WriteResult>;

  /**
   * Updates fields in the document referred to by this `DocumentReference`.
   * The update will fail if applied to a document that does not exist.
   *
   * Nested fields can be updated by providing dot-separated field path
   * strings.
   *
   * @param data An object containing the fields and values with which to
   * update the document.
   * @param precondition A Precondition to enforce on this update.
   * @return A Promise resolved with the write time of this update.
   */
  update(
    data: UpdateData<docAndSub["value"]>,
    precondition?: firestore.Precondition
  ): Promise<firestore.WriteResult>;

  /**
   * Updates fields in the document referred to by this `DocumentReference`.
   * The update will fail if applied to a document that does not exist.
   *
   * Nested fields can be updated by providing dot-separated field path
   * strings or by providing FieldPath objects.
   *
   * A `Precondition` restricting this update can be specified as the last
   * argument.
   *
   * @param field The first field to update.
   * @param value The first value.
   * @param moreFieldsOrPrecondition An alternating list of field paths and
   * values to update, optionally followed by a `Precondition` to enforce on
   * this update.
   * @return A Promise resolved with the write time of this update.
   */
  update<path extends keyof docAndSub["value"] & string>(
    field: path,
    value: docAndSub["value"][path],
    ...moreFieldsAndValues: any[]
  ): Promise<firestore.WriteResult>;

  update(
    field: firestore.FieldPath,
    value: ObjectValueType<docAndSub["value"]>,
    ...moreFieldsAndValues: any[]
  ): Promise<firestore.WriteResult>;
  /**
   * Deletes the document referred to by this `DocumentReference`.
   *
   * @param precondition A Precondition to enforce for this delete.
   * @return A Promise resolved with the write time of this delete.
   */
  readonly delete: (
    precondition?: firestore.Precondition
  ) => Promise<firestore.WriteResult>;

  /**
   * Reads the document referred to by this `DocumentReference`.
   *
   * @return A Promise resolved with a DocumentSnapshot containing the
   * current document contents.
   */
  readonly get: () => Promise<DocumentSnapshot<docAndSub["value"]>>;

  /**
   * Attaches a listener for DocumentSnapshot events.
   *
   * @param onNext A callback to be called every time a new `DocumentSnapshot`
   * is available.
   * @param onError A callback to be called if the listen fails or is
   * cancelled. No further callbacks will occur.
   * @return An unsubscribe function that can be called to cancel
   * the snapshot listener.
   */
  readonly onSnapshot: (
    onNext: (snapshot: DocumentSnapshot<docAndSub["value"]>) => void,
    onError?: (error: Error) => void
  ) => () => void;

  /**
   * Returns true if this `DocumentReference` is equal to the provided one.
   *
   * @param other The `DocumentReference` to compare against.
   * @return true if this `DocumentReference` is equal to the provided one.
   */
  readonly isEqual: (other: DocumentReference<docAndSub>) => boolean;
};

/**
 * A `DocumentSnapshot` contains data read from a document in your Firestore
 * database. The data can be extracted with `.data()` or `.get(<field>)` to
 * get a specific field.
 *
 * For a `DocumentSnapshot` that points to a non-existing document, any data
 * access will return 'undefined'. You can use the `exists` property to
 * explicitly verify a document's existence.
 */
type DocumentSnapshot<doc extends DocumentData> = {
  /** True if the document exists. */
  readonly exists: boolean;

  /** A `DocumentReference` to the document location. */
  readonly ref: DocumentReference<{
    key: string;
    value: doc;
    subCollections: any;
  }>;

  /**
   * The ID of the document for which this `DocumentSnapshot` contains data.
   */
  readonly id: string;

  /**
   * The time the document was created. Not set for documents that don't
   * exist.
   */
  readonly createTime?: firestore.Timestamp;

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated). Not set for documents that don't exist.
   */
  readonly updateTime?: firestore.Timestamp;

  /**
   * The time this snapshot was read.
   */
  readonly readTime: firestore.Timestamp;

  /**
   * Retrieves all fields in the document as an Object. Returns 'undefined' if
   * the document doesn't exist.
   *
   * @return An Object containing all fields in the document.
   */
  readonly data: () => doc | undefined;

  /**
   * Retrieves the field specified by `fieldPath`.
   *
   * @param fieldPath The path (e.g. 'foo' or 'foo.bar') to a specific field.
   * @return The data at the specified field location or undefined if no such
   * field exists in the document.
   */
  get<path extends keyof doc & string>(fieldPath: path): doc[path] | undefined;
  get(fieldPath: firestore.FieldPath): ValueOf<doc> | undefined;
  /**
   * Returns true if the document's data and path in this `DocumentSnapshot`
   * is equal to the provided one.
   *
   * @param other The `DocumentSnapshot` to compare against.
   * @return true if this `DocumentSnapshot` is equal to the provided one.
   */
  readonly isEqual: (other: DocumentSnapshot<doc>) => boolean;
};

/**
 * A `QueryDocumentSnapshot` contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with `.data()` or `.get(<field>)` to get a
 * specific field.
 *
 * A `QueryDocumentSnapshot` offers the same API surface as a
 * `DocumentSnapshot`. Since query results contain only existing documents, the
 * `exists` property will always be true and `data()` will never return
 * 'undefined'.
 */
interface QueryDocumentSnapshot<doc extends DocumentData>
  extends DocumentSnapshot<doc> {
  /**
   * The time the document was created.
   */
  readonly createTime: firestore.Timestamp;

  /**
   * The time the document was last updated (at the time the snapshot was
   * generated).
   */
  readonly updateTime: firestore.Timestamp;

  /**
   * Retrieves all fields in the document as an Object.
   *
   * @override
   * @return An Object containing all fields in the document.
   */
  readonly data: () => doc;
}

/**
 * A `Query` refers to a Query which you can read or listen to. You can also
 * construct refined `Query` objects by adding filters and ordering.
 */
type Query<doc extends DocumentData> = {
  /**
   * The `Firestore` for the Firestore database (useful for performing
   * transactions, etc.).
   */
  readonly firestore: Firestore<any>;

  /**
   * Creates and returns a new Query with the additional filter that documents
   * must contain the specified field and that its value should satisfy the
   * relation constraint provided.
   *
   * This function returns a new (immutable) instance of the Query (rather
   * than modify the existing instance) to impose the filter.
   *
   * @param fieldPath The path to compare
   * @param opStr The operation string (e.g "<", "<=", "==", ">", ">=").
   * @param value The value for comparison
   * @return The created Query.
   */
  where<path extends keyof doc & string>(
    fieldPath: path,
    opStr: "<" | "<=" | "==" | ">=" | ">",
    value: doc[path]
  ): Query<doc>;

  where<path extends keyof doc & string>(
    fieldPath: path,
    opStr: "array-contains",
    value: doc[path] extends Array<infer V> ? V : never
  ): Query<doc>;

  where<path extends keyof doc & string>(
    fieldPath: path,
    opStr: "in",
    value: Array<doc[path]>
  ): Query<doc>;

  where<path extends keyof doc & string>(
    fieldPath: path,
    opStr: "array-contains-any",
    value: doc[path] extends Array<infer V> ? Array<V> : never
  ): Query<doc>;

  where(
    fieldPath: firestore.FieldPath,
    opStr: firestore.WhereFilterOp,
    value: ObjectValueType<doc>
  ): Query<doc>;

  /**
   * Creates and returns a new Query that's additionally sorted by the
   * specified field, optionally in descending order instead of ascending.
   *
   * This function returns a new (immutable) instance of the Query (rather
   * than modify the existing instance) to impose the order.
   *
   * @param fieldPath The field to sort by.
   * @param directionStr Optional direction to sort by ('asc' or 'desc'). If
   * not specified, order will be ascending.
   * @return The created Query.
   */
  orderBy<path extends keyof doc & string>(
    fieldPath: path,
    directionStr?: firestore.OrderByDirection
  ): Query<doc>;

  orderBy(
    fieldPath: firestore.FieldPath,
    directionStr?: firestore.OrderByDirection
  ): Query<doc>;

  /**
   * Creates and returns a new Query that's additionally limited to only
   * return up to the specified number of documents.
   *
   * This function returns a new (immutable) instance of the Query (rather
   * than modify the existing instance) to impose the limit.
   *
   * @param limit The maximum number of items to return.
   * @return The created Query.
   */
  readonly limit: (limit: number) => Query<doc>;

  /**
   * Specifies the offset of the returned results.
   *
   * This function returns a new (immutable) instance of the Query (rather
   * than modify the existing instance) to impose the offset.
   *
   * @param offset The offset to apply to the Query results.
   * @return The created Query.
   */

  /**
   * Creates and returns a new Query instance that applies a field mask to
   * the result and returns only the specified subset of fields. You can
   * specify a list of field paths to return, or use an empty list to only
   * return the references of matching documents.
   *
   * This function returns a new (immutable) instance of the Query (rather
   * than modify the existing instance) to impose the field mask.
   *
   * @param field The field paths to return.
   * @return The created Query.
   */
  select<key extends keyof doc>(...field: Array<key>): Query<Pick<doc, key>>;
  select(...field: Array<firestore.FieldPath>): Query<any>;

  /**
   * Creates and returns a new Query that starts at the provided document
   * (inclusive). The starting position is relative to the order of the query.
   * The document must contain all of the fields provided in the orderBy of
   * this query.
   *
   * @param snapshot The snapshot of the document to start after.
   * @return The created Query.
   */
  startAt(snapshot: DocumentSnapshot<doc>): Query<doc>;

  /**
   * Creates and returns a new Query that starts at the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to start this query at, in order
   * of the query's order by.
   * @return The created Query.
   */
  startAt(...fieldValues: any[]): Query<any>;

  /**
   * Creates and returns a new Query that starts after the provided document
   * (exclusive). The starting position is relative to the order of the query.
   * The document must contain all of the fields provided in the orderBy of
   * this query.
   *
   * @param snapshot The snapshot of the document to start after.
   * @return The created Query.
   */
  startAfter(snapshot: DocumentSnapshot<doc>): Query<doc>;

  /**
   * Creates and returns a new Query that starts after the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to start this query after, in order
   * of the query's order by.
   * @return The created Query.
   */
  startAfter(...fieldValues: any[]): Query<doc>;

  /**
   * Creates and returns a new Query that ends before the provided document
   * (exclusive). The end position is relative to the order of the query. The
   * document must contain all of the fields provided in the orderBy of this
   * query.
   *
   * @param snapshot The snapshot of the document to end before.
   * @return The created Query.
   */
  endBefore(snapshot: DocumentSnapshot<doc>): Query<doc>;

  /**
   * Creates and returns a new Query that ends before the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to end this query before, in order
   * of the query's order by.
   * @return The created Query.
   */
  endBefore(...fieldValues: any[]): Query<doc>;

  /**
   * Creates and returns a new Query that ends at the provided document
   * (inclusive). The end position is relative to the order of the query. The
   * document must contain all of the fields provided in the orderBy of this
   * query.
   *
   * @param snapshot The snapshot of the document to end at.
   * @return The created Query.
   */
  endAt(snapshot: DocumentSnapshot<doc>): Query<doc>;

  /**
   * Creates and returns a new Query that ends at the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to end this query at, in order
   * of the query's order by.
   * @return The created Query.
   */
  endAt(...fieldValues: any[]): Query<doc>;

  /**
   * Executes the query and returns the results as a `QuerySnapshot`.
   *
   * @return A Promise that will be resolved with the results of the Query.
   */
  readonly get: () => Promise<QuerySnapshot<doc>>;

  /*
   * Executes the query and returns the results as Node Stream.
   *
   * @return A stream of QueryDocumentSnapshot.
   */
  readonly stream: () => NodeJS.ReadableStream;

  /**
   * Attaches a listener for `QuerySnapshot `events.
   *
   * @param onNext A callback to be called every time a new `QuerySnapshot`
   * is available.
   * @param onError A callback to be called if the listen fails or is
   * cancelled. No further callbacks will occur.
   * @return An unsubscribe function that can be called to cancel
   * the snapshot listener.
   */
  readonly onSnapshot: (
    onNext: (snapshot: QuerySnapshot<doc>) => void,
    onError?: (error: Error) => void
  ) => () => void;

  /**
   * Returns true if this `Query` is equal to the provided one.
   *
   * @param other The `Query` to compare against.
   * @return true if this `Query` is equal to the provided one.
   */
  readonly isEqual: (other: Query<doc>) => boolean;
};

/**
 * A `QuerySnapshot` contains zero or more `QueryDocumentSnapshot` objects
 * representing the results of a query. The documents can be accessed as an
 * array via the `docs` property or enumerated using the `forEach` method. The
 * number of documents can be determined via the `empty` and `size`
 * properties.
 */
type QuerySnapshot<doc extends DocumentData> = {
  /**
   * The query on which you called `get` or `onSnapshot` in order to get this
   * `QuerySnapshot`.
   */
  readonly query: Query<doc>;

  /** An array of all the documents in the QuerySnapshot. */
  readonly docs: Array<QueryDocumentSnapshot<doc>>;

  /** The number of documents in the QuerySnapshot. */
  readonly size: number;

  /** True if there are no documents in the QuerySnapshot. */
  readonly empty: boolean;

  /** The time this query snapshot was obtained. */
  readonly readTime: firestore.Timestamp;

  /**
   * Returns an array of the documents changes since the last snapshot. If
   * this is the first snapshot, all documents will be in the list as added
   * changes.
   */
  readonly docChanges: () => Array<firestore.DocumentChange>;

  /**
   * Enumerates all of the documents in the QuerySnapshot.
   *
   * @param callback A callback to be called with a `DocumentSnapshot` for
   * each document in the snapshot.
   * @param thisArg The `this` binding for the callback.
   */
  readonly forEach: (
    callback: (result: QueryDocumentSnapshot<doc>) => void,
    thisArg?: any
  ) => void;

  /**
   * Returns true if the document data in this `QuerySnapshot` is equal to the
   * provided one.
   *
   * @param other The `QuerySnapshot` to compare against.
   * @return true if this `QuerySnapshot` is equal to the provided one.
   */
  readonly isEqual: (other: QuerySnapshot<doc>) => boolean;
};

/**
 * A `CollectionReference` object can be used for adding documents, getting
 * document references, and querying for documents (using the methods
 * inherited from `Query`).
 */
type CollectionReference<
  docAndSub extends DocumentAndSubCollectionData
> = Query<docAndSub["value"]> & {
  /** The identifier of the collection. */
  readonly id: string;

  /**
   * A reference to the containing Document if this is a subcollection, else
   * null.
   */
  readonly parent: DocumentReference<docAndSub> | null;

  /**
   * A string representing the path of the referenced collection (relative
   * to the root of the database).
   */
  readonly path: string;

  /**
   * Retrieves the list of documents in this collection.
   *
   * The document references returned may include references to "missing
   * documents", i.e. document locations that have no document present but
   * which contain subcollections with documents. Attempting to read such a
   * document reference (e.g. via `.get()` or `.onSnapshot()`) will return a
   * `DocumentSnapshot` whose `.exists` property is false.
   *
   * @return {Promise<DocumentReference[]>} The list of documents in this
   * collection.
   */
  readonly listDocuments: () => Promise<Array<DocumentReference<docAndSub>>>;

  /**
   * Get a `DocumentReference` for a randomly-named document within this
   * collection. An automatically-generated unique ID will be used as the
   * document ID.
   *
   * @return The `DocumentReference` instance.
   */
  doc(): DocumentReference<docAndSub>;

  /**
   * Get a `DocumentReference` for the document within the collection at the
   * specified path.
   *
   * @param documentPath A slash-separated path to a document.
   * @return The `DocumentReference` instance.
   */
  doc(documentPath: docAndSub["key"]): DocumentReference<docAndSub>;

  /**
   * Add a new document to this collection with the specified data, assigning
   * it a document ID automatically.
   *
   * @param data An Object containing the data for the new document.
   * @return A Promise resolved with a `DocumentReference` pointing to the
   * newly created document after it has been written to the backend.
   */
  readonly add: (
    data: docAndSub["value"]
  ) => Promise<DocumentReference<docAndSub>>;

  /**
   * Returns true if this `CollectionReference` is equal to the provided one.
   *
   * @param other The `CollectionReference` to compare against.
   * @return true if this `CollectionReference` is equal to the provided one.
   */
  readonly isEqual: (other: CollectionReference<docAndSub>) => boolean;
};
