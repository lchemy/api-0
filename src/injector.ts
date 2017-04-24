export class Injector {
	private map: Map<any, any> = new Map<any, any>();

	constructor() {
		this.set(Injector, this);
	}

	get<T>(ref: (new() => T) | string | symbol | object): T {
		if (this.map.has(ref)) {
			return this.map.get(ref);
		}

		if (typeof ref !== "function") {
			throw new Error(`Could not resolve ${ ref } for injection.`);
		}

		// TODO: throw circular dependency error instead
		this.map.set(ref, undefined);

		let instance: T = new ref();
		this.map.set(ref, instance);
		return instance;
	}

	set(ref: any, value: any): void {
		if (this.map.has(ref)) {
			throw new Error(`Cannot set ${ ref } for injection multiple times.`);
		}

		this.map.set(ref, value);
	}

	clear(): void {
		this.map.clear();
	}
}

// need to use global to ensure it's a singleton across the process
let injector: Injector;
if (global["injector"] != null) {
	injector = global["injector"];
} else {
	injector = new Injector();
	global["injector"] = injector;
}

export {
	injector
};
