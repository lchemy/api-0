import { Orm, UpdateQuery } from "@lchemy/orm";
import { Field, Filter } from "@lchemy/orm/core";
import { expect } from "chai";
import * as sinon from "sinon";

import { OrmMethodStubs, stubOrmMethods } from "./utils/stub-orm-methods";

import { Dao, ModelDao, ModelDaoFieldsBuilder, ModelDaoFieldsBuilders } from "../../src/dao";

describe("dao", () => {
	let sandbox: sinon.SinonSandbox,
		ormStubs: OrmMethodStubs;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		ormStubs = stubOrmMethods(sandbox);
	});
	afterEach(() => {
		sandbox.restore();
	});

	describe("dao", () => {
		class TestDao extends Dao<any, any, any, any> {
			protected ref: string | symbol = "dummyRef";

			toModel(json: any): { json: any } {
				return {
					json: json
				};
			}
			fromModel(model: { json: any }): any {
				return model.json;
			}
		}

		let dao: TestDao,
			orm: Orm;
		beforeEach(() => {
			orm = {} as any;
			ormStubs.getOrm.withArgs("dummyRef").returns(Promise.resolve(orm));
			dao = new TestDao();

			return Promise.resolve().then(() => {
				expect(ormStubs.getOrm).to.be.calledWith("dummyRef");
			});
		});

		it("should find all", () => {
			ormStubs.findAll.withArgs(orm, undefined, undefined, undefined).returns(Promise.resolve([{
				id: 1
			}, {
				id: 2
			}, {
				id: 3
			}]));

			return dao.findAll().then((models) => {
				expect(ormStubs.findAll).to.be.calledOnce;

				expect(models).to.have.length(3);
				expect(models).to.deep.eq([{
					json: {
						id: 1
					}
				}, {
					json: {
						id: 2
					}
				}, {
					json: {
						id: 3
					}
				}]);
			});
		});

		it("should find all with count", () => {
			ormStubs.findAllWithCount.withArgs(orm, undefined, undefined, undefined).returns(Promise.resolve({
				rows: [{
					id: 1
				}, {
					id: 2
				}, {
					id: 3
				}],
				count: 5
			}));

			return dao.findAllWithCount().then((res) => {
				expect(ormStubs.findAllWithCount).to.be.calledOnce;

				expect(res).to.have.keys("rows", "count");
				expect(res).to.deep.eq({
					rows: [{
						json: {
							id: 1
						}
					}, {
						json: {
							id: 2
						}
					}, {
						json: {
							id: 3
						}
					}],
					count: 5
				});
			});
		});

		it("should find count", () => {
			ormStubs.findCount.withArgs(orm, undefined, undefined, undefined).returns(Promise.resolve(5));

			return dao.findCount().then((count) => {
				expect(ormStubs.findCount).to.be.calledOnce;
				expect(count).to.eq(5);
			});
		});

		it("should find one", () => {
			ormStubs.findOne.withArgs(orm, undefined, undefined, undefined).returns(Promise.resolve({
				id: 1
			}));

			return dao.findOne().then((model) => {
				expect(ormStubs.findOne).to.be.calledOnce;

				expect(model).to.deep.eq({
					json: {
						id: 1
					}
				});
			});
		});

		it("should return undefined if find one finds nothing", () => {
			ormStubs.findOne.withArgs(orm, undefined, undefined, undefined).returns(Promise.resolve(undefined));

			return dao.findOne().then((row) => {
				expect(ormStubs.findOne).to.be.calledOnce;

				expect(row).to.be.undefined;
			});
		});

		it("should insert raw", () => {
			let builder: (orm: Orm) => Array<Field<Orm, any>> = () => [];
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];

			ormStubs.insert.withArgs(orm, builder, jsons, undefined).returns(Promise.resolve([1, 2]));

			return dao.rawInsert(builder, jsons).then((ids) => {
				expect(ormStubs.insert).to.be.calledOnce;

				expect(ids).to.have.length(2);
			});
		});

		it("should insert one raw", () => {
			let builder: (orm: Orm) => Array<Field<Orm, any>> = () => [];
			let json: any = {
				id: 1
			};

			ormStubs.insertOne.withArgs(orm, builder, json, undefined).returns(Promise.resolve(1));

			return dao.rawInsertOne(builder, json).then((id) => {
				expect(ormStubs.insertOne).to.be.calledOnce;

				expect(id).to.eq(1);
			});
		});

		it("should insert", () => {
			let builder: (orm: Orm) => Array<Field<Orm, any>> = () => [];
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];
			let models: Array<{ json: any }> = jsons.map((json) => {
				return {
					json
				};
			});

			ormStubs.insert.withArgs(orm, builder, jsons, undefined).returns(Promise.resolve([1, 2]));

			return dao.insert(builder, models).then((ids) => {
				expect(ormStubs.insert).to.be.calledOnce;

				expect(ids).to.have.length(2);
			});
		});

		it("should insert one", () => {
			let builder: (orm: Orm) => Array<Field<Orm, any>> = () => [];
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.insertOne.withArgs(orm, builder, json, undefined).returns(Promise.resolve(1));

			return dao.insertOne(builder, model).then((id) => {
				expect(ormStubs.insertOne).to.be.calledOnce;

				expect(id).to.eq(1);
			});
		});

		it("should remove", () => {
			let builder: (orm: Orm) => Filter = () => null as any;

			ormStubs.remove.withArgs(orm, builder, undefined, undefined).returns(Promise.resolve(1));

			return dao.remove(builder).then((count) => {
				expect(ormStubs.remove).to.be.calledOnce;

				expect(count).to.eq(1);
			});
		});

		it("should update raw", () => {
			let builder: (orm: Orm) => UpdateQuery<Orm> = () => null as any;
			let json: any = {
				id: 1
			};

			ormStubs.update.withArgs(orm, builder, json, undefined, undefined).returns(Promise.resolve(5));

			return dao.rawUpdate(builder, json).then((count) => {
				expect(ormStubs.update).to.be.calledOnce;

				expect(count).to.eq(5);
			});
		});

		it("should update", () => {
			let builder: (orm: Orm) => UpdateQuery<Orm> = () => null as any;
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.update.withArgs(orm, builder, json, undefined, undefined).returns(Promise.resolve(5));

			return dao.update(builder, model).then((count) => {
				expect(ormStubs.update).to.be.calledOnce;

				expect(count).to.eq(5);
			});
		});
	});

	describe("model dao with fields builders", () => {
		let testDaoFields: ModelDaoFieldsBuilders<Orm> = {
			insert: () => null as any,
			update: () => null as any
		};
		class TestDao extends ModelDao<any, any, any, any> {
			protected ref: string | symbol = "dummyRef";
			protected fields: ModelDaoFieldsBuilders<Orm> = testDaoFields;

			toModel(json: any): { json: any } {
				return {
					json: json
				};
			}
			fromModel(model: { json: any }): any {
				return model.json;
			}
		}

		let dao: TestDao,
			orm: Orm;
		beforeEach(() => {
			orm = {} as any;
			ormStubs.getOrm.withArgs("dummyRef").returns(Promise.resolve(orm));
			dao = new TestDao();

			return Promise.resolve().then(() => {
				expect(ormStubs.getOrm).to.be.calledWith("dummyRef");
			});
		});

		it("should find by id", () => {
			ormStubs.findById.withArgs(orm, 1).returns(Promise.resolve({
				id: 1
			}));

			return dao.findById(1).then((model) => {
				expect(ormStubs.findById).to.be.calledOnce;

				expect(model).to.deep.eq({
					json: {
						id: 1
					}
				});
			});
		});

		it("should return undefined if find by id finds nothing", () => {
			ormStubs.findById.withArgs(orm, 1).returns(Promise.resolve(undefined));

			return dao.findById(1).then((model) => {
				expect(ormStubs.findById).to.be.calledOnce;

				expect(model).to.be.undefined;
			});
		});

		it("should find by ids", () => {
			ormStubs.findByIds.withArgs(orm, [1, 2, 3]).returns(Promise.resolve([{
				id: 1
			}, {
				id: 2
			}, {
				id: 3
			}]));

			return dao.findByIds([1, 2, 3]).then((models) => {
				expect(ormStubs.findByIds).to.be.calledOnce;

				expect(models).to.deep.eq([{
					json: {
						id: 1
					}
				}, {
					json: {
						id: 2
					}
				}, {
					json: {
						id: 3
					}
				}]);
			});
		});

		it("should insert models", () => {
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];
			let models: Array<{ json: any }> = jsons.map((json) => {
				return {
					json
				};
			});

			ormStubs.insert.withArgs(orm, testDaoFields.insert, jsons, undefined).returns(Promise.resolve([1, 2]));

			return dao.insertModels(models).then((ids) => {
				expect(ormStubs.insert).to.be.calledOnce;

				expect(ids).to.have.length(2);
			});
		});

		it("should insert model", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.insertOne.withArgs(orm, testDaoFields.insert, json, undefined).returns(Promise.resolve(1));

			return dao.insertModel(model).then((id) => {
				expect(ormStubs.insertOne).to.be.calledOnce;

				expect(id).to.eq(1);
			});
		});

		it("should insert models and find", () => {
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];
			let models: Array<{ json: any }> = jsons.map((json) => {
				return {
					json
				};
			});

			ormStubs.insert.withArgs(orm, testDaoFields.insert, jsons, undefined).returns(Promise.resolve([1, 2]));
			ormStubs.findByIds.withArgs(orm, [1, 2], undefined, undefined, undefined).returns(Promise.resolve(jsons));

			return dao.insertModelsAndFind(models).then((newModels) => {
				expect(ormStubs.insert).to.be.calledOnce;
				expect(ormStubs.findByIds).to.be.calledOnce;

				expect(newModels).to.deep.eq(models);
			});
		});

		it("should insert model and find", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.insertOne.withArgs(orm, testDaoFields.insert, json, undefined).returns(Promise.resolve(1));
			ormStubs.findById.withArgs(orm, 1, undefined, undefined, undefined).returns(Promise.resolve(json));

			return dao.insertModelAndFind(model).then((newModel) => {
				expect(ormStubs.insertOne).to.be.calledOnce;
				expect(ormStubs.findById).to.be.calledOnce;

				expect(newModel).to.deep.eq(model);
			});
		});

		it("should remove models", () => {
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];
			let models: Array<{ json: any }> = jsons.map((json) => {
				return {
					json
				};
			});

			ormStubs.removeModels.withArgs(orm, jsons, undefined).returns(Promise.resolve(2));

			return dao.removeModels(models).then((count) => {
				expect(ormStubs.removeModels).to.be.calledOnce;

				expect(count).to.eq(2);
			});
		});

		it("should remove model", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.removeModel.withArgs(orm, testDaoFields.insert, json, undefined).returns(Promise.resolve());

			return dao.removeModel(model).then(() => {
				expect(ormStubs.removeModel).to.be.calledOnce;
			});
		});

		it("should update models", () => {
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];
			let models: Array<{ json: any }> = jsons.map((json) => {
				return {
					json
				};
			});

			ormStubs.updateModels.withArgs(orm, testDaoFields.update, jsons, undefined, undefined).returns(Promise.resolve([1, 2]));

			return dao.updateModels(models).then((ids) => {
				expect(ormStubs.updateModels).to.be.calledOnce;

				expect(ids).to.have.length(2);
			});
		});

		it("should update model", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.updateModel.withArgs(orm, testDaoFields.update, json, undefined, undefined).returns(Promise.resolve(1));

			return dao.updateModel(model).then((id) => {
				expect(ormStubs.updateModel).to.be.calledOnce;

				expect(id).to.eq(1);
			});
		});

		it("should update models and find", () => {
			let jsons: any[] = [{
				id: 1
			}, {
				id: 2
			}];
			let models: Array<{ json: any }> = jsons.map((json) => {
				return {
					json
				};
			});

			ormStubs.updateModels.withArgs(orm, testDaoFields.update, jsons, undefined, undefined).returns(Promise.resolve([1, 2]));
			ormStubs.findByIds.withArgs(orm, [1, 2], undefined, undefined, undefined).returns(Promise.resolve(jsons));

			return dao.updateModelsAndFind(models).then((newModels) => {
				expect(ormStubs.updateModels).to.be.calledOnce;
				expect(ormStubs.findByIds).to.be.calledOnce;

				expect(newModels).to.deep.eq(models);
			});
		});

		it("should update model and find", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.updateModel.withArgs(orm, testDaoFields.update, json, undefined, undefined).returns(Promise.resolve(1));
			ormStubs.findById.withArgs(orm, 1, undefined, undefined, undefined).returns(Promise.resolve(json));

			return dao.updateModelAndFind(model).then((newModel) => {
				expect(ormStubs.updateModel).to.be.calledOnce;
				expect(ormStubs.findById).to.be.calledOnce;

				expect(newModel).to.deep.eq(model);
			});
		});
	});

	describe("model dao with fields builder", () => {
		let testDaoFields: ModelDaoFieldsBuilder<Orm> = () => null as any;
		class TestDao extends ModelDao<any, any, any, any> {
			protected ref: string | symbol = "dummyRef";
			protected fields: ModelDaoFieldsBuilder<Orm> = testDaoFields;

			toModel(json: any): { json: any } {
				return {
					json: json
				};
			}
			fromModel(model: { json: any }): any {
				return model.json;
			}
		}

		let dao: TestDao,
			orm: Orm;
		beforeEach(() => {
			orm = {} as any;
			ormStubs.getOrm.withArgs("dummyRef").returns(Promise.resolve(orm));
			dao = new TestDao();

			return Promise.resolve().then(() => {
				expect(ormStubs.getOrm).to.be.calledWith("dummyRef");
			});
		});

		it("should insert model", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.insertOne.withArgs(orm, testDaoFields, json, undefined).returns(Promise.resolve(1));

			return dao.insertModel(model).then((id) => {
				expect(ormStubs.insertOne).to.be.calledOnce;

				expect(id).to.eq(1);
			});
		});

		it("should update model", () => {
			let json: any = {
				id: 1
			};
			let model: { json: any } = {
				json
			};

			ormStubs.updateModel.withArgs(orm, testDaoFields, json, undefined, undefined).returns(Promise.resolve(1));

			return dao.updateModel(model).then((id) => {
				expect(ormStubs.updateModel).to.be.calledOnce;

				expect(id).to.eq(1);
			});
		});
	});
});
