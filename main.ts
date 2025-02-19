import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  QueryCreator,
  SelectQueryBuilder,
} from "npm:kysely";

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

db.with("charles", charlesses).with("pauls", () => pauls(db));

//this works at runtime, but the query interface cannot accept QueryCreator<DB & { extended: Thing }>
db.with("charles", charlesses).with("pauls", pauls);
