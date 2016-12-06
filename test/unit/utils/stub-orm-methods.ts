import * as orm from "@lchemy/orm";
import { SinonSandbox, SinonStub } from "sinon";

const methods: string[] = [
	"findAll",
	"findAllWithCount",
	"findById",
	"findByIds",
	"findCount",
	"findOne",
	"getOrm",
	"insert",
	"insertOne",
	"remove",
	"removeModel",
	"removeModels",
	"update",
	"updateModel",
	"updateModels"
];

export type OrmMethodStubs = {
	findAll: SinonStub,
	findAllWithCount: SinonStub,
	findById: SinonStub,
	findByIds: SinonStub,
	findCount: SinonStub,
	findOne: SinonStub,
	getOrm: SinonStub,
	insert: SinonStub,
	insertOne: SinonStub,
	remove: SinonStub,
	removeModel: SinonStub,
	removeModels: SinonStub,
	update: SinonStub,
	updateModel: SinonStub,
	updateModels: SinonStub,
	withTransaction: SinonStub
};

export function stubOrmMethods(sandbox: SinonSandbox): OrmMethodStubs {
	let stubs: OrmMethodStubs = methods.reduce((memo, method) => {
		memo[method] = sandbox.stub(orm, method);
		return memo;
	}, {} as OrmMethodStubs);
	stubs.withTransaction = sandbox.stub(orm, "withTransaction", (cb: () => any) => {
		return Promise.resolve(cb());
	});
	return stubs;
}
