export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
	}
}

export const notFound = (message: string) => new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)
