import { Model } from "@lchemy/model";
import { Orm } from "@lchemy/orm";
import * as Boom from "boom";
import { IDictionary, IReply, IRouteConfiguration, Request } from "hapi";

import { parseFields, parseGetQuery, wrapRouteHandler } from "./helpers";
import { ModelService } from "./service";

export abstract class Controller {
	protected abstract routes: IRouteConfiguration[];

	getRoutes(): IRouteConfiguration[] {
		return this.routes.map((route) => {
			return Object.assign({}, route, {
				handler: wrapRouteHandler(route.handler, this)
			});
		});
	}
}

export interface ModelControllerAuthMap<M extends Model, A> {
	get?: ((auth: A | undefined) => boolean) | null;
	create?: ((auth: A | undefined, model: M) => boolean) | null;
	update?: ((auth: A | undefined, model: M) => boolean) | null;
	delete?: ((auth: A | undefined, model: M) => boolean) | null;
}

export abstract class ModelController<O extends Orm, M extends Model, J, A> extends Controller {
	protected abstract auth: ModelControllerAuthMap<M, A>;
	protected abstract service: ModelService<O, M, J, A>;

	get orm(): Promise<O> {
		return this.service.orm;
	}

	abstract toModel(json: J): M;
	abstract fromModel(model: M): J;
	abstract getId(model: M): number | string | undefined;

	get(request: Request, reply: IReply): void {
		let auth: A | undefined = getCredentials<A>(request);

		assertCredentials<M, A>(request, this.auth.get).then(() => {
			return this.orm;
		}).then((orm) => {
			return parseGetQuery(orm, request.query);
		}).then((query) => {
			return this.service.getWithCount(query != null ? () => query : undefined, auth);
		}).then((result) => {
			return {
				data: result.rows.map((model) => this.fromModel(model)),
				totalCount: result.count
			};
		}).then(reply, reply);
	}
	getById(request: Request, reply: IReply): void {
		let id: number | string = getRequestId(request.params, "id"),
			auth: A | undefined = getCredentials<A>(request);

		assertCredentials<M, A>(request, this.auth.get).then(() => {
			return this.orm;
		}).then((orm) => {
			return parseFields(orm, request.query["fields"]);
		}).then((fields) => {
			return this.service.getById(id, fields != null ? () => fields : undefined, auth);
		}).then<{ data: J }>((model) => {
			if (model == null) {
				return Promise.reject(Boom.notFound());
			}
			return {
				data: this.fromModel(model)
			};
		}).then(reply, reply);
	}
	create(request: Request, reply: IReply): void {
		let auth: A | undefined = getCredentials<A>(request);

		this.payloadToModel(request).then((model) => {
			return assertCredentials<M, A>(request, this.auth.create, model).then(() => {
				return this.service.create(model, auth);
			}).then((newModel) => {
				return {
					data: this.fromModel(newModel)
				};
			});
		}).then(reply, reply);
	}
	update(request: Request, reply: IReply): void {
		let id: number | string = getRequestId(request.params, "id"),
			auth: A | undefined = getCredentials<A>(request);

		this.payloadToModel(request).then((model) => {
			if (this.getId(model) !== id) {
				return Promise.reject(Boom.badRequest());
			}

			return this.service.getById(id, undefined, auth).then((oldModel) => {
				return assertCredentials<M, A>(request, this.auth.update, oldModel);
			}, () => {
				return Promise.reject(Boom.notFound());
			}).then(() => {
				return this.service.update(model, auth);
			}).then((newModel) => {
				return {
					data: this.fromModel(newModel)
				};
			});
		}).then(reply, reply);
	}
	remove(request: Request, reply: IReply): void {
		let id: number | string = getRequestId(request.params, "id"),
			auth: A | undefined = getCredentials<A>(request);

		this.service.getById(id, undefined, auth).then((model) => {
			return assertCredentials<M, A>(request, this.auth.delete, model).then(() => {
				return this.service.delete(id, auth);
			}).then(() => {
				return {
					success: true
				};
			});
		}, () => {
			return Promise.reject(Boom.notFound());
		}).then(reply, reply);
	}

	protected payloadToModel(request: Request): Promise<M> {
		return payloadToModel(request, this.toModel);
	}
}

export function payloadToModel<M extends Model, J>(request: Request, toModel: (json: J) => M): Promise<M> {
	return new Promise((resolve, reject) => {
		try {
			resolve(toModel(request.payload as J));
		} catch (e) {
			reject(Boom.badRequest());
		}
	});
}

export function assertCredentials<M extends Model, A>(request: Request, checkFn?: ((auth: A | undefined, model?: M) => boolean) | null, model?: M): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		if (checkFn === null) {
			resolve();
			return;
		}

		let credentials: A | undefined = getCredentials<A>(request);

		let isAuthorized: boolean;
		if (typeof checkFn === "function") {
			isAuthorized = checkFn(credentials, model);
		} else {
			isAuthorized = (credentials != null);
		}

		if (!isAuthorized) {
			reject(Boom.forbidden());
			return;
		}

		resolve();
	});
}

export function getRequestId(params: IDictionary<string>, key: string): number | string {
	let id: number | string = params[key];
	if (!Number.isNaN(id as any)) {
		id = Number(id);
	}
	return id;
}

export function getCredentials<A>(request: Request): A | undefined {
	return request.auth.credentials != null ? request.auth.credentials : undefined;
}
