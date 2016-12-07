import { Model } from "@lchemy/model";
import { ValidationResult, Validator } from "@lchemy/model/validation";
import { FindAllQuery, FindAllWithCountResult, FindOneQuery, Orm, withTransaction } from "@lchemy/orm";
import { FindQueryField } from "@lchemy/orm/queries/helpers";
import * as Boom from "boom";

import { ModelDao } from "./dao";

const VALID_RESULT: ValidationResult = new ValidationResult(null, null);

export abstract class Service {
}

export abstract class ModelService<O extends Orm, M extends Model, J, A> {
	abstract dao: ModelDao<O, M, J, A>;
	validator?: Validator<M>;

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
		return this.assertValid(model).then(() => {
			return this.dao.insertModelAndFind(model, auth);
		});
	}
	update(model: M, auth?: A): Promise<M> {
		return this.assertValid(model).then(() => {
			return this.dao.updateModelAndFind(model, auth);
		});
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

	validate(model: M): Promise<ValidationResult> {
		if (this.validator == null) {
			return Promise.resolve(VALID_RESULT);
		}
		return this.validator.validate(model);
	}
	protected assertValid(model: M): Promise<void> {
		return this.validate(model).then((res) => {
			if (!res.isValid) {
				let err: Boom.BoomError = Boom.badRequest();
				err.output.payload.errors = res.errors;
				return Promise.reject<void>(err);
			}
		});
	}
}
