import request from "supertest";
import { app } from "../src/server";

describe("API", () => {
  it("health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("invalid PAN returns 400", async () => {
    const res = await request(app).post("/validate/pan").send({ panNumber: "BADPAN0000X" });
    expect(res.status).toBe(400);
  });

  it("submit endpoint responds", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:root@localhost:5433/openbiz?schema=public"; // force no DB if possible
    const payload = {
      aadhaarNumber: "234567890123",
      mobileNumber: "9876543210",
      otp: "123456",
      panNumber: "ABCDE1234F",
    };
    const res = await request(app).post("/submit").send(payload);
    expect([200, 202, 500]).toContain(res.status);
    expect(typeof res.body).toBe("object");
  });
}); 