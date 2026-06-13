declare module "express" {
	const express: any;
	export const Router: any;
	export default express;
}

declare module "cors" {
	const cors: any;
	export default cors;
}

declare module "http" {
	export function createServer(app: any): any;
}

declare module "socket.io" {
	export class Server<TClient = any, TServer = any> {
		constructor(server: any, options?: any);
		use(fn: any): void;
		on(event: string, handler: any): void;
		to(roomOrId: string): any;
	}
}

declare module "dotenv" {
	const dotenv: { config: () => void };
	export default dotenv;
}

declare module "mongoose" {
	const mongoose: any;
	export const Schema: any;
	export type InferSchemaType<T> = any;
	export default mongoose;
}

declare module "bcryptjs" {
	export function hash(value: string, rounds: number): Promise<string>;
	export function compare(value: string, hashValue: string): Promise<boolean>;
}

declare module "zod" {
	export const z: any;
}

declare module "jsonwebtoken" {
	export function sign(payload: any, secret: string, options?: any): string;
	export function verify(token: string, secret: string): any;
}

declare module "node:crypto" {
	export function randomUUID(): string;
}

interface String {
	at(index: number): string | undefined;
}

interface Array<T> {
	at(index: number): T | undefined;
}

declare const process: any;
