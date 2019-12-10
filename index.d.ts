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

type ValueOf<T> = T[keyof T];

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

type CollectionData = {
  [key in string]: DocumentAndSubCollectionData;
};

type DocumentAndSubCollectionData = {
  doc: DocumentData;
  col: CollectionData;
};

type GetIncludeDocument<col extends CollectionData> = ValueOf<
  { [key in keyof col]: col[key]["doc"] | GetIncludeDocument<col[key]["col"]> }
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
  { [key in keyof doc]: key | firestore.FieldValue }
>;

/**
 * `Firestore` represents a Firestore Database and is the entry point for all
 * Firestore operations.
 */
type Firestore = {
  /**
   * @param settings Configuration object. See [Firestore Documentation]
   * {@link https://firebase.google.com/docs/firestore/}
   */
  new (settings?: firestore.Settings): Firestore;

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
  settings(settings: firestore.Settings): void;

  /**
   * Gets a `CollectionReference` instance that refers to the collection at
   * the specified path.
   *
   * @param collectionPath A slash-separated path to a collection.
   * @return The `CollectionReference` instance.
   */
  collection(collectionPath: string): CollectionReference;

  /**
   * Gets a `DocumentReference` instance that refers to the document at the
   * specified path.
   *
   * @param documentPath A slash-separated path to a document.
   * @return The `DocumentReference` instance.
   */
  doc(documentPath: string): DocumentReference;

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
  collectionGroup(collectionId: string): Query;

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
  getAll(
    ...documentRefsOrReadOptions: Array<DocumentReference | ReadOptions>
  ): Promise<DocumentSnapshot[]>;

  /**
   * Fetches the root collections that are associated with this Firestore
   * database.
   *
   * @returns A Promise that resolves with an array of CollectionReferences.
   */
  listCollections(): Promise<CollectionReference[]>;

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
  get(query: Query): Promise<QuerySnapshot>;

  /**
   * Reads the document referenced by the provided `DocumentReference.`
   * Holds a pessimistic lock on the returned document.
   *
   * @param documentRef A reference to the document to be read.
   * @return A DocumentSnapshot for the read data.
   */
  get(documentRef: DocumentReference): Promise<DocumentSnapshot>;

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
  getAll(
    ...documentRefsOrReadOptions: Array<DocumentReference | ReadOptions>
  ): Promise<DocumentSnapshot[]>;

  /**
   * Create the document referred to by the provided `DocumentReference`.
   * The operation will fail the transaction if a document exists at the
   * specified location.
   *
   * @param documentRef A reference to the document to be create.
   * @param data The object data to serialize as the document.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  create(documentRef: DocumentReference, data: DocumentData): Transaction;

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
  set(
    documentRef: DocumentReference,
    data: DocumentData,
    options?: SetOptions
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
  update(
    documentRef: DocumentReference,
    data: UpdateData<any>,
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
  update(
    documentRef: DocumentReference,
    field: string | firestore.FieldPath,
    value: any,
    ...fieldsOrPrecondition: any[]
  ): Transaction;

  /**
   * Deletes the document referred to by the provided `DocumentReference`.
   *
   * @param documentRef A reference to the document to be deleted.
   * @param precondition A Precondition to enforce for this delete.
   * @return This `Transaction` instance. Used for chaining method calls.
   */
  delete(
    documentRef: DocumentReference,
    precondition?: firestore.Precondition
  ): Transaction;
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
  create(documentRef: DocumentReference, data: DocumentData): WriteBatch;

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
  set(
    documentRef: DocumentReference,
    data: DocumentData,
    options?: SetOptions
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
  update(
    documentRef: DocumentReference,
    data: UpdateData<any>,
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
  update(
    documentRef: DocumentReference,
    field: string | firestore.FieldPath,
    value: any,
    ...fieldsOrPrecondition: any[]
  ): WriteBatch;

  /**
   * Deletes the document referred to by the provided `DocumentReference`.
   *
   * @param documentRef A reference to the document to be deleted.
   * @param precondition A Precondition to enforce for this delete.
   * @return This `WriteBatch` instance. Used for chaining method calls.
   */
  delete(
    documentRef: DocumentReference,
    precondition?: firestore.Precondition
  ): WriteBatch;

  /**
   * Commits all of the writes in this write batch as a single atomic unit.
   *
   * @return A Promise resolved once all of the writes in the batch have been
   * successfully written to the backend as an atomic unit.
   */
  commit(): Promise<Array<firestore.WriteResult>>;
};

/**
 * An options object that configures the behavior of `set()` calls in
 * `DocumentReference`, `WriteBatch` and `Transaction`. These calls can be
 * configured to perform granular merges instead of overwriting the target
 * documents in their entirety.
 */
interface SetOptions {
  /**
   * Changes the behavior of a set() call to only replace the values specified
   * in its data argument. Fields omitted from the set() call remain
   * untouched.
   */
  readonly merge?: boolean;

  /**
   * Changes the behavior of set() calls to only replace the specified field
   * paths. Any field path that is not specified is ignored and remains
   * untouched.
   *
   * It is an error to pass a SetOptions object to a set() call that is
   * missing a value for any of the fields specified here.
   */
  readonly mergeFields?: Array<string | firestore.FieldPath>;
}

/**
 * An options object that can be used to configure the behavior of `getAll()`
 * calls. By providing a `fieldMask`, these calls can be configured to only
 * return a subset of fields.
 */
interface ReadOptions {
  /**
   * Specifies the set of fields to return and reduces the amount of data
   * transmitted by the backend.
   *
   * Adding a field mask does not filter results. Documents do not need to
   * contain values for all the fields in the mask to be part of the result
   * set.
   */
  readonly fieldMask?: Array<string | firestore.FieldPath>;
}

/**
 * A `DocumentReference` refers to a document location in a Firestore database
 * and can be used to write, read, or listen to the location. The document at
 * the referenced location may or may not exist. A `DocumentReference` can
 * also be used to create a `CollectionReference` to a subcollection.
 */
type DocumentReference = {
  /** The identifier of the document within its collection. */
  readonly id: string;

  /**
   * The `Firestore` for the Firestore database (useful for performing
   * transactions, etc.).
   */
  readonly firestore: Firestore;

  /**
   * A reference to the Collection to which this DocumentReference belongs.
   */
  readonly parent: CollectionReference;

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
  collection(collectionPath: string): CollectionReference;

  /**
   * Fetches the subcollections that are direct children of this document.
   *
   * @returns A Promise that resolves with an array of CollectionReferences.
   */
  listCollections(): Promise<CollectionReference[]>;

  /**
   * Creates a document referred to by this `DocumentReference` with the
   * provided object values. The write fails if the document already exists
   *
   * @param data The object data to serialize as the document.
   * @return A Promise resolved with the write time of this create.
   */
  create(data: DocumentData): Promise<firestore.WriteResult>;

  /**
   * Writes to the document referred to by this `DocumentReference`. If the
   * document does not yet exist, it will be created. If you pass
   * `SetOptions`, the provided data can be merged into an existing document.
   *
   * @param data A map of the fields and values for the document.
   * @param options An object to configure the set behavior.
   * @return A Promise resolved with the write time of this set.
   */
  set(data: DocumentData, options?: SetOptions): Promise<firestore.WriteResult>;

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
    data: UpdateData<any>,
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
  update(
    field: string | firestore.FieldPath,
    value: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<firestore.WriteResult>;

  /**
   * Deletes the document referred to by this `DocumentReference`.
   *
   * @param precondition A Precondition to enforce for this delete.
   * @return A Promise resolved with the write time of this delete.
   */
  delete(precondition?: firestore.Precondition): Promise<firestore.WriteResult>;

  /**
   * Reads the document referred to by this `DocumentReference`.
   *
   * @return A Promise resolved with a DocumentSnapshot containing the
   * current document contents.
   */
  get(): Promise<DocumentSnapshot>;

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
  onSnapshot(
    onNext: (snapshot: DocumentSnapshot) => void,
    onError?: (error: Error) => void
  ): () => void;

  /**
   * Returns true if this `DocumentReference` is equal to the provided one.
   *
   * @param other The `DocumentReference` to compare against.
   * @return true if this `DocumentReference` is equal to the provided one.
   */
  isEqual(other: DocumentReference): boolean;
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
type DocumentSnapshot = {
  /** True if the document exists. */
  readonly exists: boolean;

  /** A `DocumentReference` to the document location. */
  readonly ref: DocumentReference;

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
  data(): DocumentData | undefined;

  /**
   * Retrieves the field specified by `fieldPath`.
   *
   * @param fieldPath The path (e.g. 'foo' or 'foo.bar') to a specific field.
   * @return The data at the specified field location or undefined if no such
   * field exists in the document.
   */
  get(fieldPath: string | firestore.FieldPath): any;

  /**
   * Returns true if the document's data and path in this `DocumentSnapshot`
   * is equal to the provided one.
   *
   * @param other The `DocumentSnapshot` to compare against.
   * @return true if this `DocumentSnapshot` is equal to the provided one.
   */
  isEqual(other: DocumentSnapshot): boolean;
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
interface QueryDocumentSnapshot extends DocumentSnapshot {
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
  data(): DocumentData;
}

/**
 * Filter conditions in a `Query.where()` clause are specified using the
 * strings '<', '<=', '==', '>=', '>', 'array-contains', 'in', and
 * 'array-contains-any'.
 */
type WhereFilterOp =
  | "<"
  | "<="
  | "=="
  | ">="
  | ">"
  | "array-contains"
  | "in"
  | "array-contains-any";

/**
 * A `Query` refers to a Query which you can read or listen to. You can also
 * construct refined `Query` objects by adding filters and ordering.
 */
type Query = {
  /**
   * The `Firestore` for the Firestore database (useful for performing
   * transactions, etc.).
   */
  readonly firestore: Firestore;

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
  where(
    fieldPath: string | firestore.FieldPath,
    opStr: WhereFilterOp,
    value: any
  ): Query;

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
  orderBy(
    fieldPath: string | firestore.FieldPath,
    directionStr?: firestore.OrderByDirection
  ): Query;

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
  limit(limit: number): Query;

  /**
   * Specifies the offset of the returned results.
   *
   * This function returns a new (immutable) instance of the Query (rather
   * than modify the existing instance) to impose the offset.
   *
   * @param offset The offset to apply to the Query results.
   * @return The created Query.
   */
  offset(offset: number): Query;

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
  select(...field: Array<string | firestore.FieldPath>): Query;

  /**
   * Creates and returns a new Query that starts at the provided document
   * (inclusive). The starting position is relative to the order of the query.
   * The document must contain all of the fields provided in the orderBy of
   * this query.
   *
   * @param snapshot The snapshot of the document to start after.
   * @return The created Query.
   */
  startAt(snapshot: DocumentSnapshot): Query;

  /**
   * Creates and returns a new Query that starts at the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to start this query at, in order
   * of the query's order by.
   * @return The created Query.
   */
  startAt(...fieldValues: any[]): Query;

  /**
   * Creates and returns a new Query that starts after the provided document
   * (exclusive). The starting position is relative to the order of the query.
   * The document must contain all of the fields provided in the orderBy of
   * this query.
   *
   * @param snapshot The snapshot of the document to start after.
   * @return The created Query.
   */
  startAfter(snapshot: DocumentSnapshot): Query;

  /**
   * Creates and returns a new Query that starts after the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to start this query after, in order
   * of the query's order by.
   * @return The created Query.
   */
  startAfter(...fieldValues: any[]): Query;

  /**
   * Creates and returns a new Query that ends before the provided document
   * (exclusive). The end position is relative to the order of the query. The
   * document must contain all of the fields provided in the orderBy of this
   * query.
   *
   * @param snapshot The snapshot of the document to end before.
   * @return The created Query.
   */
  endBefore(snapshot: DocumentSnapshot): Query;

  /**
   * Creates and returns a new Query that ends before the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to end this query before, in order
   * of the query's order by.
   * @return The created Query.
   */
  endBefore(...fieldValues: any[]): Query;

  /**
   * Creates and returns a new Query that ends at the provided document
   * (inclusive). The end position is relative to the order of the query. The
   * document must contain all of the fields provided in the orderBy of this
   * query.
   *
   * @param snapshot The snapshot of the document to end at.
   * @return The created Query.
   */
  endAt(snapshot: DocumentSnapshot): Query;

  /**
   * Creates and returns a new Query that ends at the provided fields
   * relative to the order of the query. The order of the field values
   * must match the order of the order by clauses of the query.
   *
   * @param fieldValues The field values to end this query at, in order
   * of the query's order by.
   * @return The created Query.
   */
  endAt(...fieldValues: any[]): Query;

  /**
   * Executes the query and returns the results as a `QuerySnapshot`.
   *
   * @return A Promise that will be resolved with the results of the Query.
   */
  get(): Promise<QuerySnapshot>;

  /*
   * Executes the query and returns the results as Node Stream.
   *
   * @return A stream of QueryDocumentSnapshot.
   */
  stream(): NodeJS.ReadableStream;

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
  onSnapshot(
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (error: Error) => void
  ): () => void;

  /**
   * Returns true if this `Query` is equal to the provided one.
   *
   * @param other The `Query` to compare against.
   * @return true if this `Query` is equal to the provided one.
   */
  isEqual(other: Query): boolean;
};

/**
 * A `QuerySnapshot` contains zero or more `QueryDocumentSnapshot` objects
 * representing the results of a query. The documents can be accessed as an
 * array via the `docs` property or enumerated using the `forEach` method. The
 * number of documents can be determined via the `empty` and `size`
 * properties.
 */
type QuerySnapshot = {
  /**
   * The query on which you called `get` or `onSnapshot` in order to get this
   * `QuerySnapshot`.
   */
  readonly query: Query;

  /** An array of all the documents in the QuerySnapshot. */
  readonly docs: QueryDocumentSnapshot[];

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
  docChanges(): Array<firestore.DocumentChange>;

  /**
   * Enumerates all of the documents in the QuerySnapshot.
   *
   * @param callback A callback to be called with a `DocumentSnapshot` for
   * each document in the snapshot.
   * @param thisArg The `this` binding for the callback.
   */
  forEach(
    callback: (result: QueryDocumentSnapshot) => void,
    thisArg?: any
  ): void;

  /**
   * Returns true if the document data in this `QuerySnapshot` is equal to the
   * provided one.
   *
   * @param other The `QuerySnapshot` to compare against.
   * @return true if this `QuerySnapshot` is equal to the provided one.
   */
  isEqual(other: QuerySnapshot): boolean;
};

/**
 * A `CollectionReference` object can be used for adding documents, getting
 * document references, and querying for documents (using the methods
 * inherited from `Query`).
 */
type CollectionReference = Query & {
  /** The identifier of the collection. */
  readonly id: string;

  /**
   * A reference to the containing Document if this is a subcollection, else
   * null.
   */
  readonly parent: DocumentReference | null;

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
  listDocuments(): Promise<DocumentReference[]>;

  /**
   * Get a `DocumentReference` for a randomly-named document within this
   * collection. An automatically-generated unique ID will be used as the
   * document ID.
   *
   * @return The `DocumentReference` instance.
   */
  doc(): DocumentReference;

  /**
   * Get a `DocumentReference` for the document within the collection at the
   * specified path.
   *
   * @param documentPath A slash-separated path to a document.
   * @return The `DocumentReference` instance.
   */
  doc(documentPath: string): DocumentReference;

  /**
   * Add a new document to this collection with the specified data, assigning
   * it a document ID automatically.
   *
   * @param data An Object containing the data for the new document.
   * @return A Promise resolved with a `DocumentReference` pointing to the
   * newly created document after it has been written to the backend.
   */
  add(data: DocumentData): Promise<DocumentReference>;

  /**
   * Returns true if this `CollectionReference` is equal to the provided one.
   *
   * @param other The `CollectionReference` to compare against.
   * @return true if this `CollectionReference` is equal to the provided one.
   */
  isEqual(other: CollectionReference): boolean;
};
