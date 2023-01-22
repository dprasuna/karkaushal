import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../app";

declare global {
  var signin: () => Promise<string[]>;
}

let mongo: any;
// Before running all the test connect to mongo memory server
beforeAll(async () => {
  process.env.JWT_KEY = "cc3f7a616e4f7e14c674d03dbd8ff0b77389811401c8a56536ac8b796a93ee7";

  mongo = await MongoMemoryServer.create();
  const mongoURI = mongo.getUri();

  await mongoose.connect(mongoURI);
});
 // delete the collectiion before running each test
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// close the connection after executing all the tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

// a signin function used for the testing of routes which needs authentication
global.signin = async () => {
  const email = "test@test.com";
  const password = "password";

  const response = await request(app)
    .post("/api/users/signup")
    .send({
      email,
      password,
      name: "user",
      gender: "male",
      age: 65,
    })
    .expect(201);

  const cookie = response.get("Set-Cookie");

  return cookie;
};