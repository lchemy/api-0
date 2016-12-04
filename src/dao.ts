import {
	FindAllQuery, FindAllWithCountResult, FindOneQuery, Orm, UpdateQuery,
	findAll, findAllWithCount, findById, findByIds, findCount, findOne, getOrm, insert,
	insertOne, remove, removeModel, removeModels, update, updateModel, updateModels, withTransaction
} from "@lchemy/orm";
import { Field, Filter } from "@lchemy/orm/core";
import { FindQueryField } from "@lchemy/orm/queries/helpers";
import * as Knex from "knex";

export abstract  class Dao<O extends Orm, M, J, A> {
	readonly orm: Promise<O> = this.initOrm();

	protected abstract ref: string | symbol;

	abstract toModel(json: J): M;
	abstract fromModel(model: M): J;

	findAll(builder?: (orm: O) => FindAllQuery, auth?: A, trx?: Knex.Transaction): Promise<M[]> {
		return this.orm.then((orm) => {
			return findAll<O, J, A>(orm, builder, auth, trx);
		}).then((rows) => {
			return rows.map((row) => this.toModel(row));
		});
	}
	findAllWithCount(builder?: (orm: O) => FindAllQuery, auth?: A, trx?: Knex.Transaction): Promise<FindAllWithCountResult<M>> {
		return this.orm.then((orm) => {
			return findAllWithCount<O, J, A>(orm, builder, auth, trx);
		}).then((result) => {
			return {
				rows: result.rows.map((row) => this.toModel(row)),
				count: result.count
			};
		});
	}
	findCount(builder?: (orm: O) => Filter, auth?: A, trx?: Knex.Transaction): Promise<number> {
		return this.orm.then((orm) => {
			return findCount<O, A>(orm, builder, auth, trx);
		});
	}
	findOne(builder?: (orm: O) => FindOneQuery, auth?: A, trx?: Knex.Transaction): Promise<M | undefined> {
		return this.orm.then((orm) => {
			return findOne<O, J, A>(orm, builder, auth, trx);
		}).then((row) => {
			return row != null ? this.toModel(row) : undefined;
		});
	}

	rawInsert(builder: (orm: O) => Array<Field<O, any>>, jsons: J[], trx?: Knex.Transaction): Promise<number[]> {
		return this.orm.then((orm) => {
			return insert<O, J>(orm, builder, jsons, trx);
		});
	}
	rawInsertOne(builder: (orm: O) => Array<Field<O, any>>, json: J, trx?: Knex.Transaction): Promise<number> {
		return this.orm.then((orm) => {
			return insertOne<O, J>(orm, builder, json, trx);
		});
	}
	insert(builder: (orm: O) => Array<Field<O, any>>, models: M[], trx?: Knex.Transaction): Promise<number[]> {
		let jsons: J[] = models.map((model) => this.fromModel(model));
		return this.rawInsert(builder, jsons, trx);
	}
	insertOne(builder: (orm: O) => Array<Field<O, any>>, model: M, trx?: Knex.Transaction): Promise<number> {
		let json: J = this.fromModel(model);
		return this.rawInsertOne(builder, json, trx);
	}

	remove(builder: (orm: O) => Filter, auth?: A, trx?: Knex.Transaction): Promise<number> {
		return this.orm.then((orm) => {
			return remove<O, A>(orm, builder, auth, trx);
		});
	}

	rawUpdate(builder: (orm: O) => UpdateQuery<O>, json: J, auth?: A, trx?: Knex.Transaction): Promise<number> {
		return this.orm.then((orm) => {
			return update<O, J, A>(orm, builder, json, auth, trx);
		});
	}
	update(builder: (orm: O) => UpdateQuery<O>, model: M, auth?: A, trx?: Knex.Transaction): Promise<number> {
		let json: J = this.fromModel(model);
		return this.rawUpdate(builder, json, auth, trx);
	}

	private initOrm(): Promise<O> {
		return Promise.resolve().then(() => {
			return getOrm<O>(this.ref).then((orm) => {
				return orm;
			});
		});
	}
}

