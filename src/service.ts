import { FindAllQuery, FindAllWithCountResult, FindOneQuery, Orm, withTransaction } from "@lchemy/orm";
import { FindQueryField } from "@lchemy/orm/queries/helpers";
import * as Boom from "boom";

import { ModelDao } from "./dao";

export abstract class Service {
}

// TODO: add validator
export abstract class ModelService<O extends Orm, M, J, A> {
	abstract dao: ModelDao<O, M, J, A>;

	get orm(): Promise<O> {
		return this.dao.orm;
	}

	get(builder?: (orm: O) => FindAllQuery, auth?: A): Promise<M[]> {
		return this.dao.findAll(builder, auth);
	}
	getOne(builder?: (orm: O) => FindOneQuery, auth?: A): Promise<M | undefined> {
		return this.dao.findOne(builder, auth);
	}
	getWithCount(builder?: (orm: O) => FindAllQuery, auth?: A): Promise<FindAllWithCountResult<M>> {
		return this.dao.findAllWithCount(builder, auth);
	}
	getById(id: number | string, builder?: (orm: O) => FindQueryField[], auth?: any): Promise<M | undefined> {
		return this.dao.findById(id, builder, auth);
	}
	create(model: M, auth?: A): Promise<M> {
		return this.dao.insertModelAndFind(model, auth);
	}
	update(model: M, auth?: A): Promise<M> {
		return this.dao.updateModelAndFind(model, auth);
	}
	delete(id: number | string, auth?: A): Promise<undefined> {
		return withTransaction((trx) => {
			return this.dao.findById(id, undefined, auth, trx).then((model) => {
				if (model == null) {
					return Promise.reject(Boom.notFound());
				}
				return this.dao.removeModel(model, auth, trx);
			});
		});
	}
}
