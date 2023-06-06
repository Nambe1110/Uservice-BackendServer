/* eslint-disable no-undef */
import request from "supertest";
import chai from "chai";
import app from "../src/app.js";

const { expect } = chai;

describe("POST /api/auth/login", () => {
  describe("given a username and password", () => {
    it("should respond with a 200 status code", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test23@gmail.com",
        password: "123456",
      });
      expect(response.statusCode).equal(200);
    });
    it("response has access token", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test23@gmail.com",
        password: "123456",
      });
      console.log(response.body);
      expect(response.body.data).to.have.property("access_token");
      expect(response.body.data).to.have.property("refresh_token");
    });
  });

  describe("when the email or password or both is wrong", () => {
    it("should respond with a status code of 400", async () => {
      const bodyData = [
        {
          email: "test123@gmail.com",
          password: "123456",
        },
        {
          email: "test23@gmail.com",
          password: "12345678",
        },
        {
          email: "test@gmail.com",
          password: "test123456",
        },
      ];
      for (const body of bodyData) {
        const response = await request(app).post("/api/auth/login").send(body);
        expect(response.statusCode).equal(400);
      }
    });
  });
});
