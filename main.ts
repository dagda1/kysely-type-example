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

interface Query<T> {
  (creator: QueryCreator<DB>): SelectQueryBuilder<DB, any, T>;
}

const charlesses: Query<Person> = ({ selectFrom }) =>
  selectFrom("people").where("name", "=", "Charles").selectAll();

const pauls: Query<Person> = ({ selectFrom }) =>
  selectFrom("people").where("name", "=", "Paul").selectAll();

// this works because () => pauls(db) delays execution
// db.with("charles", charlesses) does not modify db itself; it returns a new Kysely instance with an extended type
// if pauls is passed directly, it would be checked against the original db, which does not include { charles: Person }, causing a type mismatch
// wrapping pauls(db) in a function ensures it is evaluated with the new instance that includes { charles: Person }, making it compatible
db.with("charles", charlesses).with("pauls", () => pauls(db));

// this fails because pauls is explicitly typed as Query<Person>, which means it expects QueryCreator<DB>
// however, db.with("charles", charlesses) does not modify db but instead returns a new Kysely instance with an extended type
// when pauls is passed directly, it is still expecting QueryCreator<DB>, but it is now being used with Kysely<DB & { charles: Person }>
// this causes a type mismatch because QueryCreator<DB> is not assignable to QueryCreator<DB & { charles: Person }>
db.with("charles", charlesses).with("pauls", pauls);