export type ModelDaoFieldsBuilder<O extends Orm> = (orm: O) => Array<Field<O, any>>;
export type ModelDaoFieldsBuilders<O extends Orm> = {
	insert: ModelDaoFieldsBuilder<O>,
	update: ModelDaoFieldsBuilder<O>
} | ModelDaoFieldsBuilder<O>;
export abstract class ModelDao<O extends Orm, M, J, A> extends Dao<O, M, J, A> {
	protected abstract fields: ModelDaoFieldsBuilders<O>;
	private get insertFields(): ModelDaoFieldsBuilder<O> {
		return typeof this.fields === "object" ? this.fields.insert : this.fields;
	}
	private get updateFields(): ModelDaoFieldsBuilder<O> {
		return typeof this.fields === "object" ? this.fields.update : this.fields;
	}

	findById(id: number | string, builder?: (orm: O) => FindQueryField[], auth?: any, trx?: Knex.Transaction): Promise<M | undefined> {
		return this.orm.then((orm) => {
			return findById<O, J, A>(orm, id, builder, auth, trx);
		}).then((row) => {
			return row != null ? this.toModel(row) : undefined;
		});
	}
	findByIds(ids: number[] | string[], builder?: (orm: O) => FindQueryField[], auth?: any, trx?: Knex.Transaction): Promise<M[]> {
		return this.orm.then((orm) => {
			return findByIds<O, J, A>(orm, ids, builder, auth, trx);
		}).then((rows) => {
			return rows.map((row) => this.toModel(row));
		});
	}

	insertModels(models: M[], trx?: Knex.Transaction): Promise<number[] | string[]> {
		return this.insert(this.insertFields, models, trx);
	}
	insertModel(model: M, trx?: Knex.Transaction): Promise<number | string> {
		return this.insertOne(this.insertFields, model, trx);
	}
	insertModelsAndFind(models: M[], auth?: A, trx?: Knex.Transaction): Promise<M[]> {
		return withTransaction((tx) => {
			return this.insertModels(models, tx).then((ids) => {
				return this.findByIds(ids, undefined, auth, tx);
			});
		}, trx);
	}
	insertModelAndFind(model: M, auth?: A, trx?: Knex.Transaction): Promise<M> {
		return withTransaction((tx) => {
			return this.insertModel(model, tx).then((id) => {
				return this.findById(id, undefined, auth, tx);
			});
		}, trx);
	}

	removeModels(models: M[], auth?: A, trx?: Knex.Transaction): Promise<number> {
		let jsons: J[] = models.map((model) => this.fromModel(model));
		return this.orm.then((orm) => {
			return removeModels<O, J, A>(orm, jsons, auth, trx);
		});
	}
	removeModel(model: M, auth?: A, trx?: Knex.Transaction): Promise<undefined> {
		let json: J = this.fromModel(model);
		return this.orm.then((orm) => {
			return removeModel<O, J, A>(orm, json, auth, trx);
		});
	}

	updateModels(models: M[], auth?: A, trx?: Knex.Transaction): Promise<number[] | string[]> {
		let jsons: J[] = models.map((model) => this.fromModel(model));
		return this.orm.then((orm) => {
			return updateModels<O, J, A>(orm, this.updateFields, jsons, auth, trx);
		});
	}
	updateModel(model: M, auth?: A, trx?: Knex.Transaction): Promise<number | string> {
		let json: J = this.fromModel(model);
		return this.orm.then((orm) => {
			return updateModel<O, J, A>(orm, this.updateFields, json, auth, trx);
		});
	}
	updateModelsAndFind(models: M[], auth?: A, trx?: Knex.Transaction): Promise<M[]> {
		return withTransaction((tx) => {
			return this.updateModels(models, auth, tx).then((ids) => {
				return this.findByIds(ids, undefined, auth, tx);
			});
		}, trx);
	}
	updateModelAndFind(model: M, auth?: A, trx?: Knex.Transaction): Promise<M> {
		return withTransaction((tx) => {
			return this.updateModel(model, auth, tx).then((id) => {
				return this.findById(id, undefined, auth, tx);
			});
		}, trx);
	}
}
