import * as Boom from "boom";
import { IRouteHandlerConfig, ISessionHandler, IStrictSessionHandler } from "hapi";

export type RouteHandler = ISessionHandler | IStrictSessionHandler | string | IRouteHandlerConfig;
export function wrapRouteHandler(handler?: RouteHandler, context?: any): RouteHandler | undefined {
	if (typeof handler === "function") {
		return (request, reply) => {
			try {
				handler.call(context, request, reply);
			} catch (e) {
				if (e.isBoom) {
					reply(e);
					return;
				}
				reply(Boom.badImplementation());
			}
		};
	}

	return handler;
}
