import fp from "fastify-plugin";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public code: string, message: string, public statusCode = 400, public details: unknown = null) { super(message); }
}

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message, details: error.details } });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid request parameters", details: error.flatten() } });
    }
    app.log.error(error);
    return reply.status(500).send({ error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error", details: null } });
  });
});
