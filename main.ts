import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  QueryCreator,
  SelectQueryBuilder,
} from "kysely";

export interface Person {
  dogId: string;
  name: string;
}

export interface Dog {
  ownerId: string;
  name: string;
}

export interface DB {
  people: Person;
  dogs: Dog;
}

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});


// introduce 2 new type parameters
// D: the type of the database that gets augmented with each call to with
// T the key of the DB type that is being selected from, e.g. DB["people"]
interface Query<D extends DB, K extends keyof D> {
  (creator: QueryCreator<D>): SelectQueryBuilder<D, K, D[K]>;
}


const charlesses: Query<DB, "people"> = ({ selectFrom }) =>
  selectFrom("people").where("name", "=", "Charles").selectAll();


// The first call to `with("charles", charlesses)`
// returns a new db type with: { charles: Person } augmented to DB, i.e. DB & { charles: Person }.
//
// When the second `.with("pauls", pauls)` is called, the expected function signature
// is now (creator: QueryCreator<DB & { charles: Person }> => ret
//
// However, `pauls` was originally typed as Query<Person, DB>, which expects QueryCreator<DB>.
// This creates a type mismatch because QueryCreator<DB> is not assignable to QueryCreator<DB & { charles: Person }>.
//
// To fix this, we explicitly define `pauls` as Query<DB & { charles: Person }, "people">, 
// ensuring it aligns with the extended DB type returned by the first `with` call.
const pauls: Query<DB & { charles: Person }, "people"> = ({ selectFrom }) =>
  selectFrom("people").where("name", "=", "Paul").selectAll();
//
// This makes everything type-check correctly.
db.with("charles", charlesses).with("pauls", pauls);

// The main problem is that the argument passed to the `pauls` function is an augmented type that comes from the previous db.with("charles", charlesses) call,
// the `with` function returns a `QueryCreatorWithCommonTableExpression<DB, N, E>`, so you might be able to use that to extract the correct type
